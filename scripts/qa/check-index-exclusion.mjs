// scripts/qa/check-index-exclusion.mjs
// 用法: node scripts/qa/check-index-exclusion.mjs
// 独立复核构建时的 Pagefind 排除项：404 页正文特征串「链接可能已失效」若被索引，
// 说明 --exclude-selectors ".notfound" 未生效。
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { launchChrome, CDP, attachNewPage, sleep } from "./lib/cdp.mjs";
const HERE = dirname(fileURLToPath(import.meta.url));
const STATE = readFileSync(join(HERE, "lib", "search-state.js"), "utf8");
const queries = ["链接可能已失效", "这个页面走丢了", "回到首页，或者直接搜索"];
const chrome = await launchChrome({ port: 9338 });
const cdp = await CDP.connect(chrome.version.webSocketDebuggerUrl);
const page = await attachNewPage(cdp, "https://ppywww.github.io/search/");
const sid = page.sessionId;
await cdp.send("Page.enable", {}, sid);
await cdp.send("Runtime.enable", {}, sid);
const loaded = cdp.waitFor("Page.loadEventFired", 45000, sid);
await cdp.send("Page.navigate", { url: "https://ppywww.github.io/search/" }, sid);
await loaded.catch(() => {});
await sleep(2500);
const out = [];
for (const q of queries) {
  await cdp.send("Runtime.evaluate", { expression: "var i=document.querySelector('#search-input'); i.value=''; i.dispatchEvent(new Event('input',{bubbles:true})); i.focus();" }, sid);
  await sleep(300);
  await cdp.send("Input.insertText", { text: q }, sid);
  await sleep(1800);
  const st = (await cdp.send("Runtime.evaluate", { expression: STATE, returnByValue: true }, sid)).result.value;
  out.push({ query: q, count: st.resultsCount, status: st.statusText, hrefs: st.resultHrefs });
}
console.log(JSON.stringify(out, null, 1));
try { await cdp.send("Target.closeTarget", { targetId: page.targetId }); } catch (e) {}
cdp.close();
await chrome.close();
