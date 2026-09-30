// scripts/qa/check-first-paint.mjs
// 用法: node scripts/qa/check-first-paint.mjs [--out scripts/qa/evidence]
// AC-3「深色模式无白闪」取证：
//  A. 结构核验：抓原始 HTML，比较主题内联脚本、首个外部样式表、<style>、<body> 的字节位置；
//  B. 运行时核验：在 document_start 注入 rAF 采样器，分别在
//     (1) 系统暗色 + 无 localStorage、(2) 系统亮色 + 无 localStorage、(3) 系统亮色 + localStorage=dark
//     三种情形下读取"首帧前"的 html class 与 body 计算背景色。
// 单个 Chrome 实例内串行跑多个 target，避免端口/配置目录竞争。
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { launchChrome, CDP, attachNewPage, sleep } from "./lib/cdp.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(HERE, "lib", f), "utf8");
const FP = read("first-paint.js");
const SEED = read("seed-theme.js");
const argv = process.argv.slice(2);
const getArg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const OUT = resolve(getArg("--out", join(HERE, "evidence")));
const URL_TARGET = getArg("--url", "https://ppywww.github.io/");
mkdirSync(OUT, { recursive: true });

async function runCase(cdp, label, media, seedTheme) {
  const page = await attachNewPage(cdp, "about:blank");
  const sid = page.sessionId;
  try {
    await cdp.send("Page.enable", {}, sid);
    await cdp.send("Runtime.enable", {}, sid);
    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: media }] }, sid);
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1000, height: 800, deviceScaleFactor: 1, mobile: false }, sid);
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: FP }, sid);
    if (seedTheme) await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: SEED.replace("__THEME_VALUE__", JSON.stringify(seedTheme)) }, sid);
    const loaded = cdp.waitFor("Page.loadEventFired", 45000, sid);
    await cdp.send("Page.navigate", { url: URL_TARGET }, sid);
    await loaded.catch(() => {});
    await sleep(800);
    const r = await cdp.send("Runtime.evaluate", { expression: "window.__fp", returnByValue: true }, sid);
    return { label: label, media: media, seededTheme: seedTheme || null, samples: r.result.value };
  } finally {
    try { await cdp.send("Target.closeTarget", { targetId: page.targetId }); } catch (e) {}
  }
}

async function main() {
  const out = { url: URL_TARGET, generatedAt: new Date().toISOString(), structural: null, cases: [] };
  const chrome = await launchChrome({ port: 9337 });
  const cdp = await CDP.connect(chrome.version.webSocketDebuggerUrl);
  try {
    const page = await attachNewPage(cdp, URL_TARGET);
    const sid = page.sessionId;
    await cdp.send("Page.enable", {}, sid);
    await cdp.send("Runtime.enable", {}, sid);
    const loaded = cdp.waitFor("Page.loadEventFired", 45000, sid);
    await cdp.send("Page.navigate", { url: URL_TARGET }, sid);
    await loaded.catch(() => {});
    const raw = (await cdp.send("Runtime.evaluate", { expression: "fetch(location.href).then(function(r){return r.text()})", returnByValue: true, awaitPromise: true }, sid)).result.value;
    const idx = (s) => raw.indexOf(s);
    const iScript = idx("<script>");
    const iCss = idx("<link rel=\"stylesheet\"");
    const iStyle = idx("<style>");
    const iBody = idx("<body>");
    out.structural = {
      firstInlineScriptAt: iScript,
      firstScriptSrcAt: idx("<script type=\"module\" src="),
      firstExternalCssAt: iCss,
      firstStyleBlockAt: iStyle,
      bodyAt: iBody,
      themeScriptBeforeFirstCss: iScript > 0 && (iCss < 0 || iScript < iCss),
      themeScriptBeforeBody: iScript > 0 && iScript < iBody,
      inlineStyleBeforeBody: iStyle > 0 && iStyle < iBody,
      themeScriptMentions: {
        localStorage: raw.slice(iScript, iScript + 400).indexOf("localStorage") >= 0,
        prefersColorScheme: raw.slice(iScript, iScript + 400).indexOf("prefers-color-scheme") >= 0,
        darkClass: raw.slice(iScript, iScript + 400).indexOf("dark") >= 0,
      },
      firstStyleBlockHead: raw.slice(iStyle, iStyle + 160),
      headBytes: iBody > 0 ? iBody : null,
    };
    try { await cdp.send("Target.closeTarget", { targetId: page.targetId }); } catch (e) {}
    out.cases.push(await runCase(cdp, "dark-system-no-storage", "dark", null));
    out.cases.push(await runCase(cdp, "light-system-no-storage", "light", null));
    out.cases.push(await runCase(cdp, "light-system-with-storage-dark", "light", "dark"));
  } finally {
    cdp.close();
    await chrome.close();
  }
  const file = join(OUT, "first-paint.json");
  writeFileSync(file, JSON.stringify(out, null, 2));
  console.log("=== 结构核验 ===");
  console.log(JSON.stringify(out.structural, null, 1).slice(0, 1500));
  console.log("=== 运行时首帧采样 ===");
  for (const c of out.cases) {
    console.log("--- " + c.label + " (prefers-color-scheme=" + c.media + ", seeded=" + c.seededTheme + ")");
    const s = c.samples || {};
    for (const k of Object.keys(s)) {
      const v = s[k];
      console.log("   " + k + " t=" + v.t + "ms readyState=" + v.readyState + " htmlClass=" + JSON.stringify(v.htmlClass) + " bodyBg=" + v.bodyBg + " sheets=" + v.styleSheetCount + " stored=" + v.stored);
    }
  }
  console.log("out=" + file);
}
main().catch((e) => { console.error("FATAL", e); process.exit(1); });
