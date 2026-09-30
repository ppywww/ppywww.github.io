/**
 * 强调色变量「静默失效」专项验证（task-20 / v1.1-A 换肤）
 *
 * 要防的事：tokens.css 里的 CSS 变量被改名/删除时——**构建照样是绿的、Lighthouse 也不响**，
 * 只有页面悄悄掉色。所以本脚本不问「构建过了吗」，只问三件事：
 *   ① 这些变量在**线上产物 CSS** 里到底有没有有效定义？
 *   ② 引用它们的选择器规则是否还在？每条规则解析到的**具体值**是多少？
 *   ③ 有没有任何一处引用解析不到值（= 静默失效）？
 *
 * 用法：
 *   node scripts/qa-search/check-theme-tokens.mjs
 *   node scripts/qa-search/check-theme-tokens.mjs --base https://ppywww.github.io
 *   node scripts/qa-search/check-theme-tokens.mjs --json
 */
import process from 'node:process';
import { createReporter, finish } from './lib/report.mjs';
import { safeFetchText } from './lib/fetch-safe.mjs';

const ACCENT_VARS = ['--color-accent', '--color-accent-text', '--color-accent-hover', '--color-on-accent', '--color-focus'];

/**
 * 8 个「v1.1-A 写范围之外」的引用点。
 * 两种定位方式取并集：
 *   · re：按选择器子串匹配（适用于规则在共享样式表里的情况）
 *   · src：按**规则来源页面**匹配（Astro 会把小体积 scoped CSS 内联进该页 HTML，
 *          404 这类页面只有按来源找才不会漏）
 */
const AREAS = [
  { key: 'Toc', label: '文章页目录（Toc.astro）', re: /\.toc/, src: 'inline:/posts/2026-09-30-build-this-blog/' },
  { key: 'TermPill', label: '标签胶囊（TermPill.astro）', re: /\.tag-pill|\.tag\b/, src: 'inline:/tags/' },
  { key: 'search', label: '搜索页（search.astro）', re: /\.search/, src: 'inline:/search/' },
  { key: 'PostLayout', label: '文章页（PostLayout.astro）', re: /\.post/, src: 'inline:/posts/2026-09-30-build-this-blog/' },
  { key: 'ArchiveEntry', label: '归档条目（ArchiveEntry.astro）', re: /\.archive/, src: 'inline:/archives/' },
  { key: 'Pagination', label: '分页（Pagination.astro）', re: /\.pagination/, src: 'inline:/posts/' },
  { key: '404', label: '404 页（404.astro）', re: null, src: 'inline:/404.html' },
  { key: 'prose', label: '正文链接（prose.css）', re: /\.prose/, src: null },
];

/** 样式表 URL → 便于人读的短名 */
function sheetLabel(url) {
  if (url.startsWith('inline:')) return url.slice('inline:'.length) || '(内联样式)';
  return url.split('/').pop() || url;
}

/** 取 CSS 的代表性页面（各页面有各自 scoped 样式，收集齐才能覆盖 8 个区域） */
const PAGES = ['/', '/posts/2026-09-30-build-this-blog/', '/posts/', '/archives/', '/tags/', '/tags/Astro/', '/categories/', '/search/', '/404.html', '/works/', '/about/'];

function parseArgs(argv) {
  const opts = { base: 'https://ppywww.github.io', json: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--base') opts.base = argv[++i];
    else if (argv[i] === '--json') opts.json = true;
  }
  return opts;
}

/**
 * 收集样式：**外链样式表 + 页面内联 <style> 都要收**。
 * 踩过的坑：Astro 会把小体积 scoped CSS 直接内联进 HTML，只抓 <link> 会漏掉
 * TermPill/search/404/Pagination/ArchiveEntry 这些页面的规则，从而误报「规则不存在」。
 */
async function collectCss(origin) {
  const urls = new Set();
  const pages = [];
  const inlineSheets = [];
  for (const p of PAGES) {
    const got = await safeFetchText(origin + p);
    if (!got.ok) continue;
    pages.push(p);
    const re = /<link[^>]+rel="stylesheet"[^>]*>/g;
    let m;
    while ((m = re.exec(got.text)) !== null) {
      const href = /href="([^"]+)"/.exec(m[0]);
      if (!href) continue;
      const abs = href[1].startsWith('http') ? href[1] : origin + href[1];
      if (abs.startsWith(origin)) urls.add(abs);
    }
    const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/g;
    let s;
    while ((s = styleRe.exec(got.text)) !== null) {
      if (s[1].trim()) inlineSheets.push({ url: 'inline:' + p, css: s[1] });
    }
  }
  const sheets = [];
  for (const u of urls) {
    const got = await safeFetchText(u);
    if (got.ok) sheets.push({ url: u, css: got.text });
  }
  return { pages, sheets: sheets.concat(inlineSheets) };
}

/**
 * 轻量 CSS 扫描：只做两件事——收集自定义属性定义、收集 var() 引用，并记住各自的
 * 选择器与所在 at-rule（如 @media (prefers-color-scheme: dark)）。
 * 不做完整层叠计算；但每个结论都会打印它依据的「定义处上下文」，便于人工复核。
 */
function scanCss(rawCss) {
  // 去掉注释：注释里的 {} 与分号会打乱朴素扫描
  const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, '');
  const defs = [];
  const refs = [];
  const stack = [];
  let buf = '';

  function handleDecl(decl) {
    const text = decl.trim();
    if (!text) return;
    const selector = stack.filter((s) => !s.startsWith('@')).join(' ') || '(顶层)';
    const atRule = stack.filter((s) => s.startsWith('@')).join(' ') || '';
    const varDef = /^(--[a-z0-9-]+)\s*:\s*(.+)$/i.exec(text);
    if (varDef) defs.push({ name: varDef[1], value: varDef[2].trim(), selector, atRule });
    const varUse = /var\(\s*(--[a-z0-9-]+)\s*(?:,\s*([^)]+))?\)/gi;
    let u;
    while ((u = varUse.exec(text)) !== null) {
      refs.push({ name: u[1], fallback: u[2] ? u[2].trim() : null, prop: text.split(':')[0].trim(), selector, atRule });
    }
  }

  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') {
      stack.push(buf.trim().replace(/\s+/g, ' '));
      buf = '';
      continue;
    }
    if (ch === '}') {
      // 压缩后的 CSS 里，块内最后一条声明没有分号 → 必须在 } 处补收，否则会漏定义
      handleDecl(buf);
      buf = '';
      stack.pop();
      continue;
    }
    if (ch === ';') {
      handleDecl(buf);
      buf = '';
      continue;
    }
    buf += ch;
  }
  return { defs, refs };
}

/**
 * 某个变量在指定模式下的有效定义。
 *
 * ⚠️ 这里必须按真实级联语义来（本工具第一版就栽在这）：
 *   --palette-* 这类基础变量只在 :root 定义一次，暗色模式并不重新定义它们，
 *   而是靠「:root.dark 覆盖部分语义变量 + 其余继承 :root」。
 *   所以暗色解析时：先找暗色专属定义，找不到就**回落到基础定义**，而不是判定为未定义。
 */
function defsFor(defs, name, mode) {
  const all = defs.filter((d) => d.name === name);
  if (!all.length) return null;
  const isDarkDef = (d) => /\.dark/.test(d.selector) || (/prefers-color-scheme\s*:\s*dark/i.test(d.atRule) && /:root/.test(d.selector));
  if (mode === 'dark') {
    const dark = all.filter(isDarkDef);
    if (dark.length) return dark[dark.length - 1];
  }
  const base = all.filter((d) => !isDarkDef(d));
  if (base.length) return base[base.length - 1];
  return all[all.length - 1];
}

/** 顺着 var() 链解出具体值；解不出来就返回 null（这就是「静默失效」） */
function resolveValue(defs, name, mode, depth = 0) {
  if (depth > 6) return null;
  const def = defsFor(defs, name, mode);
  if (!def) return null;
  const m = /^var\(\s*(--[a-z0-9-]+)\s*(?:,\s*(.+))?\)$/i.exec(def.value.trim());
  if (!m) return { value: def.value.trim(), chain: [name], def };
  const inner = resolveValue(defs, m[1], mode, depth + 1);
  if (inner) return { value: inner.value, chain: [name].concat(inner.chain), def };
  if (m[2]) return { value: m[2].trim(), chain: [name], def };
  return null;
}

function hexToRgb(hex) {
  const h = hex.replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}
function luminance([r, g, b]) {
  const f = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export async function run(opts = {}) {
  const rep = createReporter('强调色变量「静默失效」专项验证（v1.1-A 换肤）');
  const origin = (opts.base || 'https://ppywww.github.io').replace(/\/+$/, '');
  rep.note('V-0', '被测目标', origin);

  const { pages, sheets } = await collectCss(origin);
  rep.check('V-1', '取到线上样式表', sheets.length > 0, '覆盖页面 ' + pages.length + ' 个 · 样式表 ' + sheets.length + ' 个：' + JSON.stringify(sheets.map((s) => s.url.split('/').pop())));
  if (!sheets.length) {
    if (!opts.json) rep.print();
    return { report: rep, summary: rep.summary(), results: rep.results };
  }
  const allCss = sheets.map((s) => s.css).join('\n');
  // 逐表扫描并记录来源：这样才能回答「这条规则来自哪个页面/哪张表」
  const defs = [];
  const refs = [];
  for (const sheet of sheets) {
    const scanned = scanCss(sheet.css);
    for (const d of scanned.defs) defs.push(Object.assign({ sheet: sheet.url }, d));
    for (const r of scanned.refs) refs.push(Object.assign({ sheet: sheet.url }, r));
  }
  const externalCssBytes = sheets
    .filter((s) => !s.url.startsWith('inline:'))
    .reduce((n, s) => n + Buffer.byteLength(s.css, 'utf8'), 0);
  const inlineCssBytes = sheets
    .filter((s) => s.url.startsWith('inline:'))
    .reduce((n, s) => n + Buffer.byteLength(s.css, 'utf8'), 0);
  rep.note(
    'V-2',
    'CSS 规模',
    '自定义属性定义 ' + defs.length + ' 条 · var() 引用 ' + refs.length + ' 处 · 外链 CSS 合计 ' +
      (externalCssBytes / 1024).toFixed(2) + ' KiB · 内联 CSS 合计 ' + (inlineCssBytes / 1024).toFixed(2) + ' KiB',
  );

  // ---- 按变量统计使用处数（便于与人工实测对表）----
  const perVar = {};
  for (const r of refs) perVar[r.name] = (perVar[r.name] || 0) + 1;
  rep.note(
    'V-2b',
    '强调色变量使用处数（按变量）',
    ACCENT_VARS.map((n) => n.replace('--color-', '') + '=' + (perVar[n] || 0)).join(' · ') +
      ' · 定义条数：' + ACCENT_VARS.map((n) => n.replace('--color-', '') + '=' + defs.filter((d) => d.name === n).length).join('/'),
  );

  // ---- ① 关键变量是否有有效定义（亮/暗两套）----
  for (const name of ACCENT_VARS) {
    for (const mode of ['light', 'dark']) {
      const r = resolveValue(defs, name, mode);
      rep.check(
        'V-3:' + name + ':' + mode,
        name + ' 在' + (mode === 'light' ? '亮色' : '暗色') + '下有有效定义',
        !!r,
        r ? r.value + '（定义于 ' + r.def.selector + (r.def.atRule ? ' · ' + r.def.atRule : '') + '，链路 ' + r.chain.join(' → ') + '）' : '解析不到值 → 静默失效',
      );
    }
  }

  // ---- ② 8 个区域：规则是否还在、能否解析到值 ----
  const accentRefs = refs.filter((r) => ACCENT_VARS.indexOf(r.name) !== -1);
  for (const area of AREAS) {
    const hits = accentRefs.filter(
      (r) => (area.re && area.re.test(r.selector)) || (area.src && r.sheet.indexOf(area.src) === 0),
    );
    const seen = new Set();
    const unique = hits.filter((h) => {
      const k = h.sheet + '|' + h.selector + '|' + h.prop + '|' + h.name;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    const evidence = unique.map((h) => {
      const light = resolveValue(defs, h.name, 'light');
      const dark = resolveValue(defs, h.name, 'dark');
      return {
        from: sheetLabel(h.sheet),
        selector: h.selector,
        prop: h.prop,
        var: h.name,
        light: light ? light.value : null,
        dark: dark ? dark.value : null,
      };
    });
    const allResolved = evidence.length > 0 && evidence.every((e) => e.light && e.dark);
    rep.check(
      'V-4:' + area.key,
      area.label + '：规则存在且引用的强调色变量可解析',
      allResolved,
      evidence.length === 0
        ? '产物 CSS 里找不到匹配该区域、且引用强调色变量的规则 → 可能被换肤改没了'
        : evidence
            .map((e) => '[' + e.from + '] ' + e.selector + ' { ' + e.prop + ': var(' + e.var + ') } → 亮 ' + e.light + ' / 暗 ' + e.dark)
            .join(' ｜ '),
    );
  }

  // ---- ③ 反向验证：任何一处引用解析不到值，就是静默失效 ----
  const broken = [];
  for (const r of accentRefs) {
    if (!resolveValue(defs, r.name, 'light')) broken.push(r.selector + ' { ' + r.prop + ': ' + r.name + ' }（亮色无定义）');
    if (!resolveValue(defs, r.name, 'dark')) broken.push(r.selector + ' { ' + r.prop + ': ' + r.name + ' }（暗色无定义）');
  }
  rep.check('V-5', '反向验证：所有强调色引用都能解析到值（零静默失效）', broken.length === 0, broken.length ? '共 ' + broken.length + ' 处失效：' + JSON.stringify(broken.slice(0, 8)) : '共校验 ' + accentRefs.length + ' 条引用，全部可解析');

  // ---- ④ 对比度：链接在亮/暗下是否仍可辨识（客观量化，不靠肉眼）----
  for (const mode of ['light', 'dark']) {
    const link = resolveValue(defs, '--color-accent-text', mode);
    const bg = resolveValue(defs, '--color-bg', mode);
    const onAccent = resolveValue(defs, '--color-on-accent', mode);
    const accent = resolveValue(defs, '--color-accent', mode);
    const linkRgb = link && hexToRgb(link.value);
    const bgRgb = bg && hexToRgb(bg.value);
    if (linkRgb && bgRgb) {
      const ratio = contrast(linkRgb, bgRgb);
      rep.check(
        'V-6:' + mode,
        '正文链接色 vs 页面背景对比度 ≥ 4.5:1（WCAG AA）·' + (mode === 'light' ? '亮色' : '暗色'),
        ratio >= 4.5,
        link.value + ' / ' + bg.value + ' = ' + ratio.toFixed(2) + ':1',
      );
    } else {
      rep.skip('V-6:' + mode, '链接对比度', '拿不到 --color-accent-text 或 --color-bg 的具体色值');
    }
    const oaRgb = onAccent && hexToRgb(onAccent.value);
    const acRgb = accent && hexToRgb(accent.value);
    if (oaRgb && acRgb) {
      const ratio = contrast(oaRgb, acRgb);
      rep.check('V-7:' + mode, '强调色按钮文字对比度 ≥ 4.5:1 ·' + (mode === 'light' ? '亮色' : '暗色'), ratio >= 4.5, onAccent.value + ' / ' + accent.value + ' = ' + ratio.toFixed(2) + ':1');
    }
  }

  // ---- ⑤ 回归：首屏外部 JS / Web Font / 第三方资源域名 ----
  const home = await safeFetchText(origin + '/');
  if (home.ok) {
    const thirdPartyJs = [];
    const re = /<script[^>]+src="([^"]+)"/g;
    let m;
    while ((m = re.exec(home.text)) !== null) {
      const src = m[1];
      if (/^https?:/i.test(src) && !src.startsWith(origin)) thirdPartyJs.push(src);
    }
    rep.check('V-8', '首页无第三方（外部域名）JS', thirdPartyJs.length === 0, thirdPartyJs.length ? JSON.stringify(thirdPartyJs) : '首屏 <script src> 中无外部域名');
    const fontFace = (allCss.match(/@font-face/g) || []).length;
    const fontUrls = allCss.match(/url\([^)]*\.(woff2?|ttf|otf|eot)/gi) || [];
    rep.check('V-9', 'CSS 零 Web Font（@font-face = 0 且无字体文件 URL）', fontFace === 0 && fontUrls.length === 0, '@font-face = ' + fontFace + ' · 字体 URL = ' + fontUrls.length);
    const hosts = new Set();
    const resRe = /<(?:link|script|img|iframe)[^>]+(?:href|src)="(https?:\/\/[^"]+)"/g;
    let r2;
    while ((r2 = resRe.exec(home.text)) !== null) {
      try {
        const h = new URL(r2[1]).origin;
        if (h !== origin) hosts.add(h);
      } catch {
        /* 忽略 */
      }
    }
    rep.note('V-10', '首页资源加载域名', hosts.size ? JSON.stringify(Array.from(hosts)) : '仅本站（无第三方资源）');
  }

  if (!opts.json) rep.print();
  return { report: rep, summary: rep.summary(), results: rep.results, defs, refs };
}

const invokedDirectly = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/qa-search/check-theme-tokens.mjs');
if (invokedDirectly) {
  const opts = parseArgs(process.argv.slice(2));
  const out = await run(opts);
  if (opts.json) console.log(JSON.stringify({ summary: out.summary, results: out.results }, null, 2));
  await finish(out.report.exitCode());
}
