// scripts/qa/check-social-icons.mjs
// 用法: node scripts/qa/check-social-icons.mjs
// 复核首页社交图标区的渲染尺寸（截图中 RSS 图标疑似只渲染出一个点）。
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { launchChrome, CDP, attachNewPage, sleep } from "./lib/cdp.mjs";
const HERE = dirname(fileURLToPath(import.meta.url));
const EXPR = readFileSync(join(HERE, "lib", "social-icons.js"), "utf8");
const chrome = await launchChrome({ port: 9342 });
const cdp = await CDP.connect(chrome.version.webSocketDebuggerUrl);
const page = await attachNewPage(cdp, "https://ppywww.github.io/");
const sid = page.sessionId;
await cdp.send("Page.enable", {}, sid);
await cdp.send("Runtime.enable", {}, sid);
const loaded = cdp.waitFor("Page.loadEventFired", 45000, sid);
await cdp.send("Page.navigate", { url: "https://ppywww.github.io/" }, sid);
await loaded.catch(() => {});
await sleep(1200);
const r = await cdp.send("Runtime.evaluate", { expression: EXPR, returnByValue: true }, sid);
console.log(JSON.stringify(r.result.value, null, 1));
try { await cdp.send("Target.closeTarget", { targetId: page.targetId }); } catch (e) {}
cdp.close();
await chrome.close();
