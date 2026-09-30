# 独立验收报告 · ppy-Blog 线上站点（M5-A）

| 项 | 内容 |
|---|---|
| 验收对象 | **https://ppywww.github.io**（第三轮部署：文章/归档/分类/标签/作品/关于/404 + 搜索 + RSS + sitemap） |
| 验收方 | tech-scout（**未写过本项目任何一行业务代码**，独立第三方） |
| 验收日期 | 2026-09-30（验收窗口 16:47–17:45，针对**第三轮**部署：全站 24 页 + 搜索 + RSS + sitemap） |
| 参考基线 | [02-prd.md](./02-prd.md) §14 验收标准（AC-1..AC-12）、§8 P0 清单、§10 质量门禁 |
| 真机环境 | Google Chrome **154.0.8037.59**（无头模式，CDP 直连）· Node v24.19.0 · Windows 11 26200 |
| 工具链 | 自研零依赖 CDP 脚本（`scripts/qa/`）+ `npx -y lighthouse`（Lighthouse 12.x，移动端模拟节流） |
| 硬约束遵守 | 未修改任何源码；未执行 `npm run build`；只写本文件与 `scripts/qa/` 下的脚本与证据 |
| 取证方式 | 全部结论来自**本次真机/脚本实测**；实现方自述一律重新独立验证 |

**统计：AC-1..AC-12 共 12 条 → 通过 9 条（AC-1/3/4/5/6/8/10/11/12）、不通过 1 条（AC-2）、部分通过 2 条（AC-7 后半、AC-9 运行日志，均因本任务禁止本地构建/API 限流）。**
**未发现阻断级功能缺陷；发现 1 个验收硬门禁不达标（文章页无障碍 91 分）与 1 个系统性触控目标过小问题。**

---

## 0. 一句话结论

站点在**功能完整性**上是达标的：24 个页面全部 200、无死链、无横向滚动、外链 rel 全合规、搜索中文可用、RSS/sitemap/Pagefind 索引结构正确、深色模式在**首帧之前**就已生效（三重证据）。
不达标的是**无障碍质量门禁**：文章页 Lighthouse A11y **91 < 95**（代码块浅色配色对比度 4.30/4.35，低于 4.5），且**页眉站点名链接 `a.brand` 在全部页面**触发 `target-size` 失败——后者是"每个页面都扣分"的系统性问题。

---

## 1. AC-1..AC-12 逐条结论

| AC | 结论 | 关键证据（可复现） |
|---|---|---|
| **AC-1** 首页 4G 下 1.5s 内可读（LCP < 1.5s） | ✅ **通过（附网络说明）** | Lighthouse 移动端模拟节流：首页 **LCP 1253ms**、FCP 1253ms、TBT 0ms、CLS 0（`scripts/qa/evidence/lh-home.json`）。跨境真实网络补充：冷启动首次请求 TTFB **2091ms**、LCP 2640ms；同一连接后续页面 LCP 180–740ms。**站点自身渲染开销仅约 0.55s，2.6s 的冷启动来自 GitHub Pages 跨境 RTT，属网络问题而非站点问题**（依据：首页 HTML 仅 3.6KB，无 JS，CSS 2.5KB） |
| **AC-2** Lighthouse 四项 ≥ 95（移动端） | ❌ **不通过** | 首页 100/95/100/100（达标）；**文章页 100/91/100/100 → A11y 91 不达标**；搜索页 100/96/100/63 → SEO 63（原因：搜索页 `<meta name="robots" content="noindex, nofollow">`，**属有意排除索引**，需 Lead 裁定计分口径）。扣分项见 §2 |
| **AC-3** 深色模式切换无白闪，刷新后记忆生效 | ✅ **通过（三重证据）** | ① 结构：主题内联脚本位于原始 HTML 第 **273** 字节，早于首个外部样式表（**2529**）与 `<body>`（**2594**），脚本内含 `localStorage`/`prefers-color-scheme`/`dark`；② 运行时：`requestAnimationFrame` 首帧回调（首次绘制前）采样，三种情形下 htmlClass 与 body 计算背景色**已是目标主题**（暗：#0F1115 / 亮：#FCFCFD），样式表计数 1；③ 录屏首帧：`Page.startScreencast` 抓到的第 1、2 帧主色即 **#0F1115，近白像素占比 0.0000**（`firstframe-dark-00.png`/`-01.png`）。记忆：Enter 触发切换后 `localStorage['pref-theme']=dark`、`aria-pressed=true`、按钮 aria-label 同步为"切换到浅色模式" |
| **AC-4** 全站无横向滚动（320px 起） | ✅ **通过（抽测 7 页）** | 320×720 视口下 `document.documentElement.scrollWidth === clientWidth === 320`：`/`、`/posts/2026-09-30-build-this-blog/`、`/archives/`、`/tags/`、`/works/`、`/categories/`、`/about/` 全部无溢出。文章页存在 `right>320` 的代码块内元素，但均处于自身 `overflow-x` 容器内，未造成页面级滚动。截图：`w320-*.png` |
| **AC-5** 搜索命中标题中的词 | ✅ **通过** | 真机输入（`Input.insertText`）"读书笔记" → `找到 11 条结果`，**首条即目标文章** `/posts/2026-09-25-reading-note-template/`；索引同时覆盖标签/分类页（`/tags/读书笔记/`、`/categories/读书/`）。无结果查询 `qqqzzzxxx` → 0 条 + 空态"没有找到匹配的内容"+ 出路按钮 |
| **AC-6** 归档条目数与实际一致、年/月计数正确 | ✅ **通过** | `/archives/` 页面："按年份与月份排列，共 **3** 篇文章"、"**2026** 年 **3** 篇"、"**9** 月 **3** 篇"，列出 09-30 / 09-28 / 09-25 三条，与实际 3 篇文章及倒序一致 |
| **AC-7** 分类仅 4 个合法栏目 + 非法分类构建期报错 | ⚠️ **前半通过 / 后半无法验证** | 线上 `/categories/`："共 **4** 个栏目、3 篇文章：技术 1 / 生活 1 / 读书 1 / 作品 0"，4 个分类页均 200，无非法栏目。构建期报错的**结构证据**充分：`src/content.config.ts` 用 `z.array(z.enum(CATEGORIES)).min(1)`，`src/consts.ts` 定义 `CATEGORIES = ['技术','生活','读书','作品']`；但**本任务禁止本地构建，未实测"故意写非法分类后 build 是否失败"** |
| **AC-8** RSS 可被阅读器识别并显示全文摘要 | ✅ **通过（结构与内容层面）** | `/rss.xml` 200，.NET XmlDocument **真解析通过**（良构）；`item` 数 = **3**；`channel.description` 与 `src/consts.ts` 的 `SITE.description` **逐字符相等 = True**（含弯引号 ’）；`pubDate` 为合法 RFC-822（Wed, 30 Sep 2026 06:00:00 GMT）；`guid isPermaLink="true"`。**未用真实阅读器（Feedly 等）实际订阅**，见 §7 |
| **AC-9** 新增文章只需 3 步，CI 自动发布成功 | ⚠️ **结构通过 / 运行日志无法取证** | `.github/workflows/deploy.yml`：`on.push.branches=[main]` → `withastro/action@v6`（node 24，`npm run build`）→ `actions/deploy-pages@v5`，权限 `pages:write`/`id-token:write`，`concurrency.group=pages`。站点线上可访问且内容为最新三轮推送，间接证明管线可用；**GitHub API 返回 403（未认证限流），无法读取 Actions 运行记录与耗时** |
| **AC-10** 404 页可返回首页且带搜索入口 | ✅ **通过** | 任意不存在路径（`/this-page-does-not-exist-xyz/`）返回 **HTTP 404** + 自定义页：`<h1>这个页面走丢了`、`返回首页` 链接、搜索表单 `action="/search/" method="get" name="q"`、最新文章 **4** 条入口、`<meta name="robots" content="noindex, nofollow">` |
| **AC-11** 键盘完成"搜索 → 打开文章 → 展开目录" | ✅ **通过（分段验证）** | Tab 序列（真实 `Input.dispatchKeyEvent`）：第 1 个焦点即 `a.skip-link`（"跳到正文"）→ brand → 5 个导航 → **搜索图标 `a.icon-btn`** → 主题按钮 → 文章卡片；每个焦点元素 `outline: solid 2px rgb(59,76,224)`（焦点可见）；skip-link 聚焦后可见（未聚焦时被裁切）；搜索页 `↑/↓` 在 19 条结果间移动焦点（下：第 1 条 → 第 2 条；上：回到第 1 条）；文章页 `details>summary` 回车展开 TOC（`open: false → true`）。**未做一条脚本端到端串起全流程**，见 §7 |
| **AC-12** 站内所有外链带 `rel="noopener"` | ✅ **通过** | 抓取 24 个页面、汇总 4 个外链目标：`github.com/ppywww`（24 处，`noopener noreferrer`）、`github.com/ppywww/ppywww.github.io`（1 处，`noopener`）、`example.com`（2 处，`noopener`）、`creativecommons.org/...`（3 处，`noopener noreferrer`）——**`target="_blank"` 却缺 `noopener` 的链接数 = 0** |

---

## 2. Lighthouse 明细（移动端，`npx -y lighthouse`）

| 页面 | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS | SI |
|---|---|---|---|---|---|---|---|---|---|
| `/` 首页 | **100** | **95** | **100** | **100** | 1253ms | 1253ms | 0ms | 0 | 1697ms |
| `/posts/2026-09-30-build-this-blog/` | **100** | **91** ❌ | **100** | **100** | 1360ms | 1360ms | 0ms | 0 | 1908ms |
| `/search/` | **100** | 96 | **100** | **63** ⚠️ | 1139ms | 1139ms | 10ms | 0 | 1175ms |

**扣分项（逐条，均为实测 audit id）**

| 页面 | audit | 详情 |
|---|---|---|
| 文章页 | `color-contrast`（score 0, weight 7） | Shiki 浅色主题的代码 token 前景色与 `#F7F8FA` 底色对比度不足：`#D73A49` → **4.30**、`#22863A` → **4.35**，阈值 4.5（字号 14px、常规字重）。配色来自 `--shiki-light` 变量 |
| 全部三页 | `target-size`（score 0, weight 7） | 触控目标尺寸/间距不足，命中元素：`body > header.site-header > div.container > a.brand`（页眉站点名链接） |
| 搜索页 | `is-crawlable`（score 0, weight 4.04） | `<meta name="robots" content="noindex, nofollow">` —— **有意设计**，非缺陷；但它把 SEO 分从 ~100 拉到 63 |
| 首页 | `max-potential-fid` 0.79 / `cache-insight` 0.5 / `render-blocking-insight` 0.5 / `network-dependency-tree-insight` 0 | 权重低，未影响 100 分；缓存策略受 GitHub Pages 固定头限制，站点侧不可控 |

**「站点问题」与「网络问题」的切分依据**

- 站点问题（可控）：无障碍扣分（对比度、触控目标）、搜索页 noindex 带来的 SEO 分。
- 网络问题（不可控）：跨境访问 GitHub Pages 的 RTT。判据——首页 HTML 仅 **3.6KB**、**0 个 JS 请求**、CSS 2.5KB，站点侧渲染仅 ~0.55s；Lighthouse 模拟节流下 LCP 1.25s，而真实冷启动 TTFB 2.09s（DNS+TLS+跨境），差额几乎全在网络。**优化建议不应针对站点代码，而应考虑 CDN/镜像（PRD §15 已列该风险）。**

---

## 3. 性能预算实测（PRD §10 门禁）

| 门禁 | 门槛 | 实测 | 结论 |
|---|---|---|---|
| 首屏 JS（gzip） | < 30KB | 首页：**0 个 JS 请求 / 0 字节**；搜索页：`search.astro...js` encoded **2,074B**（≈2.0KB） | ✅ 远优于门槛 |
| 首屏 CSS（gzip） | < 25KB | 全站单一外部样式表 `Footer.c3_ocj9b.css` encoded **2,499B**（≈2.4KB）；无内联 `<style>` 块 | ✅ |
| Web Font 请求数 | 0 | 首页资源列表 **0 个字体请求** | ✅ |
| LCP / CLS | <1.5s / <0.1 | 1253ms / **0**（三页 CLS 均为 0） | ✅ |
| 构建时间 | < 60s | **未测**（本任务禁止执行构建） | ⚠️ 无法验证 |
| 全站 HTML 页面数 | — | 抓取到 **24** 个页面（含 `/search/`）；`/rss.xml`、`/sitemap.xml`、`/pagefind/pagefind.js` 均 200 | — |

---

## 4. 搜索功能独立复核（对实现方自述的**逐条打假/验证**）

| 自述 | 我的独立验证 | 判定 |
|---|---|---|
| 200ms 防抖 | 输入"读书笔记"后 **108ms、186ms 两次采样结果数仍为 0**（防抖窗口内不渲染）；首次出现结果在 **1057ms**（含 Pagefind 索引首次加载 + WASM 初始化） | ✅ 防抖成立；但"首次查询 1s"这一体验数据实现方未提及 |
| Esc 清空 | `Escape` 后 `input.value === ""`、结果 0 条、空态"输入关键词开始搜索"重新显示 | ✅ |
| ↑/↓ 移动焦点 | 查询"的"（**19** 条）下：`↓` → 焦点落到第 1 条链接 `/posts/2026-09-25-...`；再 `↓` → 第 2 条 `/categories/读书/`；`↑` → 回到第 1 条 | ✅ |
| `role=status` 计数 | `#search-status` 为 `role="status" aria-live="polite"`，文案随查询更新："找到 11 条结果" / "找到 0 条结果" | ✅ |
| 搜索页排除出索引 | 搜索容器带 `data-pagefind-ignore`；实测查询搜索页独有文案（如"输入关键词开始搜索"）**检索不到搜索页自身** | ✅ 正文未入索引（注：Pagefind entry 的 `page_count = 24` 统计的是 24 个 HTML 文件，其中搜索页与 404 页仅"挂号"不贡献可检索正文） |
| （新增）404 页是否被索引 | 用 404 页独有文案查询："链接可能已失效" → **0 条**；"回到首页，或者直接搜索" → **0 条**（查询"这个页面走丢了"返回的 1 条是真实文章，非 404 页） | ✅ `--exclude-selectors ".notfound"` 生效，404 正文未被索引 |
| （新增）中文召回噪声 | 单字查询"的" → **19 条**；查询"走丢" → 2 条（匹配到真实文章里的"走"）。Pagefind 对 CJK 不做词干/停用词（官方文档明载），中文单字即可命中 | ⚠️ 体验问题，非功能缺陷（见 §6-一般） |
| （新增）Enter 提交 | 在输入框按 Enter 未发生页面跳转（URL 保持 `/search/`，无 `?q=`），结果被 JS 就地渲染 | ✅ 行为一致；**无 JS 时的表单回退（GET `/search/?q=…`）未验证** |

---

## 5. RSS / sitemap / Pagefind 索引独立复核

| 项 | 自述 | 我的实测 | 判定 |
|---|---|---|---|
| RSS XML | 可订阅 | `.NET XmlDocument.LoadXml` **解析通过**（根节点 `<rss>`） | ✅ |
| RSS item 数 | 3 | **3**（09-30 / 09-28 / 09-25，含 title/link/guid/pubDate/category） | ✅ |
| RSS description 一致性 | 逐字符等于 consts.ts | `-ceq` 大小写敏感比较 = **True**（"Hi, this is ppy. I’m documenting my learning notes in this blog since 2026."，含弯引号 ’） | ✅ |
| sitemap URL 数 | 22 | **22** | ✅ |
| sitemap 中文编码 | 已百分号编码 | 含非 ASCII 字符的 `loc` = **0**；含百分号编码 = **11**（4 个分类 + 7 个中文标签） | ✅ |
| sitemap 可达性 | — | 逐条 GET：**非 200 数 = 0**（22/22）；站外 loc = 0 | ✅ |
| Pagefind 语言 | language=zh-cn | `pagefind-entry.json`：`languages["zh-cn"].page_count = 24`，`version 1.5.2` | ✅ 与自述一致 |
| `/robots.txt` | 未提及 | **404**（无 robots.txt） | ⚠️ 一般级建议（见 §6） |

---

## 6. 问题清单（按严重度排序 + 指派建议）

### 🔴 阻断（0 项）
无。站点的 P0 功能链路完整可用。

### 🟠 严重

| # | 问题 | 证据 | 建议指派 |
|---|---|---|---|
| **S-1** | **文章页无障碍 91 分，击穿 PRD AC-2 的 ≥95 硬门禁**：Shiki 浅色代码块 token 配色对比度 4.30/4.35 < 4.5 | `lh-post.json` `color-contrast` 命中 `#D73A49`/`#22863A` on `#F7F8FA` | **pages-post**（换高对比 Shiki 主题或覆盖 token 色）+ **design-system**（在 tokens 层裁定代码高亮色板，避免逐页打补丁） |
| **S-2** | **页眉站点名链接 `a.brand` 触控目标过小**，首页/文章页/搜索页**全部**触发 Lighthouse `target-size` 失败（首页 A11y 因此卡在 95，无余量） | 三份 LH JSON 的 `target-size.details.items` 均指向 `header ... a.brand` | **site-builder**（`Header.astro` 的 brand 链接加大点击区/padding，保持视觉不变） |
| **S-3** | **关于页与作品页仍为占位内容**：`/about/` 正文自述"本页是骨架，待替换"并含方括号占位；`/works/` 第 2 条为"示例作品（占位）"且外链指向 `example.com` | `/about/`、`/works/` 抓取正文 | **content-author**（M5 出口标准要求上线前替换；建议列为上线前必办） |

### 🟡 一般

| # | 问题 | 证据 | 建议指派 |
|---|---|---|---|
| G-1 | 搜索页 SEO 63 分（`noindex, nofollow`）——若为有意设计，需在验收口径中显式排除搜索页；否则 AC-2 需按"逐页达标"重判 | `lh-search.json` `is-crawlable` | **lead 裁定口径**（无需改代码） |
| G-2 | `/robots.txt` 404。建议补一个含 `Sitemap: https://ppywww.github.io/sitemap.xml` 的最小 robots.txt | 链接体检 `404 /robots.txt` | **search-rss** |
| G-3 | 全站 24 页**均无 `og:image`**，社交分享无大图 | 页面探测 `ogImage=NONE` ×24 | **pages-post** 或 **site-builder**（可先用品牌默认图，PRD F-24 属 P2） |
| G-4 | 中文检索召回噪声：单字"的"命中 19 条；Pagefind 对 CJK 无停用词/词干（官方明确） | `search-check.json` `singleCharQuery` | **search-rss**（可选：忽略单字查询或设最短查询长度） |
| G-5 | 搜索**首次**查询耗时 1057ms（索引首次加载）；二次查询未单独计时 | `search-check.json` `query1.firstResultAtMs` | **search-rss**（可选：进入页面即预取索引） |

### 🔵 建议

| # | 建议 | 证据 |
|---|---|---|
| N-1 | 文章页 JSON-LD 可补 `BreadcrumbList`；关于页可补 `Person`（当前只有 `WebSite` + 文章页 `BlogPosting`） | 页面探测 `jsonLdTypes` |
| N-2 | 作品卡片无缩略图（全站 `<img>` 数为 0，`/works/` 无封面），与 PRD §7.6"缩略图"描述有落差（`cover` 字段已在 schema 中预留） | `imgCount=0` |
| N-3 | 搜索页的 `<script type="module" src=...>` 出现在 `</html>` 之后（浏览器容错执行，HTML 不合规） | 原始 HTML 尾部 |
| N-4 | 2026-09-30 文章描述称"@font-face 与 url() 均为 0 处"——与本次实测一致（字体请求 0），无需改；此处仅备注已复核 | `/posts/2026-09-30-build-this-blog/` |

---

## 7. 未能验证 / 证据面受限（不确定项，如实列出）

| # | 未验证项 | 卡在哪 |
|---|---|---|
| U-1 | **构建时间 <60s**（PRD §10） | 任务明令禁止执行 `npm run build`（构建权在 pages-post），无法本地实测 |
| U-2 | **非法分类是否真的让构建失败**（AC-7 后半） | 同上；仅有 `content.config.ts` 的 Zod 枚举结构证据 |
| U-3 | **CI 运行记录/耗时**（AC-9） | GitHub API 对未认证请求返回 403 限流，无法读取 Actions 运行数据 |
| U-4 | **真实阅读器订阅**（AC-8 后半） | 未使用 Feedly/Inoreader 等实际订阅；只验证了 XML 良构、item 数、字段与 description 一致性 |
| U-5 | **无 JS 回退** | 搜索表单 GET 回退（`/search/?q=…`）未在禁用 JS 下验证 |
| U-6 | **AC-11 端到端连续流程** | 搜索/文章/TOC 分别验证通过，但未用一条脚本串起"搜索→打开文章→展开目录" |
| U-7 | **320px 全站覆盖** | 抽测 7 个代表性页面（首页/文章/归档/标签/作品/分类/关于），未逐页跑完 24 页 |
| U-8 | **移动端真实 4G 设备** | 仅在桌面 Chrome + Lighthouse 模拟节流下测；未在真机蜂窝网络验证 |
| U-9 | **搜索热索引二次查询延迟** | 只测到首次查询（含索引加载）1057ms；实现方声称的 200ms 防抖已验证窗口内不渲染，但未测第二次查询耗时 |
| U-10 | **GitHub Pages 在国内的可用性** | 无可靠测量手段；本次为跨境网络单点观测 |

---

## 8. 证据文件与复现命令

**证据目录**：`scripts/qa/evidence/`

| 文件 | 内容 |
|---|---|
| `lh-home.json` / `lh-post.json` / `lh-search.json` | Lighthouse 原始 JSON（含全部分数与扣分项） |
| `site-check.json` | 24 页全站抓取：状态码、标题、canonical/OG/JSON-LD、资源体积、LCP/CLS、Tab 序列、主题与 TOC 交互 |
| `link-check.json` | 37 条站内路径状态码 + 任意 404 路径的落地页信息与搜索表单 |
| `search-check.json` | 搜索全流程（防抖、Esc、方向键、空态、单字查询、404 索引排除） |
| `first-paint.json` | AC-3 结构与首帧采样（三种主题情形） |
| `w320-*.png` / `w1440-*.png` | 320px 与 1440px 亮/暗截图 |
| `firstframe-dark-00.png` / `-01.png` | 暗色模式录屏首帧（主色 #0F1115、近白占比 0） |
| `search-results.png` / `search-empty.png` | 搜索命中与空态截图 |

**复现命令（全部零依赖、不安装项目依赖、不触碰源码）**

```powershell
# 1) Lighthouse 四项（移动端，首页/文章页/搜索页）
pwsh -NoProfile -File scripts/qa/run-lighthouse.ps1

# 2) 全站抓取 + 320px + 键盘 + 资源体积
node scripts/qa/check-site.mjs

# 3) 站内链接体检 + 404 落地页
node scripts/qa/check-links.mjs

# 4) AC-3 深色模式首帧取证
node scripts/qa/check-first-paint.mjs
node scripts/qa/check-theme-firstframe.mjs

# 5) 搜索功能全流程
node scripts/qa/check-search.mjs
node scripts/qa/check-index-exclusion.mjs

# 6) RSS / sitemap / 索引
pwsh -NoProfile -File scripts/qa/check-feed.ps1
```

> 脚本仅使用 Node 内置模块与 CDP（`scripts/qa/lib/cdp.mjs` 为自研零依赖客户端），通过 `--remote-debugging-port` 驱动本机 Chrome 无头模式；`npx -y lighthouse` 只写入 npm 缓存，不改动项目依赖树。

---

*本报告由独立验收方 tech-scout 出具，全部数据来自 2026-09-30 对线上站点的真机实测；凡未能取证之处均显式标注"无法验证"，未作推测性结论。*

---

# 9. 第二轮复验（v1.0 tag 前门禁）

| 项 | 内容 |
|---|---|
| 复验时间 | 2026-09-30 **18:07–18:25**（对**线上地址**复跑，非本地 dist/127.0.0.1） |
| 复验对象 | https://ppywww.github.io（提交 **44117c0**：代码块对比度 + 触控目标 + 非法分类实测 + 占位外链清理 + robots.txt + 默认 og:image） |
| 复验方 | tech-scout（仍为独立验收方；**未改源码、未跑 `npm run build`**） |
| 结论 | **AC-2 已修复（三页 A11y 全 100）；AC-7 后半接受改判为通过；新增 2 项达标；AC-3/4/5/6/8/10/11/12 全部无回归。技术上达到 v1.0 打 tag 门禁，仅剩 1 项内容侧待决（见 §9.5 L-1）。** |

## 9.1 AC-2 复验：Lighthouse（线上，移动端，`npx -y lighthouse`）

| 页面 | 第一轮 A11y | **第二轮 A11y** | Performance | Best Practices | SEO | LCP（模拟 4G） |
|---|---|---|---|---|---|---|
| `/` 首页 | 95 | **100** ✅ | 100 | 100 | 100 | 1239ms |
| `/posts/2026-09-30-build-this-blog/` | **91** ❌ | **100** ✅ | 100 | 100 | 100 | **1498ms** |
| `/search/` | 96 | **100** ✅ | 100 | 100 | 66 ⚠️ | 1142ms |

**扣分项消失的逐条验证（audit id 前后对比）**

| audit | 第一轮 | 第二轮 | 说明 |
|---|---|---|---|
| `color-contrast`（文章页） | **0** | **1** ✅ | 代码块 token 配色已修；不再有 4.30/4.35 的对比度违规 |
| `target-size`（三页） | **0** | **1** ✅ | `a.brand` 触控目标已修，三个页面全部通过 |
| `is-crawlable`（搜索页） | 0（1 项） | 0（**2 项**） | 新增的第 2 项来自 `robots.txt` 的 `Disallow: /search/`——**与 meta noindex 同为有意设计**，故 SEO 63→66 属预期，不视为缺陷。**计分口径仍需你裁定**：若 AC-2 按"逐页四项 ≥95"字面执行，搜索页 SEO 永远不达标；建议口径为"内容页（文章/列表/归档/标签/分类/作品/关于）四项 ≥95，工具页（搜索/404）仅计 P/A/BP"。 |

**「站点问题」与「网络延迟问题」的切分（本轮仍然成立）**：三页 Performance 均 100，LCP 1.14–1.50s 全部落在模拟 4G 的 1.5s 门禁内；剩余扣分项只有 `cache-insight`/`render-blocking-insight`/`network-dependency-tree-insight`（GitHub Pages 固定响应头，站点侧不可控）与 LCP 的绝对耗时（跨境 RTT）。真实网络冷启动 TTFB 仍是 2s 量级，属网络而非站点。

> ⚠️ **余量提示**：文章页模拟移动端 LCP **1498ms**，距 AC-1 的 1500ms 只有 **2ms** 余量（AC-1 原文只约束首页，首页 1239ms 安全）。若后续给文章页加任何首屏资源，很可能立刻越线，建议 tag 后保持文章页首屏零 JS、不新增阻塞式 CSS。

## 9.2 AC-7 后半：非法分类构建期报错

**判定：改判为通过（附证据边界说明）。** 我做了**独立**的 schema 级复核，不是采信自述：

- 用**项目自带的** `astro/zod`（解析自 `node_modules/astro`）+ 项目自己的 `src/consts.ts` 中的 `CATEGORIES`，复现 `content.config.ts` 里那条 `z.array(z.enum(CATEGORIES)).min(1)` 约束：
  - `['科技']` → **fail**，错误文本 `0: Invalid option: expected one of "技术"|"生活"|"读书"|"作品"`
  - `[]` → fail（min 1）；`['Tech']` → fail；`['技术']`/`['技术','生活']` → pass（5/5 用例符合预期）
- 该错误文本与 pages-post 在 `astro build` 中实测到的报错**逐字一致**，构成交叉印证。
- 现有 3 篇文章分类 `读书/生活/技术` → **3/3 合规**。
- **边界**：我没有运行完整 `astro build`（本任务禁止），因此这是"schema 逻辑 + 内容合规"的独立复核与构建方实测的互证，而非我本人的端到端构建取证。

## 9.3 新增项复验

| 项 | 自述 | 我的实测 | 判定 |
|---|---|---|---|
| og:image 全站 | 已加默认图 | 抓取 24 个页面：**23/23 个 HTML 页面均含** `og:image`（唯一例外是 `/rss.xml`，非 HTML）；另抽 14 个路径独立校验 **14/14** 命中，取值统一为 `https://ppywww.github.io/og-default.png` | ✅ |
| og 图规格 | 1200×630 | 下载后 PNG 头解析：HTTP **200**、`image/png`、**56,952 字节**、**1200 × 630** | ✅ 与自述完全一致 |
| `/robots.txt` | 已补 | **200**，内容含 `User-agent: *` / `Allow: /` / `Disallow: /search/` / `Sitemap: https://ppywww.github.io/sitemap.xml` | ✅ |

## 9.4 回归矩阵（第二轮 vs 第一轮）

| AC | 第一轮 | 第二轮 | 证据 |
|---|---|---|---|
| AC-3 无闪烁 | ✅ | ✅ **无回归** | 主题脚本仍在原始 HTML 第 **273** 字节，早于首个 CSS（**3144**）与 `<body>`（**3209**）；三种情形（系统暗/系统亮/亮+localStorage=dark）的 **firstRaf 首帧回调**中 htmlClass 与 body 背景已是目标主题（#0F1115 / #FCFCFD），样式表数 1 |
| AC-4 320px | ✅ | ✅ **无回归** | 7 个代表性页面 `scrollWidth = clientWidth = 320`，溢出 0；截图 `w320-*.png` 已更新 |
| AC-5 搜索 | ✅ | ✅ **无回归且质量提升** | "读书笔记" → 2 条（首条仍为目标文章）；Esc 清空 ✓；`↑/↓` 焦点逐条移动（第 1 条 → 第 2 条 `/posts/2026-09-28-why-i-blog/` → ↑ 回第 1 条）✓；`role=status` 计数 ✓；空态 ✓；**单字"的"命中数 19 → 3**（结果质量修复生效） |
| AC-6 归档 | ✅ | ✅ **无回归** | 仍为"共 3 篇文章 / 2026 年 3 篇 / 9 月 3 篇"，条目 09-30、09-28、09-25 |
| AC-8 RSS/sitemap | ✅ | ✅ **无回归** | RSS XML 良构、**item 3**、`channel.description` 与 consts.ts **逐字符相等 True**；sitemap **22** 条、非 ASCII `loc` = 0、**22/22 全 200** |
| AC-10 404 | ✅ | ✅ **无回归** | 任意路径仍返回 HTTP 404 + 自定义页（`返回首页` + `站内搜索` 表单 + 最新 4 篇 + `noindex`） |
| AC-11 键盘 | ✅ | ✅ **无回归** | Tab 序列不变：`skip-link` → `brand` → 5 导航 → 搜索图标 → 主题按钮 → 文章卡；文章页 TOC 回车 `open: false → true` |
| AC-12 外链 rel | ✅ | ✅ **无回归且占位外链已清理** | 外链目标从 4 个降为 **3 个**（`example.com` 已消失）；`target="_blank"` 缺 `noopener` = **0** |
| 性能预算 | ✅ | ✅ | 首页 JS **0B** / CSS 2,521B；文章页 JS **0B** / CSS 4,623B（含代码块样式）；搜索页 JS 2,140B；**字体请求 0**；全站 CLS **0**；真实网络 LCP 176–1000ms |
| F-08 Giscus 默认关闭 | — | ✅（新增观察） | 3 篇文章 `comments: false`，线上文章页 `giscus` 字符串出现 **0 次**——"默认关闭"成立；**"逐篇可开"的端到端路径未验证**（无一篇开启，且 `GISCUS.enabled` 还依赖仓库配置） |

## 9.5 本轮遗留问题（均非阻断）

| # | 问题 | 变化 | 建议 |
|---|---|---|---|
| **L-1** | `/about/` 仍是"**本页是骨架，待替换**"+ 25 处方括号占位（含"邮箱：[待填写]"）；`/works/` 第 2 条仍标注"**示例作品（占位）**" | 由第一轮 S-3 **降级为一般**：占位**外链**已清理（`example.com` 消失），但占位**文案**未替换 | **老板/内容方在 tag 前决策**：要么替换真实内容，要么明确接受"占位页上线"。这是本轮唯一的内容侧待决项 |
| L-2 | 文章页模拟移动端 LCP **1498ms**（阈值 1500ms） | 新增观察 | 保持文章页首屏零 JS；后续任何首屏资源新增都需复测 |
| L-3 | 搜索页 SEO 66 | 63 → 66（`Disallow` 生效） | 需你裁定 AC-2 计分口径（见 §9.1） |
| L-4 | 单字查询仍有噪声（"的"→3 条） | 19 → 3，显著改善 | 可接受，无需再改 |

## 9.6 仍未验证项（更新）

| # | 项 | 状态 |
|---|---|---|
| U-1 | 构建耗时 < 60s | **仍未验证**（禁止执行构建） |
| U-2 | 非法分类构建期 exit 1 的**完整 build** | 由"schema 级独立复核 + 构建方实测"互证，我本人未跑 build |
| U-3 | GitHub Actions 运行日志/耗时 | **仍无法验证**（GitHub API 未认证 403 限流） |
| U-4 | Feedly 类真实阅读器订阅 | 未验证（RSS 结构与内容已复核） |
| U-5 | 无 JS 回退（`/search/?q=`） | 未验证 |
| U-6 | AC-11 单脚本端到端连续流程 | 未验证（分段全通过） |
| U-7 | 320px 全 24 页覆盖 | 抽测 7 个代表性页面 |
| U-8 | 移动真机蜂窝网络 | 未验证（Lighthouse 模拟节流） |
| U-9 | Giscus 逐篇可开的渲染与换肤 | 未验证（默认关闭路径已验证） |

## 9.7 复验结论

**建议：可以打 v1.0 tag。** 依据：上一轮唯一的功能性门禁不通过项（AC-2 文章页 A11y 91）已在**线上**复测为 **100**，三个页面 A11y 全部 100；AC-7 后半经独立 schema 复核接受改判；新增 `og:image` 与 `robots.txt` 均达标；AC-3/4/5/6/8/10/11/12 与全部性能预算**无任何回归**。
唯一待决事项是**内容侧**的 L-1（关于页/作品页占位文案）与**口径侧**的 L-3（搜索页 noindex 是否计入 AC-2）——两者都不需要改代码即可由你拍板。

**复现命令（第二轮新增）**

```powershell
node scripts/qa/check-schema-enum.mjs      # AC-7 后半：schema 级独立复核
node scripts/qa/check-og-image.mjs         # og:image 覆盖 + og-default.png 规格 + robots.txt
pwsh -NoProfile -File scripts/qa/run-lighthouse.ps1   # 线上三页 Lighthouse 四项
```

*第二轮复验由同一位独立验收方（tech-scout）在 2026-09-30 18:07–18:25 完成，全部数值取自线上地址的本次实测。*

