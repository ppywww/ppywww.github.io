// scripts/qa/check-search.mjs
// 用法: node scripts/qa/check-search.mjs [--out scripts/qa/evidence]
// AC-5 站内搜索真机复核：真实键盘/IME 输入路径（Input.insertText），独立测量防抖延迟、
// Esc 清空、上下键移动焦点、role=status 计数、中文命中与无结果空态，并截图留证。
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { launchChrome, CDP, attachNewPage, sleep } from "./lib/cdp.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const STATE = readFileSync(join(HERE, "lib", "search-state.js"), "utf8");
const argv = process.argv.slice(2);
const getArg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const OUT = resolve(getArg("--out", join(HERE, "evidence")));
const URL_SEARCH = getArg("--url", "https://ppywww.github.io/search/");
mkdirSync(OUT, { recursive: true });

async function main() {
  const chrome = await launchChrome({ port: 9336 });
  const cdp = await CDP.connect(chrome.version.webSocketDebuggerUrl);
  const page = await attachNewPage(cdp, "about:blank");
  const sid = page.sessionId;
  const out = { url: URL_SEARCH, generatedAt: new Date().toISOString(), steps: {} };
  const evalState = async () => (await cdp.send("Runtime.evaluate", { expression: STATE, returnByValue: true }, sid)).result.value;
  const key = async (k, vk) => {
    await cdp.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: k, code: k, windowsVirtualKeyCode: vk }, sid);
    await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code: k, windowsVirtualKeyCode: vk }, sid);
  };
  const shoot = async (name) => {
    const s = await cdp.send("Page.captureScreenshot", { format: "png" }, sid);
    writeFileSync(join(OUT, name), Buffer.from(s.data, "base64"));
  };
  try {
    await cdp.send("Page.enable", {}, sid);
    await cdp.send("Runtime.enable", {}, sid);
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 900, height: 900, deviceScaleFactor: 1, mobile: false }, sid);
    const loaded = cdp.waitFor("Page.loadEventFired", 45000, sid);
    await cdp.send("Page.navigate", { url: URL_SEARCH }, sid);
    await loaded.catch(() => {});
    await sleep(2500);
    out.steps.initial = await evalState();
    // 聚焦输入框（页面自带 autofocus，这里显式确认）
    await cdp.send("Runtime.evaluate", { expression: "document.querySelector('#search-input').focus()" }, sid);
    out.steps.focus = { activeId: (await evalState()).activeId };
    // 1) 中文查询 + 防抖延迟测量
    const t0 = Date.now();
    await cdp.send("Input.insertText", { text: "读书笔记" }, sid);
    const samples = [];
    let firstResultAt = null;
    for (let i = 0; i < 150; i++) {
      const st = await evalState();
      const dt = Date.now() - t0;
      samples.push({ dt: dt, count: st.resultsCount, status: st.statusText });
      if (st.resultsCount > 0 && firstResultAt === null) { firstResultAt = dt; break; }
      if (dt > 4000) break;
      await sleep(25);
    }
    out.steps.query1 = { query: "读书笔记", firstResultAtMs: firstResultAt, sampleAt100ms: samples.find((s) => s.dt >= 90 && s.dt <= 130) || null, sampleAt180ms: samples.find((s) => s.dt >= 170 && s.dt <= 200) || null, final: await evalState() };
    await shoot("search-results.png");
    // 2) Esc 清空
    await key("Escape", 27);
    await sleep(400);
    out.steps.afterEscape = await evalState();
    // 3) 重新输入 + 上下键移动焦点
    await cdp.send("Runtime.evaluate", { expression: "document.querySelector('#search-input').focus()" }, sid);
    await cdp.send("Input.insertText", { text: "的" }, sid);
    await sleep(1500);
    const before = await evalState();
    await key("ArrowDown", 40);
    await sleep(250);
    const afterDown = await evalState();
    await key("ArrowDown", 40);
    await sleep(250);
    const afterDown2 = await evalState();
    await key("ArrowUp", 38);
    await sleep(250);
    const afterUp = await evalState();
    out.steps.arrowKeys = {
      before: { activeTag: before.activeTag, activeId: before.activeId, count: before.resultsCount },
      afterDown: { activeTag: afterDown.activeTag, activeHref: afterDown.activeHref, activeText: afterDown.activeText },
      afterDown2: { activeTag: afterDown2.activeTag, activeHref: afterDown2.activeHref },
      afterUp: { activeTag: afterUp.activeTag, activeHref: afterUp.activeHref, activeText: afterUp.activeText },
    };
    // 4) 无结果空态
    await cdp.send("Runtime.evaluate", { expression: "var i=document.querySelector('#search-input'); i.value=''; i.dispatchEvent(new Event('input',{bubbles:true})); i.focus();" }, sid);
    await sleep(400);
    await cdp.send("Input.insertText", { text: "qqqzzzxxx" }, sid);
    await sleep(1800);
    out.steps.noResult = await evalState();
    await shoot("search-empty.png");
    // 4b) 中文常见单字查询（记录召回噪声观察）
    await cdp.send("Runtime.evaluate", { expression: "var i=document.querySelector('#search-input'); i.value=''; i.dispatchEvent(new Event('input',{bubbles:true})); i.focus();" }, sid);
    await sleep(400);
    await cdp.send("Input.insertText", { text: "的" }, sid);
    await sleep(1600);
    out.steps.singleCharQuery = { query: "的", count: (await evalState()).resultsCount, status: (await evalState()).statusText, titles: (await evalState()).resultTitles };
    // 4c) 404 页文案是否被索引（构建时 --exclude-selectors ".notfound" 的独立复核）
    await cdp.send("Runtime.evaluate", { expression: "var i=document.querySelector('#search-input'); i.value=''; i.dispatchEvent(new Event('input',{bubbles:true})); i.focus();" }, sid);
    await sleep(400);
    await cdp.send("Input.insertText", { text: "走丢" }, sid);
    await sleep(1600);
    out.steps.notFoundIndexed = { query: "走丢", count: (await evalState()).resultsCount, status: (await evalState()).statusText, titles: (await evalState()).resultTitles };
    // 5) Enter 提交（表单回退行为）
    await cdp.send("Runtime.evaluate", { expression: "document.querySelector('#search-input').focus()" }, sid);
    await key("Enter", 13);
    await sleep(2500);
    const afterEnter = await cdp.send("Runtime.evaluate", { expression: "location.href + ' || ' + document.querySelector('#search-input').value + ' || results=' + document.querySelectorAll('#search-results li').length + ' || ' + (document.querySelector('#search-status')||{}).textContent", returnByValue: true }, sid);
    out.steps.enterSubmit = afterEnter.result.value;
  } catch (e) {
    out.error = String((e && e.stack) || e);
  } finally {
    try { await cdp.send("Target.closeTarget", { targetId: page.targetId }); } catch (e) {}
    cdp.close();
    await chrome.close();
  }
  const file = join(OUT, "search-check.json");
  writeFileSync(file, JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 1));
  console.log("out=" + file);
}
main().catch((e) => { console.error("FATAL", e); process.exit(1); });
