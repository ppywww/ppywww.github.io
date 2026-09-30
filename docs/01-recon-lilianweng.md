# 参考站深度分析 · lilianweng.github.io（Lil'Log）

**分析日期**：2026-09-30
**分析对象**：https://lilianweng.github.io/
**分析人**：Product Manager（Lead）
**用途**：本项目「从 0 搭建个人博客」的设计基准 / 竞品参考
**取证方式**：抓取首页、文章页、归档页、标签页、搜索页 HTML + 主样式表，读取构建指纹与外露配置

---

## 0. 一句话结论

Lil'Log 是「**极简外壳 + 硬核内容**」的教科书级实现：外壳只有黑白灰加一个酒红点缀，全部使用系统字体、**零 Web Font 请求**；正文宽度锁定 720px，长文阅读舒适；深色模式无闪烁；静态站却具备客户端全文搜索。它的成功**不来自视觉炫技，而来自对"读长文"这件事的极致工程化**。

**对我们的启示**：抄它的**结构与约束**，不要抄它的**样式皮**——我们要有自己的视觉识别度。

---

## 1. 技术栈取证（有据可查）

| 维度 | 事实 | 证据 |
|---|---|---|
| 生成器 | Hugo 0.163.3 | `<meta name="generator" content="Hugo 0.163.3">` |
| 主题 | PaperMod | 页脚 "Powered by Hugo & PaperMod" |
| 托管 | GitHub Pages（用户站点仓库） | 域名为 lilianweng.github.io |
| 样式 | 单文件 min CSS，带 SRI + preload | `stylesheet.min.<hash>.css` + `integrity="sha256-..."` |
| 脚本 | 自托管 + SRI，按需加载 | `highlight.min.<hash>.js` |
| 数学公式 | MathJax 3（唯一外部 CDN 依赖） | `cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js` |
| 统计 | Google Analytics 4 | `googletagmanager.com/gtag/js?id=G-HFT45VFBX6` |
| 订阅 | RSS + JSON Feed | `index.xml`、`index.json` |
| 搜索 | 纯客户端全文搜索 | `/search/` 页 `#searchInput` + `#searchResults` |
| 主题色 | `#2e2e33` | `theme-color` / `msapplication-TileColor` |
| 维护状态 | **活跃** | 归档最新文章 2026-07-04「Harness Engineering for Self-Improvement」 |

**关键取舍**：除 MathJax 外**零第三方 CDN 依赖**，CSS/JS 全部自托管并加 SRI 指纹——安全、缓存友好、无第三方可用性风险。

---

## 2. 设计语言与 Design Tokens（可直接复用）

### 2.1 布局骨架

`@
--main-width:    720px   正文阅读区（黄金阅读宽度）
--nav-width:    1024px   顶部导航/页脚最大宽度
--gap:           24px    全局间距（移动端降为 14px）
--content-gap:   20px
--radius:         8px    圆角
--header-height: 60px
--footer-height: 60px
`@

**推理**：导航比正文宽 304px，形成"宽顶窄身"的稳定视觉，正文不会被撑到不可读。

### 2.2 亮色主题

| Token | 值 | 用途 |
|---|---|---|
| --theme | rgb(255,255,255) | 页面底色 |
| --entry | rgb(255,255,255) | 卡片底色 |
| --primary | rgb(30,30,30) | 主文字/标题 |
| --secondary | rgb(108,108,108) | 元信息、日期、简介 |
| --tertiary | rgb(214,214,214) | 分隔、禁用 |
| --content | rgb(31,31,31) | 正文 |
| --code-bg | rgb(245,245,245) | 行内代码底 |
| --hljs-bg | rgb(28,29,33) | 代码块底（**亮色模式下也是深色**） |
| --border | rgb(238,238,238) | 边框 |

### 2.3 暗色主题

| Token | 值 |
|---|---|
| --theme | rgb(29,30,32) |
| --entry | rgb(46,46,51) |
| --primary | rgb(218,218,219) |
| --secondary | rgb(155,156,157) |
| --tertiary | rgb(65,66,68) |
| --content | rgb(196,196,197) |
| --code-bg | rgb(55,56,62) |
| --hljs-bg | rgb(46,46,51) |
| --border | rgb(51,51,51) |

**注意**：暗色不是简单反色，而是**整体降饱和 + 降低对比**（正文 rgb(196,196,197) 而非纯白），这是长时间阅读不刺眼的关键。

### 2.4 字体

`@
-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
Cantarell, "Open Sans", "Helvetica Neue", sans-serif
font-size: 16px;  line-height: 1.6;
`@

**零 Web Font 请求**：首屏无 FOUT/FOIT。代价是跨平台观感不完全一致——一次明确的"性能优先"取舍。

---

## 3. 信息架构与页面结构

### 3.1 站点地图（仅 6 个入口）

`@
/                首页 = 文章列表（Posts）
/archives/       全量归档，按 年 → 月 分组，带计数
/search/         客户端全文搜索
/tags/           标签云 + 每标签文章数
/faq/            常见问题（自述/联系方式）
/posts/<slug>/   文章详情
`@

**极简主义**：没有分类（Category）、没有独立"关于我"页（由首页 welcome 卡片 + FAQ 承担）、没有项目作品页。

### 3.2 首页结构

1. **第 1 张卡片是"人"而不是"文"**：`article.first-entry.home-info`，标题「👋 Welcome to Lil'Log」，一段自我介绍 + 社交图标行（Twitter / Google Scholar / RSS / GitHub）
2. 其后是**文章卡片流**，每页 11 篇
3. 底部简单分页 `»`

**卡片内容**：标题 + 摘要（description）+ 日期 + 预计阅读时长 + 标签

### 3.3 文章页结构（核心页面）

`@html
<article class="post-single">
  <header class="post-header">
    <h1 class="post-title">LLM Powered Autonomous Agents</h1>
    <div class="post-meta">Date: June 23, 2023 | Estimated Reading Time: 31 min | Author: Lilian Weng</div>
  </header>
  <div class="toc">
    <details><summary accesskey="c">Table of Contents</summary>
      <div class="inner"><ul>…自动生成的 h2/h3 树…</ul></div>
    </details>
  </div>
  <div class="post-content">…正文…</div>
</article>
`@

**三个值得抄的决策**：
- **元信息一行打平**：日期 | 阅读时长 | 作者，用 `|` 分隔，无图标无装饰
- **TOC 默认折叠**：`<details>` 天然可访问、零 JS，展开是完整两级树
- **正文宽度 720px 且与导航解耦**

### 3.4 归档页

按 `年 → 月` 两级分组，标题右侧带 `sup` 上标计数（如 `2026 ²`），条目为「标题 + 日期 | 阅读时长 | 作者」，整行可点（覆盖整块的 `.entry-link`）。**无缩略图、无动画**——扫读效率极高。

### 3.5 标签页

`ul.terms-tags` 纯文字标签云，每标签跟上标计数，无权重字号变化。

### 3.6 搜索页

输入框 `#searchInput`（`autofocus`、`type="search"`、`aria-label`），下方 `#searchResults` 列表，客户端即时过滤。**静态站获得站内搜索的最低成本方案**。

---

## 4. 阅读体验细节（真正拉开差距的地方）

| 细节 | 实现 | 价值 |
|---|---|---|
| 主题无闪烁 | `<body>` 后紧跟内联脚本，先读 `localStorage["pref-theme"]`，再回落 `prefers-color-scheme`，首帧前给 body 加 `.dark` | 避免"白闪一下" |
| 无 JS 降级 | `<noscript>` 内联暗色媒体查询变量，并隐藏 `#theme-toggle`、`.top-link` | 关 JS 仍可用 |
| 快捷键体系 | Alt+H 首页 / Alt+T 切主题 / Alt+/ 搜索 / Alt+C 目录 / Alt+G 回顶 | 面向重度读者的"极客礼遇" |
| 平滑锚点 | 点击 `#` 锚点，且尊重 `prefers-reduced-motion` | 无障碍 |
| 回顶按钮 | `.top-link`，带 `aria-label` + `accesskey="g"` | — |
| 菜单滚动位置记忆 | `localStorage["menu-scroll-position"]` | 移动端横滚菜单体验 |
| 代码高亮 | 构建时产出 + 运行时 `hljs.initHighlightingOnLoad()` | 零配置 |
| 公式 | MathJax 3 延迟加载 | 只在需要时付费 |
| 阅读时长 | 构建时计算并写入 `post-meta` | 长文预期管理 |

---

## 5. SEO / 可发现性 / 无障碍

- **canonical** + `hreflang` 输出
- **Open Graph**：og:title / og:description / og:type / og:url
- **Twitter Card**：summary + title + description
- **JSON-LD 结构化数据**：`schema.org/Organization`，含 `sameAs` 社交账号数组（Twitter / Scholar / RSS / GitHub / Instagram）
- **自动发现**：`<link rel="alternate" type="application/rss+xml">` + `application/json`
- **图标全套**：favicon.ico（wine 配色）、16×16 / 32×32 PNG、apple-touch-icon、safari-pinned-tab.svg
- **无障碍**：`aria-label` / `aria-hidden`、SVG 图标用 `stroke="currentColor"` 跟随主题变色、语义化 `article/header/footer/nav/main`
- **robots**：`index, follow`

---

## 6. 内容策略（比技术更重要）

- 站点副标题一句话定位：**"Document my learning notes."**
- 体裁：**深度技术长文**，单篇阅读时长 20–40 分钟，成体系（Agent / 对齐 / 注意力机制 / 扩散模型……）
- 每篇结尾是 **References**，密集外链论文——建立"可追溯"的信任感
- 命名规范：`/posts/YYYY-MM-DD-slug/`，**日期前缀**保证 URL 排序稳定
- 节奏：2017 年至今持续输出，**低频高质**
- 个人身份强绑定：作者名、社交账号、Scholar 链接贯穿全站

---

## 7. 值得抄的 10 条（Reuse List）

1. 正文 720px + 导航 1024px 的双宽度约束
2. 系统字体栈，零 Web Font
3. CSS 变量驱动的双主题，暗色**降饱和不反色**
4. 代码块恒为深色底
5. 首帧内联脚本消除主题闪烁 + noscript 降级
6. `<details>` 实现零 JS 的可访问 TOC
7. 首页首卡放"人"，其后放"文"
8. 归档页 年/月 两级 + 计数上标 + 整行可点
9. 客户端搜索（构建时产 JSON 索引）
10. 构建产物 SRI + 缓存指纹，零第三方 CDN

---

## 8. 不该照抄的（Limitations / 我们的改进点）

| 问题 | 说明 | 我们的对策 |
|---|---|---|
| **无评论/互动** | 只有 RSS，读者无法反馈 | 按需接入 Giscus（GitHub Discussions，无后端） |
| **无 Newsletter** | 无法沉淀订阅关系 | 可选：RSS + 邮件订阅 |
| **单语言** | 仅 `en-us` | 若做双语，需 Day 1 设计 i18n 路由，后补代价大 |
| **视觉个性弱** | PaperMod 是"无风格风格"，千人一面 | 定制品牌色/Logo/首屏，建立识别度 |
| **无图片优化管线** | 直接 `<img>`，未见响应式/灯箱 | 引入 Image Processing / 响应式图片 |
| **无分类体系** | 只有 Tag，无 Category/系列 | 增加「系列 / 专栏」维度 |
| **GitHub Pages 国内访问不稳定** | GA4 国内亦加载失败 | 若读者在国内：Cloudflare Pages / Vercel + 国内可用统计 |
| **MathJax 走 jsDelivr** | 国内 CDN 不稳定 | 自托管 KaTeX |
| **无 CSP / 安全响应头** | 静态站也能加 | 配置 `_headers` 或 CSP |
| **深色模式不实时跟随系统** | 需手动点 | 可选增强 |

---

## 9. 对本项目的直接输入（进入 PRD 的约束）

**已可确定的默认基线（待老板确认）**
- 站点类型：静态站（SSG），无后端 / 无数据库
- 必需要素：首页列表 / 文章详情 / 归档 / 标签 / 搜索 / RSS / 深色模式 / SEO 元数据 / 响应式
- 性能预算：Lighthouse 四项（Performance / SEO / Best Practices / A11y）均 ≥ 95
- 内容规范：Markdown 写作，front-matter 驱动
- 双主题：亮/暗，跟随系统 + 手动覆盖，无闪烁

**待老板决策后写入 PRD**
- 定位与受众、语言策略、品牌（站名/配色/Logo）、部署目标区域、存量内容迁移、互动功能（评论/订阅/统计）

---

*本文件为只读参考基线，后续 PRD 与设计规范均引用本文件结论。*
