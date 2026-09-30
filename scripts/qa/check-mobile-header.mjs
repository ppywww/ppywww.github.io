// scripts/qa/check-mobile-header.mjs
// 用法: node scripts/qa/check-mobile-header.mjs [--out scripts/qa/evidence]
// v1.1 移动端页头验收：320/375/480/767/768/1024/1440 下的页头高度、汉堡按钮可见性、
// 开合（真实鼠标事件）、Esc 关闭、Tab 焦点序列，以及横向滚动。
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { launchChrome, CDP, attachNewPage, sleep } from "./lib/cdp.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(HERE, "lib", f), "utf8");
const HEADER = read("header-state.js");
const ACTIVE = read("active-info.js");
const argv = process.argv.slice(2);
const getArg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const OUT = resolve(getArg("--out", join(HERE, "evidence")));
const URL_TARGET = getArg("--url", "https://ppywww.github.io/");
mkdirSync(OUT, { recursive: true });
const WIDTHS = [320, 375, 480, 767, 768, 1024, 1440];

async function main() {
  const out = { url: URL_TARGET, generatedAt: new Date().toISOString(), cases: [] };
  const chrome = await launchChrome({ port: 9340 });
  const cdp = await CDP.connect(chrome.version.webSocketDebuggerUrl);
  const evalJs = async (sid, expr) => (await cdp.send("Runtime.evaluate", { expression: expr, returnByValue: true }, sid)).result.value;
  try {
    for (const width of WIDTHS) {
      const page = await attachNewPage(cdp, "about:blank");
      const sid = page.sessionId;
      await cdp.send("Page.enable", {}, sid);
      await cdp.send("Runtime.enable", {}, sid);
      await cdp.send("Emulation.setDeviceMetricsOverride", { width: width, height: 800, deviceScaleFactor: 1, mobile: width < 768 }, sid);
      await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: width < 768, maxTouchPoints: 5 }, sid);
      const loaded = cdp.waitFor("Page.loadEventFired", 45000, sid);
      await cdp.send("Page.navigate", { url: URL_TARGET }, sid);
      await loaded.catch(() => {});
      await sleep(900);
      const rec = { width: width, closed: await evalJs(sid, HEADER) };
      const toggleBox = rec.closed.toggle;
      const clickToggle = async () => {
        const t = (await evalJs(sid, HEADER)).toggle;
        const x = t.left + Math.round(t.w / 2);
        const y = t.top + Math.round(t.h / 2);
        await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: x, y: y, button: "left", clickCount: 1 }, sid);
        await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: x, y: y, button: "left", clickCount: 1 }, sid);
        await sleep(450);
      };
      if (toggleBox && toggleBox.display !== "none" && toggleBox.w > 0) {
        await clickToggle();
        rec.open = await evalJs(sid, HEADER);
        await cdp.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }, sid);
        await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }, sid);
        await sleep(450);
        rec.afterEscape = await evalJs(sid, HEADER);
        await clickToggle();
        const seq = [];
        for (let i = 0; i < 6; i++) {
          await cdp.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }, sid);
          await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }, sid);
          await sleep(130);
          const a = await evalJs(sid, ACTIVE);
          seq.push(a ? a.tag + (a.cls ? "." + String(a.cls).split(" ")[0] : "") + "[" + (a.text || "") + "]" : null);
        }
        rec.tabWhileOpen = seq;
        rec.openAgain = await evalJs(sid, HEADER);
      }
      out.cases.push(rec);
      try { await cdp.send("Target.closeTarget", { targetId: page.targetId }); } catch (e) {}
    }
  } finally {
    cdp.close();
    await chrome.close();
  }
  const file = join(OUT, "mobile-header.json");
  writeFileSync(file, JSON.stringify(out, null, 2));
  for (const c of out.cases) {
    const cl = c.closed;
    console.log("w=" + c.width + " | header h=" + (cl.header ? cl.header.h : "-") + "px inner h=" + (cl.headerInner ? cl.headerInner.h : "-") + " | toggle display=" + (cl.toggle ? cl.toggle.display : "-") + " size=" + (cl.toggle ? cl.toggle.w + "x" + cl.toggle.h : "-") + " | nav h=" + (cl.nav ? cl.nav.h : "-") + " | visible items=" + JSON.stringify(cl.visibleNavItems) + " | scrollW=" + cl.scrollWidth + "/" + cl.clientWidth);
    if (c.open) console.log("   open: aria-expanded=" + c.open.toggleAriaExpanded + " nav h=" + (c.open.nav ? c.open.nav.h : "-") + " items=" + JSON.stringify(c.open.visibleNavItems) + " | Esc后 aria-expanded=" + (c.afterEscape ? c.afterEscape.toggleAriaExpanded : "-") + " nav h=" + (c.afterEscape && c.afterEscape.nav ? c.afterEscape.nav.h : "-"));
    if (c.tabWhileOpen) console.log("   Tab(开) => " + JSON.stringify(c.tabWhileOpen));
  }
  console.log("out=" + file);
}
main().catch((e) => { console.error("FATAL", e); process.exit(1); });
