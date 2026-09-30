/**
 * 探针脚本（自检用）：验证「无头 Chrome + 本机静态服务器 + Pagefind wasm/Worker + 中文检索」
 * 这条链路可用。它不检查站点实现，只检查验收工装本身是否可信。
 *
 * 用法：node scripts/qa-search/probe-pagefind.mjs [中文关键词...]
 * 默认词：博客 性能优化
 */
import { serveDist } from './lib/serve-dist.mjs';
import { launchChrome, waitFor, DEFAULT_CHROME } from './lib/chrome-cdp.mjs';
import process from 'node:process';

const terms = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const QUERIES = terms.length ? terms : ['博客', '性能优化'];

const probeHtml = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>pagefind probe</title></head>
<body><pre id="out">pending</pre>
<script type="module">
  const out = document.getElementById('out');
  const QUERIES = ${JSON.stringify(QUERIES)};
  try {
    const pf = await import('/pagefind/pagefind.js');
    const report = [];
    for (const q of QUERIES) {
      const search = await pf.search(q);
      const items = await Promise.all(search.results.slice(0, 5).map((r) => r.data()));
      report.push({
        term: q,
        total: search.results.length,
        hits: items.map((i) => ({ url: i.url, title: (i.meta && i.meta.title) || '', excerpt: (i.excerpt || '').slice(0, 160) })),
      });
    }
    out.textContent = JSON.stringify(report);
  } catch (err) {
    out.textContent = 'ERROR:' + (err && err.message ? err.message : String(err));
  }
<\/script></body></html>`;

const distDir = 'dist';
const server = await serveDist({ distDir, extraRoutes: { '/__qa_probe.html': probeHtml } });
const chrome = await launchChrome({ chromePath: process.env.CHROME_PATH || DEFAULT_CHROME });
try {
  const page = await chrome.openPage(server.origin + '/__qa_probe.html');
  const ready = await waitFor(page, "document.getElementById('out') && document.getElementById('out').textContent !== 'pending'", { timeoutMs: 30000 });
  const text = await page.evaluate("document.getElementById('out').textContent");
  console.log('探针结果：', ready.ok ? '已就绪' : '超时', '(' + ready.waitedMs + 'ms)');
  console.log(text);
  console.log('--- 静态服务器收到的请求 ---');
  console.log(server.requests.join('\n'));
  await page.close();
} finally {
  await chrome.close();
  await server.close();
}
