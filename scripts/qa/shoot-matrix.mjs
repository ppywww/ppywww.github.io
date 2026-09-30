// scripts/qa/shoot-matrix.mjs
// 用法: node scripts/qa/shoot-matrix.mjs [--out scripts/qa/evidence]
// 为老板验收 v1.1 产出「亮/暗 × 桌面/移动」截图矩阵：首页 / 文章页 / 归档页
// 另附移动端汉堡菜单展开态与桌面端 1440 全宽各一张。
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { launchChrome, CDP, attachNewPage, sleep } from "./lib/cdp.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SEED = readFileSync(join(HERE, "lib", "seed-theme.js"), "utf8");
const HEADER = readFileSync(join(HERE, "lib", "header-state.js"), "utf8");
const argv = process.argv.slice(2);
const getArg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const OUT = resolve(getArg("--out", join(HERE, "evidence")));
const ORIGIN = "https://ppywww.github.io";
mkdirSync(OUT, { recursive: true });

const PAGES = [["home", "/"], ["post", "/posts/2026-09-30-build-this-blog/"], ["archives", "/archives/"]];
const THEMES = ["light", "dark"];
const DEVICES = [
  { key: "desktop", width: 1440, height: 900, mobile: false, dsf: 1 },
  { key: "mobile", width: 390, height: 844, mobile: true, dsf: 2 },
];

async function shoot(cdp, page, theme, device, opts) {
  const o = opts || {};
  const target = await attachNewPage(cdp, "about:blank");
  const sid = target.sessionId;
  try {
    await cdp.send("Page.enable", {}, sid);
    await cdp.send("Runtime.enable", {}, sid);
    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: theme }] }, sid);
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: device.width, height: device.height, deviceScaleFactor: device.dsf, mobile: device.mobile }, sid);
    if (device.mobile) await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 }, sid);
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: SEED.replace("__THEME_VALUE__", JSON.stringify(theme)) }, sid);
    const loaded = cdp.waitFor("Page.loadEventFired", 45000, sid);
    await cdp.send("Page.navigate", { url: ORIGIN + page }, sid);
    await loaded.catch(() => {});
    await sleep(1200);
    if (o.openMenu) {
      const st = (await cdp.send("Runtime.evaluate", { expression: HEADER, returnByValue: true }, sid)).result.value;
      const t = st.toggle;
      if (t && t.display !== "none" && t.w > 0) {
        const x = t.left + Math.round(t.w / 2);
        const y = t.top + Math.round(t.h / 2);
        await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: x, y: y, button: "left", clickCount: 1 }, sid);
        await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: x, y: y, button: "left", clickCount: 1 }, sid);
        await sleep(600);
      }
    }
    const state = (await cdp.send("Runtime.evaluate", { expression: "({theme: document.documentElement.dataset.theme, cls: document.documentElement.className, bodyBg: getComputedStyle(document.body).backgroundColor, headerH: Math.round(document.querySelector('.site-header').getBoundingClientRect().height), aria: (document.querySelector('.menu-toggle')||{}).getAttribute ? document.querySelector('.menu-toggle').getAttribute('aria-expanded') : null})", returnByValue: true }, sid)).result.value;
    const name = "v11-" + o.name + "-" + theme + "-" + device.key + ".png";
    const shot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }, sid);
    writeFileSync(join(OUT, name), Buffer.from(shot.data, "base64"));
    return { file: name, page: page, theme: theme, device: device.key, viewport: device.width + "x" + device.height, state: state };
  } finally {
    try { await cdp.send("Target.closeTarget", { targetId: target.targetId }); } catch (e) {}
  }
}

async function main() {
  const results = [];
  const chrome = await launchChrome({ port: 9341 });
  const cdp = await CDP.connect(chrome.version.webSocketDebuggerUrl);
  try {
    for (const p of PAGES) {
      for (const theme of THEMES) {
        for (const device of DEVICES) {
          results.push(await shoot(cdp, p[1], theme, device, { name: p[0] }));
        }
      }
    }
    // 附加：移动端汉堡菜单展开态（亮/暗）
    for (const theme of THEMES) {
      results.push(await shoot(cdp, "/", theme, DEVICES[1], { name: "home-menu-open", openMenu: true }));
    }
  } finally {
    cdp.close();
    await chrome.close();
  }
  writeFileSync(join(OUT, "screenshot-matrix.json"), JSON.stringify(results, null, 2));
  for (const r of results) console.log(r.file + " | " + r.viewport + " | theme=" + r.state.theme + " bodyBg=" + r.state.bodyBg + " headerH=" + r.state.headerH + " menuAria=" + r.state.aria);
  console.log("共 " + results.length + " 张，输出目录 " + OUT);
}
main().catch((e) => { console.error("FATAL", e); process.exit(1); });
