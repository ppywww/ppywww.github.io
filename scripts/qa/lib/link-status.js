// scripts/qa/lib/link-status.js
// 在浏览器上下文里逐个 GET 站内链接，记录最终状态码（URL 数组由调用方注入）。
(async () => {
  const urls = __URLS_JSON__;
  const out = [];
  for (const u of urls) {
    try {
      const r = await fetch(u, { redirect: 'follow' });
      out.push({ url: u, status: r.status, ok: r.ok, finalUrl: r.url });
    } catch (e) {
      out.push({ url: u, status: 0, ok: false, err: String(e).slice(0, 90) });
    }
  }
  return out;
})()
