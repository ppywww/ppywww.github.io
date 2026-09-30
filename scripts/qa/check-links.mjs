// scripts/qa/check-links.mjs
// 用法: node scripts/qa/check-links.mjs [--out scripts/qa/evidence]
// 站内链接状态体检：在真实浏览器上下文里逐个 GET（含中文/空格路径的百分号编码形态），
// 记录最终状态码与重定向落点；并抓取任意 404 路径下的自定义 404 页与搜索入口表单信息。
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { launchChrome, CDP, attachNewPage, sleep } from "./lib/cdp.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(HERE, "lib", f), "utf8");
const LINK_EXPR = read("link-status.js");
const FORM_INFO = read("form-info.js");
const argv = process.argv.slice(2);
const getArg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const OUT = resolve(getArg("--out", join(HERE, "evidence")));
const ORIGIN = "https://ppywww.github.io";
mkdirSync(OUT, { recursive: true });

const URLS = [
  "/", "/posts/", "/archives/", "/categories/", "/tags/", "/works/", "/about/",
  "/posts/2026-09-30-build-this-blog/", "/posts/2026-09-28-why-i-blog/", "/posts/2026-09-25-reading-note-template/",
  "/categories/%E6%8A%80%E6%9C%AF/", "/categories/%E7%94%9F%E6%B4%BB/", "/categories/%E8%AF%BB%E4%B9%A6/", "/categories/%E4%BD%9C%E5%93%81/",
  "/tags/Astro/", "/tags/GitHub%20Pages/", "/tags/%E5%86%99%E4%BD%9C/", "/tags/%E9%9A%8F%E7%AC%94/", "/tags/%E8%AF%BB%E4%B9%A6%E7%AC%94%E8%AE%B0/", "/tags/%E6%A8%A1%E6%9D%BF/", "/tags/%E6%80%A7%E8%83%BD%E4%BC%98%E5%8C%96/", "/tags/%E9%9D%99%E6%80%81%E7%AB%99%E7%82%B9/",
  "/rss.xml", "/feed.xml", "/index.xml", "/sitemap.xml", "/sitemap-index.xml", "/robots.txt", "/search/", "/search-index.json", "/pagefind/pagefind.js",
  "/404/", "/404.html", "/this-page-does-not-exist-xyz/", "/posts/nonexistent-slug/", "/works/ppy-blog/",
];

async function main() {
  const chrome = await launchChrome({ port: 9335 });
  const cdp = await CDP.connect(chrome.version.webSocketDebuggerUrl);
  const page = await attachNewPage(cdp, ORIGIN + "/");
  const sid = page.sessionId;
  const result = { generatedAt: new Date().toISOString(), origin: ORIGIN, links: [], notFoundPage: null };
  try {
    await cdp.send("Page.enable", {}, sid);
    await cdp.send("Runtime.enable", {}, sid);
    const loaded = cdp.waitFor("Page.loadEventFired", 45000, sid);
    await cdp.send("Page.navigate", { url: ORIGIN + "/" }, sid);
    await loaded.catch(() => {});
    const urls = URLS.map((u) => ORIGIN + u);
    const r = await cdp.send("Runtime.evaluate", { expression: LINK_EXPR.replace("__URLS__", JSON.stringify(urls)), returnByValue: true, awaitPromise: true }, sid);
    if (r.exceptionDetails) throw new Error("注入异常: " + JSON.stringify(r.exceptionDetails).slice(0, 300));
    result.links = (r.result.value || []).map((x) => ({ path: x.url.replace(ORIGIN, "") || "/", status: x.status, finalUrl: x.finalUrl, err: x.err || null }));
    await cdp.send("Page.navigate", { url: ORIGIN + "/this-page-does-not-exist-xyz/" }, sid);
    await sleep(1500);
    const probe = read("notfound-info.js");
    result.notFoundPage = (await cdp.send("Runtime.evaluate", { expression: probe, returnByValue: true }, sid)).result.value;
    const form = (await cdp.send("Runtime.evaluate", { expression: FORM_INFO, returnByValue: true }, sid)).result.value;
    result.notFoundPage.form = form;
  } catch (e) {
    result.error = String((e && e.stack) || e);
  } finally {
    try { await cdp.send("Target.closeTarget", { targetId: page.targetId }); } catch (e) {}
    cdp.close();
    await chrome.close();
  }
  const file = join(OUT, "link-check.json");
  writeFileSync(file, JSON.stringify(result, null, 2));
  console.log("--- 站内链接状态 ---");
  for (const l of result.links) console.log(String(l.status).padStart(4) + "  " + l.path + (l.err ? "  ERR=" + l.err : ""));
  console.log("--- 任意 404 路径的落地页 ---");
  console.log(JSON.stringify(result.notFoundPage, null, 1));
  if (result.error) console.log("ERROR: " + result.error);
  console.log("out=" + file);
}
main().catch((e) => { console.error("FATAL", e); process.exit(1); });
