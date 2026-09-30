// scripts/qa/check-home-alignment.mjs
// 用法: node scripts/qa/check-home-alignment.mjs [--out scripts/qa/evidence]
// 复验 bb41987：桌面首页 profile 左边缘是否与第一张文章卡片左边缘对齐（1440/1280/1024），
// 以及 SITE.description 副标题在 1440/1024/900 下是否仍为单行。
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { launchChrome, CDP, attachNewPage, sleep } from "./lib/cdp.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROBE = readFileSync(join(HERE, "lib", "home-align.js"), "utf8");
const argv = process.argv.slice(2);
const getArg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const OUT = resolve(getArg("--out", join(HERE, "evidence")));
const URL_TARGET = getArg("--url", "https://ppywww.github.io/");
const WIDTHS = (getArg("--widths", "1440,1280,1024,900")).split(",").map((s) => Number(s.trim())).filter((n) => n > 0);
mkdirSync(OUT, { recursive: true });

const chrome = await launchChrome({ port: 9343 });
const cdp = await CDP.connect(chrome.version.webSocketDebuggerUrl);
const results = [];
try {
  for (const w of WIDTHS) {
    const page = await attachNewPage(cdp, "about:blank");
    const sid = page.sessionId;
    await cdp.send("Page.enable", {}, sid);
    await cdp.send("Runtime.enable", {}, sid);
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: w, height: 900, deviceScaleFactor: 1, mobile: false }, sid);
    const loaded = cdp.waitFor("Page.loadEventFired", 45000, sid);
    await cdp.send("Page.navigate", { url: URL_TARGET }, sid);
    await loaded.catch(() => {});
    await sleep(1000);
    const r = await cdp.send("Runtime.evaluate", { expression: PROBE, returnByValue: true }, sid);
    results.push(r.result.value);
    try { await cdp.send("Target.closeTarget", { targetId: page.targetId }); } catch (e) {}
  }
} finally {
  cdp.close();
  await chrome.close();
}
const out = { url: URL_TARGET, generatedAt: new Date().toISOString(), cases: results };
writeFileSync(join(OUT, "home-alignment.json"), JSON.stringify(out, null, 2));
console.log("宽度 | profile.left | card.left | Δ | profile.width | content.width | 副标题行数 | 副标题宽 | 行高/字号 | scrollW/clientW");
for (const c of results) {
  console.log([c.viewport, c.profile.left, c.firstCard.left, c.alignDelta, c.profile.width, c.content.width, c.leadLines, c.lead.width, c.leadLineHeight + "/" + c.leadFontSize, c.scrollWidth + "/" + c.clientWidth].join(" | "));
}
console.log("\n副标题行盒（top,width）：");
for (const c of results) console.log("  " + c.viewport + " -> " + JSON.stringify(c.leadLineBoxes) + " | maxWidth=" + c.leadMaxWidth + " | whiteSpace=" + c.leadWhiteSpace);
console.log("\nsection-title(最新文章).left: " + results.map((c) => c.viewport + ":" + (c.sectionTitle ? c.sectionTitle.left : "-")).join("  "));
