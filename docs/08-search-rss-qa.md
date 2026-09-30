# 站内搜索 / RSS / sitemap 独立验收报告（M4-A · task-11）

| 项 | 内容 |
|---|---|
| 验收对象 | task-8 交付物（M4-A：F-05 站内搜索 / F-09 RSS / F-10 sitemap） |
| 实现方 | pages-post（提交 `fb185b8` `feat(m4): 站内搜索（Pagefind）+ RSS + sitemap`） |
| 验收方 | search-rss（**该三项零产出**，与实现方无重叠，避免自己批自己） |
| 验收日期 | 2026-09-30 |
| 验收方式 | 只读静态审查 + 真无头 Chrome（CDP）+ 本地 dist 与**线上**双跑 |
| 被测线上地址 | https://ppywww.github.io |
| 本地被测产物 | ① `dist/`（构建于 2026-09-30T08:58:29Z）；② 实现方重建后复跑（`dist/` 时间戳 2026-09-30T09:23:22Z）——**两次结论一致**，含 3 个不通过项 |
| 复验方式 | 实现方重建 dist 后，用同一套脚本复跑 `check-search.mjs`：搜索 25 通过 / 3 不通过，D-1、S-14、Q-2 三项**结论不变** |
| 脚本 | `scripts/qa-search/`（零第三方依赖，见该目录 README） |
| 约束遵守 | **未修改任何 `src/`、`package.json`、`deploy.yml`；未执行 `npm run build`**（构建权归实现方） |

---

## 一、结论摘要

| 范围 | 结论 | 通过/不通过 | 关键判断 |
|---|---|---|---|
| **F-05 站内搜索** | ⚠️ **有条件通过** —— 主链路可用，但带 2 个功能缺陷 + 1 个结果质量缺陷 | 25 / 3 | 中文关键词能命中目标文章（4/4），但「`?q=` 深链无效」「0 结果时旧结果不清空」「非文章页占结果 77%」 |
| **F-09 RSS** | ✅ **通过**（1 项未验证） | 14 / 0 | XML 合法、3 条 item、`description` 确为引用 `SITE.description`（逐字符一致，含弯引号 ’） |
| **F-10 sitemap** | ✅ **通过** | 11 / 0 | 22 条 URL 无死链，与 24 条实际路由的差额正好是有意排除的 `/search/` 与 `/404.html`，中文路径已百分号编码 |

**线上跑**（`run-all.mjs --base https://ppywww.github.io`）：通过 **47** / 不通过 **3** / 无法验证 0 / 记录 13。
**本地 dist 跑**：通过 **50** / 不通过 **3** / 无法验证 0 / 记录 13（多出的 3 项为「与 dist 产物对齐」类检查，线上模式无 dist 可比）。
**两个环境的 3 个不通过项完全相同**，即缺陷在线上真实存在，不是本地产物问题。

---

## 二、验收标准（PRD §14 / §8 P0）逐条

| 条目 | 结论 | 证据 |
|---|---|---|
| **AC-5** 搜索「任意已发布文章标题中的词」可命中该文 | ✅ **通过** | 4/4 用例命中目标文章：搭建→`/posts/2026-09-30-build-this-blog/`；读书笔记→`/posts/2026-09-25-reading-note-template/`；为什么→`/posts/2026-09-28-why-i-blog/`；性能优化→`/posts/2026-09-30-build-this-blog/`。其中 3/4 首条即目标文章，全部结果带 `<mark>` 高亮 |
| **AC-8** RSS 可被 Feedly 类阅读器订阅并显示摘要 | ⚠️ **部分验证** | XML 合法（Chrome DOMParser 无 parsererror）、`content-type: application/xml`、channel 四要素齐全、3 条 item 均含 title/link/guid/description/合法 RFC-822 pubDate；**未在真实 Feedly 客户端中实测**（见 §五） |
| **AC-10** 404 页可返回首页且带搜索入口 | ⚠️ **部分通过（受 D-1 影响）** | 404 页的搜索表单确实以 GET 提交到 `/search/?q=…`，但目标页**不消费查询参数**（D-1），用户提交后被丢进空搜索框 |
| **AC-11** 键盘可完成「搜索 → 打开文章 → 展开目录」 | ⚠️ **搜索段通过** | 输入框 `ArrowDown` → 焦点落到第 1 条结果，再 `ArrowDown` → 第 2 条，`ArrowUp` → 回第 1 条（`{"links":9,"firstFocused":true,"secondIndex":1,"backIndex":0}`）；「打开文章 / 展开目录」不属本次范围，未验证 |
| **F-05** 输入即出结果，含标题与正文 | ✅ 通过（带缺陷） | 键入后 275–854ms 出结果（含 200ms 防抖）；命中词高亮；索引覆盖标题+正文+标签（Pagefind 整页索引） |
| **F-09** RSS 订阅 | ✅ 通过 | 线上 `/rss.xml` HTTP 200 |
| **F-10** SEO 元数据（sitemap 部分） | ✅ 通过 | 22 条 URL 全部 HTTP 200；canonical 域名 100% 一致 |
| PRD §7.5 空态 / 无结果态 | ✅ 通过 | 空态「输入关键词开始搜索」；无结果「找到 0 条结果」+「没有找到匹配的内容」+ 出口链接「浏览全部文章」 |
| PRD §9 搜索交互（200ms 防抖 / Esc 清空） | ✅ 通过 | 实测首条结果延迟 275–407ms（≥200ms 防抖生效）；`Esc` 清空输入、清空结果、回到空态 |

---

## 三、可复现命令

```bash
# 前置：Node ≥22、Chrome（C:\Program Files\Google\Chrome\Application\chrome.exe）
# 本地（需要一个已构建的 dist/，脚本自身不执行构建）
node scripts/qa-search/run-all.mjs

# 线上
node scripts/qa-search/run-all.mjs --base https://ppywww.github.io

# 单项 / 机器可读
node scripts/qa-search/check-search.mjs  --base https://ppywww.github.io
node scripts/qa-search/check-rss.mjs     --base https://ppywww.github.io --json
node scripts/qa-search/check-sitemap.mjs --base https://ppywww.github.io --json
```

**为什么必须真浏览器**：搜索结果全部在客户端产生（Pagefind wasm + Web Worker），`curl` 拿到的 `/search/` HTML 里没有任何结果条目——纯 HTTP 检查无法验证 F-05/AC-5。

---

## 四、问题清单（按严重度）

### P1 · D-1｜`/search/?q=关键词` 深链无效（功能缺陷，中）

- **现象**：打开 `/search/?q=搭建`，输入框为空、不发起搜索、显示默认空态。本地与线上**均复现**。
- **证据（线上原始输出）**：
  ```
  [不通过] D-1 · 深链 /search/?q=搭建 应回填关键词并自动搜索
          输入框实际值="" · 状态="" · 结果数=0 · 空态文案="输入关键词开始搜索"
  ```
  构建产物印证：`dist/search/index.html` 里是 `<input ... value placeholder="输入关键词…">`（`value` 为空），且页面脚本**没有任何** `location.search` / `URLSearchParams` 读取。
- **根因**：`search.astro` 用 `Astro.url.searchParams.get('q')` 取查询词——静态站构建期求值，永远拿到空字符串；注释里「查询词由服务端渲染回填」的假设在纯静态托管下不成立。
- **影响**：① 404 页搜索框提交后查询词丢失（AC-10 的搜索入口形同虚设）；② 分享/收藏的搜索链接、刷新页面后查询词丢失。
- **修复建议**（一行客户端代码即可）：脚本初始化时读 `new URLSearchParams(location.search).get('q')` 回填 `input.value` 并调用 `run()`；或去掉误导性的服务端注释，改由客户端接管。
- **责任人**：pages-post（文件在 task-8 写入范围内）。

### P1 · S-14｜0 结果时上一次的结果列表不清空（功能缺陷，中）

- **现象**：同一页先搜「搭建」（9 条）→ 再搜一个 0 命中词（龘龘龘），出现「找到 0 条结果」+「没有找到匹配的内容」，**但上一次的 9 条结果仍留在页面上**。本地与线上均复现。
- **证据（线上原始输出）**：
  ```
  [不通过] S-14 · 同一页从「有结果」切到「0 结果」时，上一次的结果列表被清空
          第一次查询（搭建）结果数=9 → 改为 0 命中词（龘龘龘）后：文案="找到 0 条结果" ·
          空态="没有找到匹配的内容" · 空态可见=true · 仍在 DOM 里的旧结果数=9
  ```
- **根因**：`run()` 的 `if (!items.length)` 分支只设了状态文案与空态，没有调用 `listEl.replaceChildren()`；而正常分支会整表替换，所以只有 0 结果这条路径残留旧数据。
- **影响**：空态文案与结果列表自相矛盾，用户会误以为那些是本次结果。
- **修复建议**：0 结果分支补一行清空列表。
- **责任人**：pages-post。

### P1 · Q-2｜搜索结果以列表页/标签页为主，非文章页占 77%（结果质量，中）

- **现象**：4 次关键词查询共 30 条结果，其中 23 条是标签页/分类页/首页/归档页/文章列表页，只有 7 条是文章。
- **证据**：
  ```
  [记录] Q-1 · 结果构成（4 次查询合计）：总结果 30 条，其中非文章页 23 条
         ["/categories/技术/","/tags/Astro/","/tags/性能优化/","/tags/GitHub Pages/","/tags/静态站点/",
          "/posts/","/","/archives/","/tags/读书笔记/","/categories/读书/","/tags/模板/","/tags/写作/",
          "/tags/","/about/","/categories/生活/","/tags/随笔/"]
  [记录] S-6rank · 「为什么」目标文章名次：第 6 位 / 共 9 条（首条="/categories/生活/"）
  ```
  Pagefind 自己的日志也直接点明：`Did not find a data-pagefind-body element on the site. ↳ Indexing all <body> elements on the site.`
- **根因**：全站未标注 `data-pagefind-body`，Pagefind 默认索引整页，于是每篇文章的**标签、分类、导航、页脚文字**都被算进标签页/分类页/首页，任何命中标签词的查询都会把这些列表页排在前面。
- **影响**：AC-5 字面要求仍满足（目标文章在结果里），但「输入即直达文章」（PRD §7.5 / J2）体验受损；文章越多越明显。
- **修复建议**（**超出 task-8 写入范围，需 Lead 决策**）：给 `PostLayout.astro` 的文章容器加 `data-pagefind-body`（索引只取正文），或在列表/分类/标签页容器加 `data-pagefind-ignore`；改完需重跑本套脚本确认 Q-2。
- **责任人**：Lead 裁决 → 指定实现人（pages-post 或 pages-lists）。

### P2 · Q-3｜完整标题长查询 0 结果（工具限制，低）

- `我为什么开始写博客`（完整标题）→「找到 0 条结果」；同一标题的短词 `为什么` 可命中。
- Pagefind zh-cn 不做词干化/部分匹配（ADR-001 §9 U6 已把该风险标为「未验证」，本次实测确认为真）。**不构成 AC-5 不通过**（AC-5 要求的是「标题中的词」），但用户粘贴整句标题时会困惑。
- 建议：写入需求池（P2 已列「拼音/模糊匹配」）；或后续把标题作为独立字段优化。

### P2 · D-5｜RSS 路径文档口径不一致（文档缺陷，低）

- PRD §5（`/index.xml  RSS`）、F-09（`/index.xml` 可被阅读器识别）、设计系统 §6.17 页脚示例均写 **`/index.xml`**；而实现与 `src/consts.ts` 的 `SOCIAL`、`content/pages/about.md`、`docs/06-visual-spec.md` 均为 **`/rss.xml`**。
- 现状实现 `/rss.xml` 与站点内部链接自洽（页脚 RSS 入口可用），**功能上不阻塞 AC-8**；但 PRD/设计系统文字与实际不符。
- 建议：Lead 二选一 —— 改 PRD/设计系统文字为 `/rss.xml`，或补一个 `/index.xml` 路由（别名/重定向）。
- **责任人**：Lead（文档）／若加别名则 pages-post。
- ✅ **已裁决（2026-09-30，Lead）**：**改文档、不加别名路由**；`docs/02-prd.md` 与 `docs/04-design-system.md` 里的 `/index.xml` 已全部改为 `/rss.xml`。本项关闭。

### P2 · 备注项（非缺陷，供决策）

| # | 事项 | 说明 |
|---|---|---|
| N-1 | `/404.html` 与 `/search/` 也在索引里 | `pagefind-entry.json` 的 `page_count = 24`，等于全部 HTML 页数（含这两页）。实测查询未让它们浮出（S-13 两项通过），但**「是否真的搜不到」未逐条确认**（见 §五）。建议 404 页加 `data-pagefind-ignore="all"` 更稳 |
| N-2 | 搜索结果里的日期由 URL 反推 | `search.astro` 用 `/posts/YYYY-MM-DD-…/` 正则从 URL 取日期。依赖 PRD §6.3 命名约定；若将来出现不带日期前缀的 slug，日期会整条消失。建议改用 `data-pagefind-meta="date"` |
| N-3 | 结果数文案上限 | 代码取 `slice(0, 20)` 后按截断后的数量报「找到 N 条结果」。当前全站 3 篇、实测最多 11 条，未触发；匹配数 >20 时会少报 |
| N-4 | 无 `public/robots.txt` | 没有 `Sitemap:` 指令（`public/` 不在 task-8 写入范围）。搜索引擎仍可提交 sitemap，但少一条自动发现路径 |
| N-5 | 搜索页未使用 `@pagefind/default-ui` | 实现方按**设计系统 §6.16 的推荐**自建结果 DOM，直接调 Pagefind JS API，从而 100% 复用 tokens。已核实：替换的只是渲染层，索引与检索能力仍全部来自 Pagefind（S-2/S-12 证据）。✅ **已裁决（2026-09-30，Lead）：批准自建 DOM**——F-05 只规定「能搜到」、未规定 UI 形态，自建是满足「样式只用设计令牌」的唯一可行路径；**本项判定通过，不需改造** |

---

## 五、无法验证项（不做推断，如实列出）

| # | 未验证项 | 原因 | 影响 |
|---|---|---|---|
| U-1 | RSS 对 `draft: true` 文章的**运行时**排除 | `src/content/posts/` 当前 3 篇全部 `draft: false`，无草稿样本；造样本需改 `src/content`（非本次范围） | 静态审查确认过滤表达式存在（`import.meta.env.PROD ? !data.draft : true`），逻辑上成立；但未取得运行时证据 |
| U-2 | RSS 在真实 Feedly/阅读器中的展示 | 无 Feedly 账号，无法登录第三方客户端 | AC-8 只能给到「协议层合法 + 字段完整」，见 §二 |
| U-3 | GitHub Actions 上 pagefind 步骤的**实跑** | 本次未触发/未观测 Actions 运行日志 | 已核验配置口径与 action 源码逻辑（见 §六-5），可推断但未实测 |
| U-4 | `/404.html`、`/search/` 是否真的不可被搜到 | 二者在 `page_count=24` 中；实测查询未浮出，但要逐条确认需要「只在该页出现的词」，而 Pagefind zh-cn 的分词/部分匹配让「唯一词」难以构造 | 见 N-1；不视为缺陷 |
| U-5 | 匹配数 >20 时的计数文案 | 当前内容量下最大命中 11 条，触发不到 `slice(0, 20)` | 见 N-3 |
| U-6 | AC-11 的「打开文章 → 展开目录」两段 | 不属 task-8 范围 | 由 task-9（tech-scout）覆盖 |

---

## 六、静态审查结论（Lead 指定的 6 个检查点）

| # | 检查点 | 结论 | 证据 |
|---|---|---|---|
| 1 | 索引产出路径 vs `search.astro` 引用路径 | ✅ 一致 | `package.json` → `pagefind --site dist`，Pagefind 默认输出 `dist/pagefind/`；`search.astro` 动态 `import('/pagefind/pagefind.js')`。实测 `/pagefind/pagefind.js` HTTP 200，且页面运行期资源列表含 `/pagefind/pagefind.js`、`/pagefind/pagefind-worker.js` |
| 2 | RSS 的 description 是否**真引用**而非硬编码 | ✅ 真引用 | `rss.xml.ts` 含 `SITE.description`（2 处），**不含**该文案的字面量副本；线上 XML 与 `src/consts.ts` 的值**逐字符相同**（含中文弯引号 `’`） |
| 3 | RSS 是否只含已发布文章、频道元数据是否完整 | ✅ 静态通过 / ⚠️ 运行时未验证 | item 数 = dist 已发布文章数（3=3）；channel 具备 title/link/description/language + 每条 item 的 guid/pubDate/category；草稿过滤见 U-1 |
| 4 | sitemap 覆盖数 vs 实际路由数、canonical 域名 | ✅ 一致 | dist 路由 24，sitemap 22，差额 `{"/404.html","/search/"}` 正好是有意排除项；22 条本地全部存在、线上全部 HTTP 200；canonical 域名 `https://ppywww.github.io` 100% 一致；中文路径为 `%E6%8A%80%E6%9C%AF` 形态 |
| 5 | `package.json` build 脚本 vs `deploy.yml` 口径 | ✅ 一致，CI 不会漏 pagefind | `build = "astro build && pagefind --site dist"`；`deploy.yml` 显式 `build-cmd: npm run build`；`withastro/action@v6` 官方 `action.yml` 的构建步骤为 `run: ${{ inputs.build-cmd || '$PACKAGE_MANAGER run build' }}`，上传路径为 `dist/`（含 `dist/pagefind/`）→ 索引随产物一起发布 |
| 6 | 有无偷偷引入 UI 框架 / Web 字体 / 裸 hex | ✅ 干净 | 新增依赖仅 `@astrojs/rss`、`pagefind`；`search.astro` 与 `Header.astro` 裸 hex **0 处**（全部 `--color-*` 等语义 token）；`src/` 无 `@font-face`/外部字体/React/Vue/Svelte/Tailwind；搜索页为原生 JS |

**Header 变更复核**：导航仍为 5 项（`NAV` 未改），新增的搜索入口是独立 `<a class="icon-btn" href="/search/" aria-label="站内搜索">`，SVG `aria-hidden`，触控命中区 44×44 —— 符合设计系统 §6.1。

---

## 七、交付脚本清单（scripts/qa-search/）

| 文件 | 用途 |
|---|---|
| `run-all.mjs` | 一键跑三项 + 总汇总（任一不通过 exit 1） |
| `check-search.mjs` | 搜索 28 项断言/记录：中文命中、计数一致性、高亮、空态、无结果态、防抖、Esc、键盘 ↑/↓、深链、索引卫生、结果质量、0 结果清空 |
| `check-rss.mjs` | RSS 17 项：XML 合法性、channel/item 字段、description 引用校验、draft 过滤静态审查 |
| `check-sitemap.mjs` | sitemap 15 项：合法性、无死链、路由覆盖、百分号编码、pagefind page_count 对齐 |
| `probe-pagefind.mjs` | 工装自检：证明「无头 Chrome + 静态服务器 + Pagefind + 中文检索」链路本身可用 |
| `lib/*.mjs` | 零依赖静态服务器 / CDP 驱动 / 四态报告器 / DOMParser 校验 / dist 元数据 |

> 脚本对 `src/` 与 `package.json` **只读**，不执行构建。验收方未产出 task-8 的任何一行实现代码。

---

## 八、验收方声明

1. 本报告所有结论均来自脚本实测输出或源码只读审查；**未验证项已单列（§五），不以推断充当证据**。
2. 发现的 3 个不通过项**未自行修改**，已按流程上报 Lead 并通知实现方 pages-post（附最小修复建议）。
   - ✅ Lead 已判定 3 项全部有效，并立 **task-13**（owner = pages-post）派修：D-1、S-14 为代码缺陷；Q-2 的产品要求为「搜索结果必须以文章为主」，机制由实现方选定，但须先查 Pagefind 官方文档再用真实构建验证（注意 `data-pagefind-body` 的全局副作用）。
   - 本报告的两处口径问题（RSS 路径、是否必须用官方 UI）已由 Lead 裁决关闭，见 §四 D-5 与 N-5。
3. 实现方对 D-1、S-14 的修复落地后，请重跑 `node scripts/qa-search/run-all.mjs --base https://ppywww.github.io`，本报告结论随之更新（重点看 D-1、S-14、Q-2 三项）。

---

## 九、脚本增强与本地预跑（2026-09-30 傍晚，task-16 顺带）

### 9.1 新增：robots.txt 校验（B-1 ~ B-8）

Lead 授权后，在 `check-sitemap.mjs` 里补上 robots.txt 的自动化覆盖（此前是零覆盖死角）：

| ID | 检查 | 本地结果 |
|---|---|---|
| B-1 | dist / 线上 robots.txt 存在且 HTTP 200 | ✅ 通过（dist 于 09:54 构建后已含该文件） |
| B-2 | 含 `Sitemap:` 行 | ✅ |
| B-3 | Sitemap 域名 = `src/consts.ts` 的 `SITE.url`（**读源码比对，不硬编码**） | ✅ |
| B-4 | Sitemap 指向的 `/sitemap.xml` 实际存在且 HTTP 200 | ✅ |
| B-5 | 含 `Disallow: /search/` | ✅ |
| B-6 | **反向校验**：Allow/Disallow 的每条路径真实存在（HTTP 200） | ✅（`/`、`/search/` 均 200） |
| B-7 | 不存在 `Disallow: /` 式整站封禁 | ✅ |
| B-8 | 语法合法（每行「字段: 值」+ 至少一条 User-agent） | ✅ |

> 说明：`public/robots.txt` 是我在 task-16 交付的唯一源文件；`B-1` 在本报告首次编写时**不通过**（当时尚未构建），
> 脚本会同时打印 B-1b 说明「源文件已存在、只是还没构建」，以免把「未构建」误读成「文件写错」。

### 9.2 修正：Pagefind 索引页数判定改为模式自适应（M-15）

task-13 采用 `data-pagefind-body` 后，Pagefind 的官方语义生效——**只有带该属性的页面进索引**，
索引页数从 24 掉到 3（正好是 3 个正文页）。原 M-15「索引页数 = dist HTML 页数」的假设随之失效，
**这是我的检查项自己的过期假设，不是实现缺陷**。已改为：先探测 dist 中有多少页面带 `data-pagefind-body`，
再据此决定期望页数，并打印当前模式（M-15a）。本地复跑：page_count=3 = 3 个正文页，✅ 通过。

### 9.3 修正：键盘用例（S-15）需要 ≥2 条结果

采用 `data-pagefind-body` 后，「搭建」只剩 1 条命中，S-15 因「没有第二条可跳」而失败——属**测试自身失真**，非页面缺陷
（实测 ↑/↓ 行为正常：`links=1, firstFocused=true`）。已改用能命中 3 条的「为什么」，并断言 `links >= 2`。复跑通过。

### 9.4 新增：产物稳定性守卫（并记录一次真实的假失败）

**事件**：17:52 的一次本地 `run-all` 报出 11 项「不通过」（AC-5 全部无结果）。排查发现：当时实现方正在
`npm run build`，dist 被清空重写，`/pagefind/*` 一度取不到 → 全部查询落空。**这是并发构建造成的假失败，不是真缺陷**
（dist 重建完成后，同一套脚本 27 通过 / 1 不通过）。

**改进**：`run-all.mjs` 现在会在开始时与结束时各取一次「产物指纹」（dist mtime + Pagefind 索引 hash），
不一致即打印醒目警告并把退出码置 1 —— 结论不可信时必须重跑，而不是让它悄悄混进验收结论。

### 9.5 本地预跑结果（**非正式复验**）

| 套件 | 结果 |
|---|---|
| 搜索 | 28 通过 / 0 不通过 |
| RSS | 14 通过 / 0 不通过 |
| sitemap + robots | 19 通过 / 0 不通过 |
| **合计** | **61 通过 / 0 不通过**，产物指纹前后一致（dist mtime `2026-09-30T09:54:09Z`，索引 `page_count=3`） |

即：**D-1、S-14、Q-2 三项在本地已全部转绿**（深链可回填并自动搜索；0 结果不再残留旧结果；
结果 100% 为文章页，「为什么」的目标文章由第 6 位升到第 1 位；标签搜索未因 `data-pagefind-body` 回归）。

> ⚠️ 以上是**本地预跑**，用于尽早发现回归；**正式结论以 pages-post 推送后的线上 `run-all` 为准**（届时本报告将追加线上数据）。
