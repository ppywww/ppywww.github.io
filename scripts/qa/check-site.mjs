// scripts/qa/check-site.mjs
// 用法: node scripts/qa/check-site.mjs [--out scripts/qa/evidence] [--max-pages 40]
// 真机验收（无头 Chrome + CDP，零 npm 依赖）：全站抓取、站内链接体检、320px 横向滚动、
// 外链 rel 属性、键盘可达性（Tab 序列 / 主题按钮 / TOC）、资源体积与 LCP/CLS。
// 只读线上站点，不触碰本地源码，不执行任何构建。
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { launchChrome, CDP, attachNewPage, sleep } from "./lib/cdp.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(HERE, "lib", f), "utf8");
const PROBE = read("probe.js");
const OBSERVER = read("observer.js");
const ACTIVE_INFO = read("active-info.js");
const THEME_STATE = read("theme-state.js");
const SEED_THEME = read("seed-theme.js");
const LINK_EXPR = read("link-status.js");

const argv = process.argv.slice(2);
const getArg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const OUT = resolve(getArg("--out", join(HERE, "evidence")));
const MAX_PAGES = Number(getArg("--max-pages", "40"));
const ORIGIN = "https://ppywww.github.io";
mkdirSync(OUT, { recursive: true });

async function inspect(cdp, url, opts) {
  const o = opts || {};
  const width = o.width || 1280;
  const height = o.height || 900;
  const mobile = !!o.mobile;
  const page = await attachNewPage(cdp, "about:blank");
  const sessionId = page.sessionId;
  const docs = [];
  const off = cdp.on("Network.responseReceived", (p, sid) => {
    if (sid === sessionId && p.type === "Document") docs.push({ url: p.response.url, status: p.response.status, mime: p.response.mimeType });
  });
  try {
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    await cdp.send("Network.enable", {}, sessionId);
    if (o.media) await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: o.media }] }, sessionId);
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: width, height: height, deviceScaleFactor: 1, mobile: mobile }, sessionId);
    if (o.seedStorage) await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: SEED_THEME.replace("__THEME_VALUE__", JSON.stringify(o.seedStorage)) }, sessionId);
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: OBSERVER }, sessionId);
    const loaded = cdp.waitFor("Page.loadEventFired", 45000, sessionId);
    await cdp.send("Page.navigate", { url: url }, sessionId);
    await loaded.catch(() => {});
    await sleep(o.settle || 1500);
    const res = await cdp.send("Runtime.evaluate", { expression: PROBE, returnByValue: true }, sessionId);
    const data = res.result.value;
    data.httpStatus = docs.length ? docs[docs.length - 1].status : null;
    if (o.screenshot) {
      const shot = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
      writeFileSync(join(OUT, o.screenshot), Buffer.from(shot.data, "base64"));
      data.screenshot = o.screenshot;
    }
    return data;
  } finally {
    off();
    try { await cdp.send("Target.closeTarget", { targetId: page.targetId }); } catch (e) {}
  }
}

async function pressKey(cdp, sessionId, code, vk, text) {
  const base = { code: code, key: code, windowsVirtualKeyCode: vk };
  const down = Object.assign({ type: "rawKeyDown" }, base);
  await cdp.send("Input.dispatchKeyEvent", down, sessionId);
  if (text) await cdp.send("Input.dispatchKeyEvent", { type: "char", text: text, key: code, code: code, windowsVirtualKeyCode: vk }, sessionId);
  await cdp.send("Input.dispatchKeyEvent", Object.assign({ type: "keyUp" }, base), sessionId);
}

async function keyboardWalk(cdp, url, presses) {
  const page = await attachNewPage(cdp, "about:blank");
  const sessionId = page.sessionId;
  try {
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
    const loaded = cdp.waitFor("Page.loadEventFired", 45000, sessionId);
    await cdp.send("Page.navigate", { url: url }, sessionId);
    await loaded.catch(() => {});
    await sleep(1200);
    await cdp.send("Runtime.evaluate", { expression: "if (document.activeElement) document.activeElement.blur(); window.scrollTo(0, 0);" }, sessionId);
    const seq = [];
    for (let i = 0; i < presses; i++) {
      await pressKey(cdp, sessionId, "Tab", 9);
      await sleep(140);
      const r = await cdp.send("Runtime.evaluate", { expression: ACTIVE_INFO, returnByValue: true }, sessionId);
      seq.push(r.result.value);
    }
    const before = (await cdp.send("Runtime.evaluate", { expression: THEME_STATE, returnByValue: true }, sessionId)).result.value;
    await cdp.send("Runtime.evaluate", { expression: "var b = document.querySelector('[data-theme-toggle]'); if (b) b.focus();" }, sessionId);
    await pressKey(cdp, sessionId, "Enter", 13, "\r");
    await sleep(500);
    const after = (await cdp.send("Runtime.evaluate", { expression: THEME_STATE, returnByValue: true }, sessionId)).result.value;
    const hasToc = (await cdp.send("Runtime.evaluate", { expression: "!!document.querySelector('details summary')", returnByValue: true }, sessionId)).result.value;
    let toc = { present: false };
    if (hasToc) {
      const openBefore = (await cdp.send("Runtime.evaluate", { expression: "document.querySelector('details').open", returnByValue: true }, sessionId)).result.value;
      await cdp.send("Runtime.evaluate", { expression: "document.querySelector('details summary').focus();" }, sessionId);
      await pressKey(cdp, sessionId, "Enter", 13, "\r");
      await sleep(400);
      const openAfter = (await cdp.send("Runtime.evaluate", { expression: "document.querySelector('details').open", returnByValue: true }, sessionId)).result.value;
      toc = { present: true, openBefore: openBefore, openAfterEnter: openAfter };
    }
    return { url: url, tabSequence: seq, themeBefore: before, themeAfterEnter: after, toc: toc };
  } finally {
    try { await cdp.send("Target.closeTarget", { targetId: page.targetId }); } catch (e) {}
  }
}

async function linkStatuses(cdp, urls) {
  const page = await attachNewPage(cdp, ORIGIN + "/");
  const sessionId = page.sessionId;
  try {
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    const loaded = cdp.waitFor("Page.loadEventFired", 45000, sessionId);
    await cdp.send("Page.navigate", { url: ORIGIN + "/" }, sessionId);
    await loaded.catch(() => {});
    const r = await cdp.send("Runtime.evaluate", { expression: LINK_EXPR.replace("__URLS_JSON__", JSON.stringify(urls)), returnByValue: true, awaitPromise: true }, sessionId);
    if (r.exceptionDetails) {
      console.error("link-status 注入异常: " + JSON.stringify(r.exceptionDetails).slice(0, 500));
      return [];
    }
    if (!Array.isArray(r.result.value)) {
      console.error("link-status 返回非数组: " + JSON.stringify(r.result).slice(0, 300));
      return [];
    }
    return r.result.value;
  } finally {
    try { await cdp.send("Target.closeTarget", { targetId: page.targetId }); } catch (e) {}
  }
}

async function main() {
  const started = Date.now();
  const chrome = await launchChrome({ port: 9333 });
  const cdp = await CDP.connect(chrome.version.webSocketDebuggerUrl);
  const report = { generatedAt: new Date().toISOString(), origin: ORIGIN, chrome: chrome.version.Browser, pages: [], linkStatus: [], overflow320: [], keyboard: [], externalLinks: [], desktopShots: [], errors: [] };
  try {
    const seen = new Set();
    const queue = [ORIGIN + "/"];
    while (queue.length && seen.size < MAX_PAGES) {
      const url = queue.shift().split("#")[0];
      if (seen.has(url)) continue;
      seen.add(url);
      let data;
      try { data = await inspect(cdp, url); }
      catch (e) { report.errors.push({ url: url, error: String((e && e.message) || e) }); continue; }
      report.pages.push(data);
      for (const a of data.anchors) {
        const u = a.href.split("#")[0];
        if (u.indexOf(ORIGIN) === 0 && !seen.has(u) && queue.indexOf(u) < 0) queue.push(u);
      }
    }
    const internal = new Set();
    const external = new Set();
    for (const p of report.pages) {
      for (const a of p.anchors) (a.href.indexOf(ORIGIN) === 0 ? internal : external).add(a.href.split("#")[0]);
    }
    ["/rss.xml", "/sitemap.xml", "/robots.txt", "/search/", "/404/", "/this-page-does-not-exist-xyz/", "/feed.xml", "/index.xml"].forEach((x) => internal.add(ORIGIN + x));
    report.linkStatus = await linkStatuses(cdp, [...internal].sort());
    const widthCases = [["/", "home"], ["/posts/2026-09-30-build-this-blog/", "post"], ["/archives/", "archives"], ["/tags/", "tags"], ["/works/", "works"], ["/categories/", "categories"], ["/about/", "about"]];
    for (const c of widthCases) {
      const d = await inspect(cdp, ORIGIN + c[0], { width: 320, height: 720, mobile: true, screenshot: "w320-" + c[1] + ".png" });
      report.overflow320.push({ path: c[0], scrollWidth: d.scrollWidth, clientWidth: d.clientWidth, bodyScrollWidth: d.bodyScrollWidth, innerWidth: d.innerWidth, overflow: d.scrollWidth > d.clientWidth, overflowEls: d.overflowEls, screenshot: d.screenshot });
    }
    for (const theme of ["light", "dark"]) {
      const d = await inspect(cdp, ORIGIN + "/", { width: 1440, height: 900, media: theme, seedStorage: theme, screenshot: "w1440-" + theme + ".png", settle: 1200 });
      report.desktopShots.push({ theme: theme, htmlClass: d.htmlClass, dataTheme: d.dataTheme, htmlBg: d.htmlBg, screenshot: d.screenshot });
    }
    report.keyboard.push(await keyboardWalk(cdp, ORIGIN + "/", 10));
    report.keyboard.push(await keyboardWalk(cdp, ORIGIN + "/posts/2026-09-30-build-this-blog/", 8));
    report.externalLinks = [...external].map((u) => {
      const hits = report.pages.reduce((acc, p) => acc.concat(p.anchors.filter((a) => a.href.split("#")[0] === u)), []);
      return { url: u, count: hits.length, targets: [...new Set(hits.map((h) => h.target))], rels: [...new Set(hits.map((h) => h.rel))] };
    });
  } catch (e) {
    report.errors.push({ fatal: String((e && e.stack) || e) });
  } finally {
    cdp.close();
    await chrome.close();
  }
  report.durationMs = Date.now() - started;
  const file = join(OUT, "site-check.json");
  writeFileSync(file, JSON.stringify(report, null, 2));
  const LS = Array.isArray(report.linkStatus) ? report.linkStatus : [];
  const blank = report.externalLinks.filter((l) => l.targets.indexOf("_blank") >= 0);
  const summary = {
    out: file,
    durationMs: report.durationMs,
    pages: report.pages.length,
    errors: report.errors.length,
    http404: LS.filter((l) => l.status === 404).map((l) => l.url),
    httpOtherBad: LS.filter((l) => l.status !== 200 && l.status !== 404).map((l) => l.url + " -> " + l.status),
    overflow320: report.overflow320.filter((o) => o.overflow).map((o) => o.path),
    externalBlankWithoutNoopener: blank.filter((l) => !l.rels.some((r) => r && r.split(/\s+/).indexOf("noopener") >= 0)).map((l) => l.url),
  };
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
