/**
 * 站内搜索验收（PRD F-05 / §7.5 / §9 / AC-5 / AC-10 / AC-11）
 *
 * 为什么必须真浏览器：搜索结果完全在客户端产生（Pagefind wasm + Web Worker），
 * curl 拿到的 HTML 里没有任何结果，只有真跑 JS 才能验。
 *
 * 驱动方式：CDP（Node 内置 WebSocket，零依赖），真 Chrome 无头模式。
 *
 * 用法：
 *   node scripts/qa-search/check-search.mjs                                   # 验本地 dist（内置静态服务器）
 *   node scripts/qa-search/check-search.mjs --base https://ppywww.github.io   # 验线上
 *   node scripts/qa-search/check-search.mjs --json
 */
import fs from 'node:fs';
import process from 'node:process';
import { serveDist } from './lib/serve-dist.mjs';
import { launchChrome, waitFor, DEFAULT_CHROME } from './lib/chrome-cdp.mjs';
import { createReporter } from './lib/report.mjs';

const PROJECT_ROOT = new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const DIST_DIR = PROJECT_ROOT + 'dist';

const STATE_EXPR = "(function () {\n  var input = document.getElementById('search-input');\n  var status = document.getElementById('search-status');\n  var empty = document.getElementById('search-empty');\n  var emptyTitle = document.getElementById('search-empty-title');\n  var items = Array.prototype.slice.call(document.querySelectorAll('.search-result')).map(function (li) {\n    var a = li.querySelector('.search-result__title a');\n    var ex = li.querySelector('.search-result__excerpt');\n    return { url: a ? a.getAttribute('href') : null, title: a ? a.textContent.trim() : null,\n             excerpt: ex ? ex.innerHTML : '', hasMark: !!(ex && ex.querySelector('mark')),\n             date: li.querySelector('time') ? li.querySelector('time').getAttribute('datetime') : null };\n  });\n  return { value: input ? input.value : null, status: status ? status.textContent : null,\n           emptyHidden: empty ? empty.hidden : null, emptyTitle: emptyTitle ? emptyTitle.textContent : null,\n           noindex: !!document.querySelector('meta[name=robots][content*=noindex]'), items: items };\n})()";
const SETTLED_EXPR = "(function () {\n  var s = document.getElementById('search-status');\n  var t = document.getElementById('search-empty-title');\n  if (!s || !t) return false;\n  if (document.querySelectorAll('.search-result').length > 0) return true;\n  if (/^找到 0 条结果$/.test(s.textContent || '')) return true;\n  if (t.textContent === '搜索索引还没就绪' || t.textContent === '搜索出错了') return true;\n  return false;\n})()";

/** AC-5 用例：词取自已发布文章的标题/标签；期望命中的文章 URL */
export const CASES = [
  { id: 'S-4', term: '搭建', expect: '/posts/2026-09-30-build-this-blog/', label: '标题词命中（技术文）' },
  { id: 'S-5', term: '读书笔记', expect: '/posts/2026-09-25-reading-note-template/', label: '标题词命中（读书文）' },
  { id: 'S-6', term: '为什么', expect: '/posts/2026-09-28-why-i-blog/', label: '标题词命中（生活文）' },
  { id: 'S-7', term: '性能优化', expect: '/posts/2026-09-30-build-this-blog/', label: '标签词命中' },
];

/** 记录目标文章在结果里的名次（结果质量，不直接判 AC 通过与否） */
export const QUALITY_TERM = '我为什么开始写博客';

export function parseArgs(argv) {
  const opts = { base: null, json: false, chromePath: process.env.CHROME_PATH || DEFAULT_CHROME, log: process.env.QA_LOG || null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--base') opts.base = argv[++i];
    else if (argv[i] === '--json') opts.json = true;
    else if (argv[i] === '--log') opts.log = argv[++i];
  }
  return opts;
}

async function httpStatus(url) {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    return res.status;
  } catch (err) {
    return 'ERR:' + (err && err.message);
  }
}

export async function run(opts = {}) {
  const rep = createReporter('站内搜索验收（Pagefind · 无头 Chrome 真交互）');
  const step = (m) => {
    const line = new Date().toISOString() + ' ' + m;
    if (opts.log) fs.appendFileSync(opts.log, line + '\n');
  };

  let server = null;
  let origin = opts.base ? opts.base.replace(/\/+$/, '') : null;
  if (!origin) {
    server = await serveDist({ distDir: DIST_DIR, port: 0 });
    origin = server.origin;
  }
  step('origin=' + origin);

  const chrome = await launchChrome({ chromePath: opts.chromePath });
  step('chrome launched');

  /** 打开 /search/ 并用「模拟键入」触发搜索（这是页面真实支持的交互路径） */
  async function typedQuery(term) {
    const page = await chrome.openPage(origin + '/search/');
    await waitFor(page, "!!document.getElementById('search-input')", { timeoutMs: 15000 });
    const typed = await page.evaluate("(async function () {\n  var input = document.getElementById('search-input');\n  input.focus();\n  input.value = __TERM__;\n  input.dispatchEvent(new Event('input', { bubbles: true }));\n  var t0 = performance.now();\n  while (performance.now() - t0 < 15000) {\n    if (document.querySelectorAll('.search-result').length > 0) break;\n    if (/^找到 0 条结果$/.test(document.getElementById('search-status').textContent || '')) break;\n    await new Promise(function (r) { setTimeout(r, 10); });\n  }\n  return { elapsedMs: Math.round(performance.now() - t0) };\n})()".replace('__TERM__', JSON.stringify(term)));
    return { page, typed };
  }

  try {
    rep.note('S-0', '被测目标', origin + '（' + (opts.base ? '线上' : '本地 dist + 内置静态服务器') + '）');

    // ---- 基础可达性 ----
    const searchStatus = await httpStatus(origin + '/search/');
    rep.check('S-1', '/search/ 页面可访问（HTTP 200）', searchStatus === 200, 'HTTP ' + searchStatus);
    const pfStatus = await httpStatus(origin + '/pagefind/pagefind.js');
    rep.check('S-2', 'Pagefind 运行时 /pagefind/pagefind.js 可访问（索引已生成在 dist 内）', pfStatus === 200, 'HTTP ' + pfStatus);
    step('S-1/S-2 done');

    // ---- 空态 ----
    const page0 = await chrome.openPage(origin + '/search/');
    await waitFor(page0, "!!document.getElementById('search-input')", { timeoutMs: 15000 });
    await new Promise((r) => setTimeout(r, 400));
    const s0 = await page0.evaluate(STATE_EXPR);
    rep.check(
      'S-3',
      '空态（未输入）= 「输入关键词开始搜索」且无结果项',
      s0.emptyTitle === '输入关键词开始搜索' && s0.items.length === 0 && !s0.status,
      JSON.stringify({ emptyTitle: s0.emptyTitle, status: s0.status, items: s0.items.length }),
    );
    rep.check('S-3b', '搜索页带 noindex（工具页不进搜索引擎索引）', s0.noindex === true, 'meta robots noindex = ' + s0.noindex);
    step('S-3 done');

    // ---- AC-5：中文关键词命中 ----
    const allUrls = [];
    for (const c of CASES) {
      const { page, typed } = await typedQuery(c.term);
      await waitFor(page, SETTLED_EXPR, { timeoutMs: 20000 });
      const st = await page.evaluate(STATE_EXPR);
      const urls = st.items.map((i) => i.url);
      allUrls.push.apply(allUrls, urls);
      const hit = urls.some((u) => (u || '').indexOf(c.expect) !== -1);
      rep.check(
        c.id,
        'AC-5 「' + c.term + '」命中 ' + c.expect,
        hit,
        '状态=' + JSON.stringify(st.status) + ' · 结果数=' + st.items.length + ' · URLs=' + JSON.stringify(urls),
      );
      const marked = st.items.filter((i) => i.hasMark).length;
      rep.check(c.id + 'm', '「' + c.term + '」结果含 <mark> 高亮', marked > 0, '带高亮结果数 = ' + marked + ' / ' + st.items.length);
      const countMatch = (st.status || '').match(/^找到 (\d+) 条结果$/);
      const domCount = countMatch ? Number(countMatch[1]) : -1;
      rep.check(c.id + 'c', '「' + c.term + '」计数文案与列表项数一致', domCount === st.items.length, '文案=' + JSON.stringify(st.status) + ' · DOM 结果项=' + st.items.length);
      rep.note(c.id + 'rank', '「' + c.term + '」目标文章名次', '第 ' + (urls.indexOf(c.expect) + 1) + ' 位 / 共 ' + urls.length + ' 条（首条=' + JSON.stringify(urls[0]) + '）· 键入到出结果 ' + typed.elapsedMs + 'ms');
      await page.close();
      step(c.id + ' done');
    }

    // ---- 无结果态 ----
    const { page: pageEmpty } = await typedQuery('龘龘龘');
    await waitFor(pageEmpty, SETTLED_EXPR, { timeoutMs: 20000 });
    const se = await pageEmpty.evaluate(STATE_EXPR);
    const hasExit = await pageEmpty.evaluate("!!document.querySelector('#search-empty-actions a[href=\"/posts/\"]')");
    rep.check(
      'S-8',
      '无结果态：计数 0 + 友好文案 + 出口链接（浏览全部文章）',
      se.status === '找到 0 条结果' && se.emptyTitle === '没有找到匹配的内容' && hasExit === true,
      JSON.stringify({ status: se.status, emptyTitle: se.emptyTitle, hasExit: hasExit }),
    );
    await pageEmpty.close();
    step('S-8 done');

    // ---- 输入即搜 / 防抖 200ms ----
    const pageType = await chrome.openPage(origin + '/search/');
    await waitFor(pageType, "!!document.getElementById('search-input')", { timeoutMs: 15000 });
    const typed = await pageType.evaluate("(async function () {\n  var input = document.getElementById('search-input');\n  input.focus();\n  input.value = __TERM__;\n  input.dispatchEvent(new Event('input', { bubbles: true }));\n  var t0 = performance.now();\n  while (performance.now() - t0 < 15000) {\n    if (document.querySelectorAll('.search-result').length > 0) break;\n    if (/^找到 0 条结果$/.test(document.getElementById('search-status').textContent || '')) break;\n    await new Promise(function (r) { setTimeout(r, 10); });\n  }\n  return { elapsedMs: Math.round(performance.now() - t0) };\n})()".replace('__TERM__', JSON.stringify('博客')));
    const afterType = await pageType.evaluate(STATE_EXPR);
    rep.check(
      'S-9',
      '输入即搜（键入后自动出结果）且首条结果延迟 >= 200ms（防抖生效）',
      afterType.items.length > 0 && typed.elapsedMs >= 180,
      JSON.stringify({ elapsedMs: typed.elapsedMs, status: afterType.status, count: afterType.items.length }),
    );

    // ---- Esc 清空 ----
    const afterEsc = await pageType.evaluate(
      "(async function () { var i = document.getElementById('search-input'); i.focus();" +
        " i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));" +
        " await new Promise(function (r) { setTimeout(r, 300); });" +
        " return { value: i.value, items: document.querySelectorAll('.search-result').length," +
        "          status: document.getElementById('search-status').textContent," +
        "          emptyTitle: document.getElementById('search-empty-title').textContent }; })()",
    );
    rep.check(
      'S-10',
      'Esc 清空输入并回到空态（PRD §9 / 设计系统 K7）',
      afterEsc.value === '' && afterEsc.items === 0 && afterEsc.emptyTitle === '输入关键词开始搜索',
      JSON.stringify(afterEsc),
    );

    // ---- 结果链接形态与可达性 ----
    await pageType.evaluate("(async function () {\n  var input = document.getElementById('search-input');\n  input.focus();\n  input.value = __TERM__;\n  input.dispatchEvent(new Event('input', { bubbles: true }));\n  var t0 = performance.now();\n  while (performance.now() - t0 < 15000) {\n    if (document.querySelectorAll('.search-result').length > 0) break;\n    if (/^找到 0 条结果$/.test(document.getElementById('search-status').textContent || '')) break;\n    await new Promise(function (r) { setTimeout(r, 10); });\n  }\n  return { elapsedMs: Math.round(performance.now() - t0) };\n})()".replace('__TERM__', JSON.stringify('博客')));
    const stLinks = await pageType.evaluate(STATE_EXPR);
    rep.check('S-11', '结果链接全部是站内路径', stLinks.items.length > 0 && stLinks.items.every((i) => (i.url || '').indexOf('/') === 0), JSON.stringify(stLinks.items.map((i) => i.url)));
    if (stLinks.items.length) {
      const codes = [];
      for (const item of stLinks.items.slice(0, 5)) codes.push(item.url + '=' + (await httpStatus(origin + item.url)));
      rep.check('S-11b', '结果链接目标可访问（HTTP 200，抽样前 5 条）', codes.every((c) => c.endsWith('=200')), codes.join(', '));
    }
    const resources = await pageType.evaluate("performance.getEntriesByType('resource').map(function (e) { return e.name; }).filter(function (n) { return n.indexOf('/pagefind/') !== -1; })");
    rep.check('S-12', '运行时确实加载了 /pagefind/ 索引资源', Array.isArray(resources) && resources.length > 0, JSON.stringify(resources));
    step('S-9..S-12 done');

    // ---- 键盘：↑/↓ 在结果间移动焦点（AC-11 / 设计系统 K7）----
    const pageKb = await chrome.openPage(origin + '/search/');
    await waitFor(pageKb, "!!document.getElementById('search-input')", { timeoutMs: 15000 });
    await pageKb.evaluate("(async function () {\n  var input = document.getElementById('search-input');\n  input.focus();\n  input.value = __TERM__;\n  input.dispatchEvent(new Event('input', { bubbles: true }));\n  var t0 = performance.now();\n  while (performance.now() - t0 < 15000) {\n    if (document.querySelectorAll('.search-result').length > 0) break;\n    if (/^找到 0 条结果$/.test(document.getElementById('search-status').textContent || '')) break;\n    await new Promise(function (r) { setTimeout(r, 10); });\n  }\n  return { elapsedMs: Math.round(performance.now() - t0) };\n})()".replace('__TERM__', JSON.stringify('为什么')));
    await waitFor(pageKb, SETTLED_EXPR, { timeoutMs: 20000 });
    // 注意：↑/↓ 需要 ≥2 条结果才能验；采用 data-pagefind-body 之后「搭建」只剩 1 条，
    // 改用能命中 3 条的「为什么」（见 S-6），断言同时要求 links >= 2，避免测试自身失真。
    const kb = await pageKb.evaluate(
      "(async function () {" +
      "  var input = document.getElementById('search-input');" +
      "  input.focus();" +
      "  var links = Array.prototype.slice.call(document.querySelectorAll('.search-result__title a'));" +
      "  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));" +
      "  await new Promise(function (r) { setTimeout(r, 60); });" +
      "  var firstFocused = document.activeElement === links[0];" +
      "  if (document.activeElement) document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));" +
      "  await new Promise(function (r) { setTimeout(r, 60); });" +
      "  var secondIndex = links.indexOf(document.activeElement);" +
      "  if (document.activeElement) document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));" +
      "  await new Promise(function (r) { setTimeout(r, 60); });" +
      "  var backIndex = links.indexOf(document.activeElement);" +
      "  return { links: links.length, firstFocused: firstFocused, secondIndex: secondIndex, backIndex: backIndex };" +
      "})()",
    );
    rep.check(
      'S-15',
      '键盘 ↑/↓ 在结果链接间移动焦点（AC-11 前置）',
      kb.links > 1 && kb.firstFocused === true && kb.secondIndex === 1 && kb.backIndex === 0,
      JSON.stringify(kb),
    );
    await pageKb.close();
    step('S-15 done');

    // ---- 深链 / 404 表单入口：?q= 是否被消费（实现缺陷探测）----
    const pageDeep = await chrome.openPage(origin + '/search/?q=' + encodeURIComponent('搭建'));
    await waitFor(pageDeep, "!!document.getElementById('search-input')", { timeoutMs: 15000 });
    await new Promise((r) => setTimeout(r, 1500));
    const deep = await pageDeep.evaluate(STATE_EXPR);
    rep.check(
      'D-1',
      '深链 /search/?q=搭建 应回填关键词并自动搜索（404 搜索框、分享链接依赖它）',
      deep.value === '搭建' && deep.items.length > 0,
      '输入框实际值=' + JSON.stringify(deep.value) + ' · 状态=' + JSON.stringify(deep.status) + ' · 结果数=' + deep.items.length + ' · 空态文案=' + JSON.stringify(deep.emptyTitle),
    );
    await pageDeep.close();
    step('D-1 done');

    // ---- 索引卫生：工具页是否污染结果 ----
    const hygiene = [
      { term: '这个页面走丢了', bad: '/404', why: '404 页不应作为搜索结果' },
      { term: '输入关键词开始搜索', bad: '/search/', why: '搜索页自身不应进入结果' },
    ];
    for (const h of hygiene) {
      const { page } = await typedQuery(h.term);
      await waitFor(page, SETTLED_EXPR, { timeoutMs: 20000 });
      const st = await page.evaluate(STATE_EXPR);
      const polluted = st.items.map((i) => i.url).filter((u) => (u || '').indexOf(h.bad) === 0);
      rep.check('S-13:' + h.bad, '索引卫生：' + h.why, polluted.length === 0, '结果 URLs = ' + JSON.stringify(st.items.map((i) => i.url)));
      await page.close();
    }
    step('S-13 done');

    // ---- 0 结果时应清空上一次的结果列表（同页连续查询）----
    const pageStale = await chrome.openPage(origin + '/search/');
    await waitFor(pageStale, "!!document.getElementById('search-input')", { timeoutMs: 15000 });
    const firstQ = await pageStale.evaluate("(async function () {\n  var input = document.getElementById('search-input');\n  input.focus();\n  input.value = __TERM__;\n  input.dispatchEvent(new Event('input', { bubbles: true }));\n  var t0 = performance.now();\n  while (performance.now() - t0 < 15000) {\n    if (document.querySelectorAll('.search-result').length > 0) break;\n    if (/^找到 0 条结果$/.test(document.getElementById('search-status').textContent || '')) break;\n    await new Promise(function (r) { setTimeout(r, 10); });\n  }\n  return { elapsedMs: Math.round(performance.now() - t0) };\n})()".replace('__TERM__', JSON.stringify('搭建')));
    await waitFor(pageStale, SETTLED_EXPR, { timeoutMs: 20000 });
    const before = await pageStale.evaluate(STATE_EXPR);
    await pageStale.evaluate("(async function () {\n  var input = document.getElementById('search-input');\n  input.focus();\n  input.value = __TERM__;\n  input.dispatchEvent(new Event('input', { bubbles: true }));\n  var t0 = performance.now();\n  while (performance.now() - t0 < 15000) {\n    if (document.querySelectorAll('.search-result').length > 0) break;\n    if (/^找到 0 条结果$/.test(document.getElementById('search-status').textContent || '')) break;\n    await new Promise(function (r) { setTimeout(r, 10); });\n  }\n  return { elapsedMs: Math.round(performance.now() - t0) };\n})()".replace('__TERM__', JSON.stringify('龘龘龘')));
    const afterNoHit = await pageStale.evaluate(
      "(async function () { var t0 = performance.now();" +
      " while (performance.now() - t0 < 15000) {" +
      "   if (/^找到 0 条结果$/.test(document.getElementById('search-status').textContent || '')) break;" +
      "   await new Promise(function (r) { setTimeout(r, 15); }); }" +
      " return { status: document.getElementById('search-status').textContent," +
      "          dom: document.querySelectorAll('.search-result').length," +
      "          emptyTitle: document.getElementById('search-empty-title').textContent," +
      "          emptyHidden: document.getElementById('search-empty').hidden }; })()",
    );
    rep.check(
      'S-14',
      '同一页从「有结果」切到「0 结果」时，上一次的结果列表被清空',
      afterNoHit.status === '找到 0 条结果' && afterNoHit.dom === 0,
      '第一次查询（搭建）结果数=' + before.items.length + ' → 改为 0 命中词（龘龘龘）后：文案=' + JSON.stringify(afterNoHit.status) +
        ' · 空态=' + JSON.stringify(afterNoHit.emptyTitle) + ' · 空态可见=' + !afterNoHit.emptyHidden +
        ' · 仍在 DOM 里的旧结果数=' + afterNoHit.dom,
    );
    await pageStale.close();
    step('S-14 done');

    // ---- 完整标题长查询（工具限制，记录不判死）----
    const { page: pageLong } = await typedQuery(QUALITY_TERM);
    await waitFor(pageLong, SETTLED_EXPR, { timeoutMs: 20000 });
    const longQ = await pageLong.evaluate(STATE_EXPR);
    rep.note(
      'Q-3',
      '完整标题长查询（工具限制，非 AC-5 判定项）',
      '「' + QUALITY_TERM + '」→ ' + JSON.stringify(longQ.status) + '；同一标题的短词「为什么」可命中。Pagefind zh-cn 无词干/无部分匹配（ADR-001 §9 U6 已标该风险）',
    );
    await pageLong.close();

    // ---- 结果质量：非文章结果占比 ----
    const nonArticle = allUrls.filter((u) => !/^\/posts\/[^/]+\/$/.test(u || ''));
    rep.note('Q-1', '结果构成（4 次查询合计）', '总结果 ' + allUrls.length + ' 条，其中非文章页 ' + nonArticle.length + ' 条：' + JSON.stringify(Array.from(new Set(nonArticle))));
    rep.check(
      'Q-2',
      '搜索结果以文章为主（非文章页占比 < 50%）',
      allUrls.length > 0 && nonArticle.length / allUrls.length < 0.5,
      nonArticle.length + ' / ' + allUrls.length + ' 条非文章页（根因：全站未标 data-pagefind-body，Pagefind 索引整页，标签/分类/首页/归档页文字一并进索引；修复点在 PostLayout.astro 或列表页，超出 task-8 写入范围）',
    );

    await page0.close();
    await pageType.close();
  } finally {
    step('closing');
    await chrome.close();
    if (server) await server.close();
    step('closed');
  }

  if (!opts.json) rep.print();
  return { report: rep, summary: rep.summary(), results: rep.results };
}

const invokedDirectly = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/qa-search/check-search.mjs');
if (invokedDirectly) {
  const opts = parseArgs(process.argv.slice(2));
  const out = await run(opts);
  if (opts.json) console.log(JSON.stringify({ summary: out.summary, results: out.results }, null, 2));
  process.exit(out.report.exitCode());
}
