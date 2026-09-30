/**
 * RSS 验收（PRD F-09 / §5 / AC-8）
 *
 * 用法：
 *   node scripts/qa-search/check-rss.mjs
 *   node scripts/qa-search/check-rss.mjs --base https://ppywww.github.io
 *   node scripts/qa-search/check-rss.mjs --json
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createReporter } from './lib/report.mjs';
import { readSiteConsts, listPostRoutes } from './lib/dist-info.mjs';
import { inspectXml } from './lib/xml-check.mjs';
import { DEFAULT_CHROME } from './lib/chrome-cdp.mjs';

const PROJECT_ROOT = new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const DIST_DIR = PROJECT_ROOT + 'dist';

const RSS_EXTRACT = "(doc) => {\n  const txt = (el, sel) => { const n = el.querySelector(sel); return n ? n.textContent : null; };\n  const ch = doc.querySelector('channel');\n  const items = Array.prototype.slice.call(doc.querySelectorAll('item')).map((it) => ({\n    title: txt(it, 'title'), link: txt(it, 'link'), guid: txt(it, 'guid'),\n    description: txt(it, 'description'), pubDate: txt(it, 'pubDate'),\n    categories: Array.prototype.slice.call(it.querySelectorAll('category')).map((c) => c.textContent),\n  }));\n  return {\n    rootName: doc.documentElement.tagName,\n    rssVersion: doc.documentElement.getAttribute('version'),\n    title: ch ? txt(ch, 'title') : null,\n    link: ch ? txt(ch, 'link') : null,\n    description: ch ? txt(ch, 'description') : null,\n    language: ch ? txt(ch, 'language') : null,\n    itemCount: items.length,\n    items: items,\n  };\n}";

const RFC822 = /^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} (GMT|[+-]\d{4})$/;

export function parseArgs(argv) {
  const opts = { base: null, json: false, chromePath: process.env.CHROME_PATH || DEFAULT_CHROME };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--base') opts.base = argv[++i];
    else if (argv[i] === '--json') opts.json = true;
  }
  return opts;
}

export async function run(opts = {}) {
  const rep = createReporter('RSS 验收（@astrojs/rss 产物）');
  const consts = readSiteConsts(PROJECT_ROOT);
  const origin = (opts.base ? opts.base : consts.url).replace(/\/+$/, '');

  let xml = null;
  if (opts.base) {
    const res = await fetch(origin + '/rss.xml');
    xml = await res.text();
    rep.check('R-1', '线上 /rss.xml 返回 200', res.status === 200, 'HTTP ' + res.status + ' · content-type=' + (res.headers.get('content-type') || ''));
  } else {
    const file = path.join(DIST_DIR, 'rss.xml');
    if (!fs.existsSync(file)) {
      rep.fail('R-1', 'dist/rss.xml 存在', '未找到 ' + file);
      if (!opts.json) rep.print();
      return { report: rep, summary: rep.summary(), results: rep.results };
    }
    xml = fs.readFileSync(file, 'utf8');
    rep.pass('R-1', 'dist/rss.xml 存在', path.relative(PROJECT_ROOT, file) + ' · ' + Buffer.byteLength(xml) + ' 字节');
  }

  // ---- 静态审查：引用而非硬编码 ----
  const rssTs = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'pages', 'rss.xml.ts'), 'utf8');
  rep.check('R-2', 'rss.xml.ts 引用 SITE.description（而非硬编码文案）', rssTs.indexOf('SITE.description') !== -1, 'SITE.description 出现次数 = ' + (rssTs.split('SITE.description').length - 1));
  const hardcoded = consts.description ? rssTs.indexOf(consts.description) !== -1 : false;
  rep.check('R-3', 'rss.xml.ts 内不存在 SITE.description 的字面量副本', !hardcoded, hardcoded ? '发现硬编码副本：' + consts.description : '未发现副本');
  const draftExpr = (rssTs.match(/import\.meta\.env\.PROD[^\n]*/g) || []).join(' / ');
  rep.check('R-4', 'rss.xml.ts 只收录已发布文章（存在 draft 过滤表达式）', /!data\.draft/.test(rssTs), draftExpr || '未找到过滤表达式');

  // ---- 真解析 ----
  const parsed = await inspectXml(xml, RSS_EXTRACT, { chromePath: opts.chromePath });
  rep.check('R-5', 'XML 合法（Chrome DOMParser 无 parsererror）', parsed.wellFormed === true, parsed.parseError || '根元素 = ' + parsed.rootName);
  if (!parsed.wellFormed) {
    if (!opts.json) rep.print();
    return { report: rep, summary: rep.summary(), results: rep.results };
  }
  const d = parsed.data;
  rep.check('R-6', '根元素为 rss version="2.0"', d.rootName === 'rss' && d.rssVersion === '2.0', 'root=' + d.rootName + ' version=' + d.rssVersion);
  rep.check('R-7', 'channel/title = SITE.title（' + consts.title + '）', d.title === consts.title, '实际 = ' + JSON.stringify(d.title));
  rep.check('R-8', 'channel/description 与 src/consts.ts 的 SITE.description 逐字符相同（含弯引号 ’）', d.description === consts.description, '实际 = ' + JSON.stringify(d.description) + ' | 期望 = ' + JSON.stringify(consts.description));
  rep.check('R-9', 'channel/link 为绝对地址且指向站点根', d.link === consts.url + '/', '实际 = ' + JSON.stringify(d.link));
  rep.check('R-10', 'channel/language = ' + consts.lang, d.language === consts.lang, '实际 = ' + JSON.stringify(d.language));

  // ---- item 校验 ----
  const expectedPosts = listPostRoutes(DIST_DIR);
  const expectedCount = opts.base ? null : expectedPosts.length;
  rep.note('R-11', 'item 数对照', 'RSS item = ' + d.itemCount + (expectedCount === null ? '（线上模式）' : ' · dist 已发布文章 = ' + expectedCount));
  if (expectedCount !== null) {
    rep.check('R-12', 'item 数 = dist 已发布文章数', d.itemCount === expectedCount, d.itemCount + ' vs ' + expectedCount);
  }

  const bad = [];
  for (const it of d.items) {
    if (!it.title) bad.push('缺 title');
    if (!it.link || it.link.indexOf(consts.url) !== 0) bad.push('link 非绝对站内地址：' + it.link);
    if (!it.guid) bad.push('缺 guid：' + it.title);
    if (!it.description) bad.push('缺 description：' + it.title);
    if (!it.pubDate) bad.push('缺 pubDate：' + it.title);
    else if (!RFC822.test(it.pubDate) || Number.isNaN(Date.parse(it.pubDate))) bad.push('pubDate 非法：' + it.pubDate);
  }
  rep.check('R-13', '每个 item 都含 title/link/guid/description/合法 RFC-822 pubDate', bad.length === 0, bad.length ? bad.join('; ') : d.items.length + ' 条全部合规');

  const times = d.items.map((i) => Date.parse(i.pubDate));
  rep.check('R-14', 'item 按 pubDate 倒序（最新在前）', times.every((t, i) => i === 0 || times[i - 1] >= t), JSON.stringify(d.items.map((i) => i.pubDate)));
  rep.check(
    'R-15',
    '每条 item 的 link 都能对上真实存在的文章路由',
    opts.base ? true : d.items.every((i) => expectedPosts.some((p) => i.link === consts.url + p.url)),
    opts.base ? '线上模式跳过 dist 对齐' : JSON.stringify(d.items.map((i) => i.link)),
  );
  rep.note('R-16', 'item 摘要样例', JSON.stringify(d.items[0] ? { title: d.items[0].title, pubDate: d.items[0].pubDate, description: (d.items[0].description || '').slice(0, 60) + '…' } : null));
  rep.note('R-17', '草稿排除的运行时验证', '当前 src/content/posts 下无 draft:true 样本 → 运行时行为无法验证（仅静态审查 R-4）');

  if (!opts.json) rep.print();
  return { report: rep, summary: rep.summary(), results: rep.results };
}

const invokedDirectly = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/qa-search/check-rss.mjs');
if (invokedDirectly) {
  const opts = parseArgs(process.argv.slice(2));
  const out = await run(opts);
  if (opts.json) console.log(JSON.stringify({ summary: out.summary, results: out.results }, null, 2));
  process.exit(out.report.exitCode());
}
