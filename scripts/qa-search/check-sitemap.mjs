/**
 * sitemap 验收（PRD F-10 / §5）
 *
 * 核心问题：sitemap 里列的每条 URL 是否真实存在？dist 里每条路由是否都被列到（除有意排除）？
 *
 * 用法：
 *   node scripts/qa-search/check-sitemap.mjs
 *   node scripts/qa-search/check-sitemap.mjs --base https://ppywww.github.io
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createReporter } from './lib/report.mjs';
import { readSiteConsts, listRoutes, routeToFile } from './lib/dist-info.mjs';
import { inspectXml } from './lib/xml-check.mjs';
import { DEFAULT_CHROME } from './lib/chrome-cdp.mjs';

const PROJECT_ROOT = new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const DIST_DIR = PROJECT_ROOT + 'dist';

/** 有意不进 sitemap 的路由（实现方在 sitemap.xml.ts 注释里声明了理由） */
const INTENTIONAL_EXCLUSIONS = ['/404.html', '/search/'];

const SITEMAP_EXTRACT = "(doc) => {\n  const txt = (el, sel) => { const n = el.querySelector(sel); return n ? n.textContent : null; };\n  const urls = Array.prototype.slice.call(doc.querySelectorAll('url')).map((u) => ({\n    loc: txt(u, 'loc'), lastmod: txt(u, 'lastmod'), changefreq: txt(u, 'changefreq'), priority: txt(u, 'priority'),\n  }));\n  return {\n    rootName: doc.documentElement.tagName,\n    namespace: doc.documentElement.getAttribute('xmlns'),\n    count: urls.length,\n    urls: urls,\n  };\n}";

export function parseArgs(argv) {
  const opts = { base: null, json: false, chromePath: process.env.CHROME_PATH || DEFAULT_CHROME };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--base') opts.base = argv[++i];
    else if (argv[i] === '--json') opts.json = true;
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
  const rep = createReporter('sitemap 验收（手写 XML）');
  const consts = readSiteConsts(PROJECT_ROOT);
  const origin = (opts.base ? opts.base : consts.url).replace(/\/+$/, '');

  let xml = null;
  if (opts.base) {
    const res = await fetch(origin + '/sitemap.xml');
    xml = await res.text();
    rep.check('M-1', '线上 /sitemap.xml 返回 200', res.status === 200, 'HTTP ' + res.status + ' · content-type=' + (res.headers.get('content-type') || ''));
  } else {
    const file = path.join(DIST_DIR, 'sitemap.xml');
    if (!fs.existsSync(file)) {
      rep.fail('M-1', 'dist/sitemap.xml 存在', '未找到 ' + file);
      if (!opts.json) rep.print();
      return { report: rep, summary: rep.summary(), results: rep.results };
    }
    xml = fs.readFileSync(file, 'utf8');
    rep.pass('M-1', 'dist/sitemap.xml 存在', path.relative(PROJECT_ROOT, file) + ' · ' + Buffer.byteLength(xml) + ' 字节');
  }

  const parsed = await inspectXml(xml, SITEMAP_EXTRACT, { chromePath: opts.chromePath });
  rep.check('M-2', 'XML 合法（Chrome DOMParser 无 parsererror）', parsed.wellFormed === true, parsed.parseError || '根元素 = ' + parsed.rootName);
  if (!parsed.wellFormed) {
    if (!opts.json) rep.print();
    return { report: rep, summary: rep.summary(), results: rep.results };
  }
  const d = parsed.data;
  rep.check('M-3', '根元素 urlset 且命名空间正确', d.rootName === 'urlset' && d.namespace === 'http://www.sitemaps.org/schemas/sitemap/0.9', 'root=' + d.rootName + ' xmlns=' + d.namespace);
  rep.note('M-4', 'sitemap URL 条数', String(d.count));

  // ---- loc 形态 ----
  const badOrigin = d.urls.filter((u) => !u.loc || u.loc.indexOf(consts.url) !== 0).map((u) => u.loc);
  rep.check('M-5', '所有 loc 都是 ' + consts.url + ' 下的绝对地址（canonical 域名一致）', badOrigin.length === 0, badOrigin.length ? JSON.stringify(badOrigin) : d.count + ' 条全部合规');
  const rawNonAscii = d.urls.filter((u) => u.loc && /[^\x00-\x7F]/.test(u.loc)).map((u) => u.loc);
  rep.check('M-6', '中文路径已百分号编码（loc 内无裸非 ASCII 字符）', rawNonAscii.length === 0, rawNonAscii.length ? JSON.stringify(rawNonAscii) : '全部为 ASCII（%E6%8A%80%E6%9C%AF 形态）');
  const badLastmod = d.urls.filter((u) => u.lastmod && !/^\d{4}-\d{2}-\d{2}(T[\d:+-]+)?$/.test(u.lastmod)).map((u) => u.loc + ' → ' + u.lastmod);
  rep.check('M-7', 'lastmod 格式合法（W3C 日期或日期时间）', badLastmod.length === 0, badLastmod.length ? JSON.stringify(badLastmod) : '已校验 ' + d.urls.filter((u) => u.lastmod).length + ' 条');

  const paths = d.urls.map((u) => {
    try {
      return new URL(u.loc).pathname;
    } catch {
      return null;
    }
  });
  rep.check('M-8', '每条 loc 都能解析出站内路径', paths.every(Boolean), JSON.stringify(paths.filter((p) => !p)));

  // ---- 存在性 ----
  if (opts.base) {
    const results = [];
    for (const p of paths) results.push(p + ' → HTTP ' + (await httpStatus(origin + p)));
    const dead = results.filter((r) => !r.endsWith('HTTP 200'));
    rep.check('M-9', '线上每条 sitemap URL 均返回 HTTP 200（无死链）', dead.length === 0, dead.length ? dead.join('; ') : '已逐条请求 ' + results.length + ' 条，全部 200');
  } else {
    const missing = paths.filter((p) => p && !fs.existsSync(path.join(DIST_DIR, routeToFile(p))));
    rep.check('M-9', '每条 sitemap URL 在 dist 中都有对应产物（无死链）', missing.length === 0, missing.length ? JSON.stringify(missing) : '已逐条核对 ' + paths.length + ' 条，全部存在');

    // ---- 覆盖度：dist 路由 vs sitemap ----
    const routes = listRoutes(DIST_DIR).map((r) => r.url);
    const inSitemap = new Set(paths);
    const notListed = routes.filter((r) => !inSitemap.has(r));
    const unexpectedMissing = notListed.filter((r) => INTENTIONAL_EXCLUSIONS.indexOf(r) === -1);
    rep.note('M-10', '路由覆盖对照', 'dist 路由 = ' + routes.length + ' · sitemap = ' + paths.length + ' · 未列入 = ' + JSON.stringify(notListed));
    rep.check('M-11', 'dist 路由中除有意排除（' + INTENTIONAL_EXCLUSIONS.join('、') + '）外全部被 sitemap 覆盖', unexpectedMissing.length === 0, unexpectedMissing.length ? '漏列：' + JSON.stringify(unexpectedMissing) : '未列入的正好是有意排除项：' + JSON.stringify(notListed));
  }

  // ---- Pagefind 索引页数 ----
  let entry = null;
  if (opts.base) {
    const res = await fetch(origin + '/pagefind/pagefind-entry.json');
    entry = res.status === 200 ? await res.json() : null;
    rep.note('M-12', 'pagefind-entry.json', res.status === 200 ? JSON.stringify(entry) : 'HTTP ' + res.status);
  } else {
    const file = path.join(DIST_DIR, 'pagefind', 'pagefind-entry.json');
    if (fs.existsSync(file)) {
      entry = JSON.parse(fs.readFileSync(file, 'utf8'));
      rep.note('M-12', 'pagefind-entry.json', JSON.stringify(entry));
    } else {
      rep.fail('M-12', 'dist/pagefind/pagefind-entry.json 存在（索引已在 dist 内生成）', '未找到 ' + file);
    }
  }
  if (entry) {
    const languages = Object.keys(entry.languages || {});
    const counts = languages.map((k) => entry.languages[k].page_count);
    const total = counts.reduce((a, b) => a + b, 0);
    rep.note('M-13', '索引语种与页数', 'languages=' + JSON.stringify(languages) + ' page_count=' + JSON.stringify(counts));
    rep.check('M-14', '索引语种为 zh-cn（Pagefind 按页面 lang 分词，ADR-001 §3）', languages.length === 1 && languages[0] === 'zh-cn', JSON.stringify(languages));
    if (!opts.base) {
      const htmlCount = listRoutes(DIST_DIR).length;
      rep.check('M-15', 'Pagefind 索引页数 = dist HTML 页面数', total === htmlCount, 'page_count=' + total + ' vs HTML 路由=' + htmlCount);
    }
  }

  if (!opts.json) rep.print();
  return { report: rep, summary: rep.summary(), results: rep.results };
}

const invokedDirectly = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/qa-search/check-sitemap.mjs');
if (invokedDirectly) {
  const opts = parseArgs(process.argv.slice(2));
  const out = await run(opts);
  if (opts.json) console.log(JSON.stringify({ summary: out.summary, results: out.results }, null, 2));
  process.exit(out.report.exitCode());
}
