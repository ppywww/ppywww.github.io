# scripts/qa-search · 搜索 / RSS / sitemap 独立验收

M4-A（task-8）交付物的**独立验证**脚本集，由不参与该交付的成员编写（避免「自己批自己」）。
零第三方依赖：只用 Node 内置能力 + 本机 Chrome。

## 前置

- Node ≥ 22（用到内置 `WebSocket` 与全局 `fetch`）
- Chrome：`C:\Program Files\Google\Chrome\Application\chrome.exe`（可用 `--chrome` 或环境变量 `CHROME_PATH` 覆盖）
- 本地模式需要一个已构建好的 `dist/`（**本脚本不会执行 `npm run build`**，构建权归交付方）

## 用法

```bash
# 本地 dist（内置静态服务器把 dist 通过 HTTP 提供，Pagefind 的 wasm/Worker 必须走 HTTP 才能跑）
node scripts/qa-search/run-all.mjs

# 线上
node scripts/qa-search/run-all.mjs --base https://ppywww.github.io

# 单项
node scripts/qa-search/check-search.mjs   --base https://ppywww.github.io
node scripts/qa-search/check-rss.mjs      --base https://ppywww.github.io
node scripts/qa-search/check-sitemap.mjs  --base https://ppywww.github.io

# 机器可读
node scripts/qa-search/run-all.mjs --base https://ppywww.github.io --json
```

退出码：任一「不通过」→ 1；本地模式下**产物被并发重建**→ 同样置 1（结论不可信，必须重跑）。

> ⚠️ **验收前务必确认没有人在构建**。`run-all.mjs` 会在开始时打印「产物指纹」（dist mtime + Pagefind 索引 hash），
> 结束时再打一次；若两次不一致，直接判定本次结论不可信并置退出码 1。
> 这不是洁癖：2026-09-30 本套脚本曾在一次与 `npm run build` 竞争的运行里报出 11 项**假失败**。

## 为什么必须真浏览器

搜索结果完全由客户端产生（Pagefind wasm + Web Worker），`dist/search/index.html` 里没有任何结果条目，
`curl` 一行都验不到。故用 CDP（`lib/chrome-cdp.mjs`，Node 内置 WebSocket）驱动无头 Chrome，
以「模拟键入 + 派发 input 事件」的方式走页面真实支持的交互路径。

## 文件

| 文件 | 作用 |
|---|---|
| `run-all.mjs` | 一键跑三项并汇总 |
| `check-search.mjs` | 站内搜索：中文命中、空态/无结果态、防抖、Esc、深链、索引卫生、结果质量 |
| `check-rss.mjs` | RSS：XML 合法性 + channel/item 字段 + description 是否真引用 consts.ts |
| `check-sitemap.mjs` | sitemap：XML 合法性 + 无死链 + 路由覆盖 + 中文百分号编码 + Pagefind 索引页数 + **robots.txt（B-1~B-8）** |
| `probe-pagefind.mjs` | 工装自检：确认「无头 Chrome + 静态服务器 + Pagefind + 中文检索」链路本身可用 |
| `lib/serve-dist.mjs` | 零依赖静态服务器（支持虚拟路由，便于注入探针页而不污染 dist） |
| `lib/chrome-cdp.mjs` | 无头 Chrome 启动 + CDP 求值 + 条件轮询 |
| `lib/report.mjs` | 「通过 / 不通过 / 无法验证 / 记录」四态断言收集器 |
| `lib/xml-check.mjs` | 用 Chrome 的真 DOMParser 校验 XML 并抽取字段 |
| `lib/dist-info.mjs` | 只读读取 `src/consts.ts` 单点配置与 dist 路由清单 |

## robots.txt 校验（B-1 ~ B-8）

| ID | 检查 |
|---|---|
| B-1 | `dist/robots.txt`（本地经内置服务器）与线上 `/robots.txt` 均存在且 **HTTP 200** |
| B-1b | 取不到时说明「源文件 `public/robots.txt` 已存在、只是还没构建」——避免把「未构建」误读成「写错」 |
| B-2 | 含 `Sitemap:` 行 |
| B-3 | Sitemap 域名 = **`src/consts.ts` 的 `SITE.url`**（读源码比对，**不硬编码**，否则改域名后脚本会替我们说谎） |
| B-4 | Sitemap 指向的路径实际存在且 HTTP 200（不是死链） |
| B-5 | 含 `Disallow: /search/`（与「search 页 noindex 且不进 sitemap」口径一致） |
| B-6 | **反向校验**：Allow/Disallow 的每条路径都真实存在（HTTP 200）——别禁抓一个不存在的路径；含通配符的条目记为「无法反向校验」 |
| B-7 | 不存在 `Disallow: /` 式整站封禁（最致命的一类笔误） |
| B-8 | 语法合法：每行「字段: 值」，且至少一条 `User-agent` |

## 两处「会随时间变化」的判定口径

1. **Pagefind 索引页数（M-15）是模式自适应的**：Pagefind 官方语义为「站内只要有任一页面带 `data-pagefind-body`，
   就只有带该属性的页面进索引」。因此脚本先探测 dist 里有多少页面带该属性，再决定期望页数
   （有 → 只数正文页；无 → 数全部路由），并把判定模式打印出来。**不要把它简化成「索引数 = HTML 数」。**
2. **键盘 ↑/↓ 用例（S-15）需要 ≥2 条结果**：采用 `data-pagefind-body` 后部分关键词只命中 1 条，
   脚本因此选用能命中多条的词，并断言 `links >= 2`，避免测试自身失真。

## 约定

- 只读：脚本不改任何 `src/`、`package.json`；不执行构建。
- `--log <file>` 可把每个步骤的进度写文件，便于卡住时定位（`check-search.mjs` 支持）。
- 结论以「通过 / 不通过 / 无法验证」三态给出，**未验证项必须写明原因**，不用推断代替证据。
