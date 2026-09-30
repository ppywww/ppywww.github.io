/**
 * 一键跑完三项验收（搜索 / RSS / sitemap）。
 *
 * 用法：
 *   node scripts/qa-search/run-all.mjs                                    # 本地 dist
 *   node scripts/qa-search/run-all.mjs --base https://ppywww.github.io    # 线上
 *
 * 退出码：任一「不通过」→ 1；本地模式下**产物被并发重建**→ 同样置 1（结论不可信，必须重跑）。
 *
 * 为什么要有「产物稳定性」守卫：验收期间若实现方正在 npm run build，dist 会被清空/重写，
 * 期间的 404 与空结果都会被误判成「缺陷」。2026-09-30 本套脚本就因此报过一次 11 项假失败。
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { run as runSearch, parseArgs as parseSearchArgs } from './check-search.mjs';
import { run as runRss } from './check-rss.mjs';
import { run as runSitemap } from './check-sitemap.mjs';

const PROJECT_ROOT = new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const DIST_DIR = PROJECT_ROOT + 'dist';

const argv = process.argv.slice(2);
const opts = parseSearchArgs(argv);

console.log('验收目标：' + (opts.base || '本地 dist（内置静态服务器）'));

/** 产物指纹：dist 目录 mtime + Pagefind 索引 hash。任一变化即说明验收期间被重建。 */
function distFingerprint() {
  if (opts.base) return null;
  try {
    const entryFile = path.join(DIST_DIR, 'pagefind', 'pagefind-entry.json');
    const langs = fs.existsSync(entryFile) ? JSON.parse(fs.readFileSync(entryFile, 'utf8')).languages : null;
    return { mtime: fs.statSync(DIST_DIR).mtime.toISOString(), indexHash: JSON.stringify(langs) };
  } catch (err) {
    return { error: String(err && err.message) };
  }
}

/**
 * 线上产物指纹（仅 --base 模式）：把 G-14「产物稳定性」从本地扩到线上——
 * 验收期间若正好有新部署落地（Pages 构建/缓存刷新），同一批请求会打到两个不同版本，
 * 结论同样不可信。取 4 个轻量标记：索引 entry、robots、sitemap loc 数、搜索页可达性。
 * 任何一步失败都只记录不抛错，避免守卫本身成为故障源。
 */
async function remoteFingerprint() {
  if (!opts.base) return null;
  const root = opts.base.replace(/\/+$/, '');
  const get = async (p) => {
    try {
      const res = await fetch(root + p);
      return { status: res.status, body: res.status === 200 ? await res.text() : null };
    } catch (err) {
      return { status: 'ERR:' + (err && err.message), body: null };
    }
  };
  try {
    const entry = await get('/pagefind/pagefind-entry.json');
    const robots = await get('/robots.txt');
    const sitemap = await get('/sitemap.xml');
    const searchPage = await get('/search/');
    let entryMark = 'HTTP ' + entry.status;
    if (entry.body) {
      try {
        const langs = JSON.parse(entry.body).languages || {};
        entryMark = Object.keys(langs)
          .map((k) => k + ':' + langs[k].hash + ':page_count=' + langs[k].page_count)
          .join(',');
      } catch {
        entryMark = 'unparsable';
      }
    }
    return {
      pagefindEntry: entryMark,
      robots: 'HTTP ' + robots.status,
      sitemapLocs: sitemap.body ? String((sitemap.body.match(/<loc>/g) || []).length) : 'HTTP ' + sitemap.status,
      searchPage: 'HTTP ' + searchPage.status,
    };
  } catch (err) {
    return { error: String(err && err.message) };
  }
}

const fingerprintBefore = opts.base ? await remoteFingerprint() : distFingerprint();
if (fingerprintBefore) console.log('产物指纹（开始）：' + JSON.stringify(fingerprintBefore));

const search = await runSearch(opts);
const rss = await runRss(opts);
const sitemap = await runSitemap(opts);

const all = [search, rss, sitemap];
const totals = all.reduce(
  (acc, r) => ({
    pass: acc.pass + r.summary.pass,
    fail: acc.fail + r.summary.fail,
    unverified: acc.unverified + r.summary.unverified,
    info: acc.info + r.summary.info,
  }),
  { pass: 0, fail: 0, unverified: 0, info: 0 },
);

console.log('\n================ 总汇总 ================');
console.log('通过 ' + totals.pass + ' · 不通过 ' + totals.fail + ' · 无法验证 ' + totals.unverified + ' · 记录 ' + totals.info);
for (const r of all) {
  console.log('  ' + r.summary.title + ' → 通过 ' + r.summary.pass + ' / 不通过 ' + r.summary.fail);
  for (const item of r.results.filter((x) => x.status === 'FAIL' || x.status === 'UNVERIFIED')) {
    console.log('    [' + (item.status === 'FAIL' ? '不通过' : '无法验证') + '] ' + item.id + ' · ' + item.name);
  }
}
// ---- 产物稳定性守卫（G-14：本地看 dist 重建，线上看是否有新部署落地）----
let invalidated = false;
const fingerprintAfter = opts.base ? await remoteFingerprint() : distFingerprint();
if (fingerprintBefore && fingerprintAfter) {
  console.log('产物指纹（结束）：' + JSON.stringify(fingerprintAfter));
  if (JSON.stringify(fingerprintBefore) !== JSON.stringify(fingerprintAfter)) {
    invalidated = true;
    console.log('\n⚠️ 被测产物在验收期间发生了变化，本次结论**不可信**：');
    console.log('   开始 ' + JSON.stringify(fingerprintBefore));
    console.log('   结束 ' + JSON.stringify(fingerprintAfter));
    console.log(
      opts.base
        ? '   → 疑似验收期间有新部署落地（Pages 构建/缓存刷新）。请等发布稳定后重跑本脚本。'
        : '   → 疑似验收期间有并发构建重写了 dist。请等构建结束、dist 稳定后重跑本脚本。',
    );
  }
}

if (opts.json) {
  console.log(
    JSON.stringify(
      { search: search.summary, rss: rss.summary, sitemap: sitemap.summary, totals, artifactStable: !invalidated },
      null,
      2,
    ),
  );
}
process.exit(totals.fail > 0 || invalidated ? 1 : 0);
