// scripts/qa/check-theme-firstframe.mjs
// 用法: node scripts/qa/check-theme-firstframe.mjs [--out scripts/qa/evidence]
// AC-3「深色模式无闪烁」真机取证：用 CDP Page.startScreencast 抓导航后的连续首帧，
// 逐帧解码 PNG 并对 16px 网格采样，统计"近白像素占比"与主色，判断是否存在白闪首帧。
// 对照组：同一页面在亮色偏好下的首帧序列。
import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { launchChrome, CDP, attachNewPage, sleep, decodePNG, gridStats, hex, pixelAt } from "./lib/cdp.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const getArg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const OUT = resolve(getArg("--out", join(HERE, "evidence")));
const URL_TARGET = getArg("--url", "https://ppywww.github.io/");
mkdirSync(OUT, { recursive: true });

async function capture(url, theme, durationMs) {
  const chrome = await launchChrome({ port: 9334 });
  const cdp = await CDP.connect(chrome.version.webSocketDebuggerUrl);
  const page = await attachNewPage(cdp, "about:blank");
  const sid = page.sessionId;
  const frames = [];
  const events = [];
  let navWall = 0;
  const offFrame = cdp.on("Page.screencastFrame", async (p, s) => {
    if (s !== sid) return;
    frames.push({ t: p.metadata.timestamp, data: p.data, w: p.metadata.deviceWidth, h: p.metadata.deviceHeight });
    try { await cdp.send("Page.screencastFrameAck", { sessionId: p.sessionId }, sid); } catch (e) {}
  });
  const offNav = cdp.on("Page.frameNavigated", (p, s) => { if (s === sid) events.push({ ev: "frameNavigated", at: Date.now() }); });
  const offDom = cdp.on("Page.domContentEventFired", (p, s) => { if (s === sid) events.push({ ev: "domContentLoaded", at: Date.now() }); });
  const offLoad = cdp.on("Page.loadEventFired", (p, s) => { if (s === sid) events.push({ ev: "load", at: Date.now() }); });
  try {
    await cdp.send("Page.enable", {}, sid);
    await cdp.send("Runtime.enable", {}, sid);
    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: theme }] }, sid);
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 900, height: 700, deviceScaleFactor: 1, mobile: false }, sid);
    const seed = "try { localStorage.setItem('pref-theme', " + JSON.stringify(theme) + "); } catch (e) {}";
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: seed }, sid);
    await cdp.send("Page.startScreencast", { format: "png", maxWidth: 900, maxHeight: 700, everyNthFrame: 1 }, sid);
    await sleep(300);
    navWall = Date.now();
    await cdp.send("Page.navigate", { url: url }, sid);
    await sleep(durationMs);
    await cdp.send("Page.stopScreencast", {}, sid);
    const state = (await cdp.send("Runtime.evaluate", { expression: "({cls: document.documentElement.className, theme: document.documentElement.dataset.theme, bodyBg: getComputedStyle(document.body).backgroundColor, stored: localStorage.getItem('pref-theme')})", returnByValue: true }, sid)).result.value;
    const analyzed = [];
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      const buf = Buffer.from(f.data, "base64");
      let stats = null, err = null;
      try {
        const img = decodePNG(buf);
        stats = gridStats(img, 16, 245);
        const c = pixelAt(img, Math.floor(img.width / 2), Math.floor(img.height * 0.6));
        stats.centerPixel = hex(c);
      } catch (e) { err = String((e && e.message) || e); }
      if (i < 5) writeFileSync(join(OUT, "firstframe-" + theme + "-" + String(i).padStart(2, "0") + ".png"), buf);
      analyzed.push({ i: i, tToNavMs: Math.round((f.t * 1000) - navWall), bytes: buf.length, stats: stats, decodeError: err });
    }
    return { theme: theme, url: url, frameCount: frames.length, finalState: state, events: events.map((e) => ({ ev: e.ev, at: e.at - navWall })), frames: analyzed };
  } finally {
    offFrame(); offNav(); offDom(); offLoad();
    cdp.close();
    await chrome.close();
  }
}

async function main() {
  const out = { url: URL_TARGET, runs: [] };
  out.runs.push(await capture(URL_TARGET, "dark", 4000));
  out.runs.push(await capture(URL_TARGET, "light", 4000));
  const file = join(OUT, "theme-firstframe.json");
  writeFileSync(file, JSON.stringify(out, null, 2));
  for (const r of out.runs) {
    console.log("--- theme=" + r.theme + " frames=" + r.frameCount + " final=" + JSON.stringify(r.finalState));
    console.log("   events(ms since navigate): " + JSON.stringify(r.events));
    for (const f of r.frames.slice(0, 12)) {
      console.log("   frame#" + f.i + " t=" + f.tToNavMs + "ms mode=" + (f.stats ? f.stats.mode : "-") + " modeRatio=" + (f.stats ? f.stats.modeRatio : "-") + " nearWhite=" + (f.stats ? f.stats.nearWhiteRatio : "-") + " center=" + (f.stats ? f.stats.centerPixel : "-"));
    }
  }
  console.log("out=" + file);
}
main().catch((e) => { console.error("FATAL", e); process.exit(1); });
