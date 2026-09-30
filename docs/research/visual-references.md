# 视觉参考与品牌方向调研

| 项 | 内容 |
|---|---|
| 文档版本 | v1.0 |
| 调研日期 | 2026-09-30 |
| 调研人 | design-scout（视觉调研员） |
| 共享任务 | task-2 |
| 上游文档 | [01-recon-lilianweng.md](../01-recon-lilianweng.md)、[02-prd.md](../02-prd.md) |
| 下游文档 | 04-design-system.md（Design Tokens 定稿）、D3 视觉方向拍板 |
| 用途 | 为「中文个人综合博客」选定 2–3 个可落地的视觉方向 |

---

## 0. 一句话结论

我实测了 **8 个个人博客**（4 个中文站 + 4 个国外站）的 HTML 与主样式表。结论是：**优秀个人博客的视觉差异，90% 不在“配色好不好看”，而在四个可量化的工程决策上——正文列宽、中文行高、强调色的可用性、深色模式的落地方式。**

其中一条最有价值的实测发现：**低饱和暖色强调（赭红 / 暖橙 / 陶土色）在浅色底上普遍过不了 WCAG AA 的 4.5:1**——lepture 的 `#BC6262` 只有 4.04:1、Robin Sloan 的 `#E35E35` 只有 3.38:1、Craig Mod 的链接色 `#007AFC` 只有 4.05:1、罗磊的品牌色 `#4FAAEF` 更是只有 **2.42:1**。这意味着“我们想要的那个有温度的强调色”，**不能直接拿来做小字号文字链接**。

基于此，我在 §5 给出的三个方向里，每个都配了**两级强调色**：`--accent`（装饰 / 大字 / 下划线，≥3:1）与 `--accent-text`（小字号文字链接，≥4.5:1）。

---

## 1. 取证方法与可信度声明

**方法**：用带浏览器 UA 的 HTTP 请求直接抓取站点 HTML 与 `<link rel="stylesheet">` 指向的 CSS 文件原文，再用正则提取 `:root` 变量块、`body`/`.post-content` 规则、`max-width`、`border-radius`、`box-shadow`、`@media (prefers-color-scheme: dark)` 等结构，逐条比对。

**声明**：

1. 本文所有**参考站数值**均为**实测抓取值**，不是印象描述。每条都在 §2 里标注了来源文件与原始片段。
2. 本文 §5 的 **Design Tokens 是提案**，不是实测值——它们是我基于实测结论**设计**出来的一套值，色彩对比度经过我本地脚本按 WCAG 2.1 相对亮度公式计算（结果见各方向表格的“对比度”列）。
3. 少数无法 100% 确证的点（例如某条规则所在的媒体查询上下文）我**显式标注“未完全确证”**，不编造。
4. 抓取时间：2026-09-30。

---

## 2. 八个参考站逐个分析

### 2.1 阮一峰的网络日志（中文 · 技术 + 随笔）

| 项 | 实测值 |
|---|---|
| URL | https://www.ruanyifeng.com/blog/ |
| 技术栈 | Movable Type 5.2.2（`<meta name="generator" content="Movable Type  5.2.2" />`），`<html lang="zh-CN">` |
| 主色 / 强调色 | **页面底色 `#f5f5d5`**（标志性米黄纸色）；正文字 `#111111`；点缀色系 `#223472`（深蓝紫）、`#D03500` / `#9A2C06`（砖红 / 赭石）、`#556677`、`#665544`、`#440066`；另有 `#dedede`、`#AAD2F0` 作底 |
| 正文字体栈 | `Georgia, serif`（正文衬线）；导航 `'Trebuchet MS', Arial, 'Lucida Grande', Verdana, Lucida, Helvetica, sans-serif`；代码 `Consolas, Monaco, 'Andale Mono', monospace` |
| 字号 / 行高 | `body { font-size: 62.5% }`（10px 基准，标题用 em 递进）；`line-height: 1.8em`；`letter-spacing: -0.01em; word-spacing: 0.2em` |
| 内容宽度 | 双栏模式 `body.two-columns #container { width: 85%; min-width: 780px; max-width: 1260px }`；单栏模式 `body.one-column #container { width: 65%; min-width: 640px; max-width: 960px }`。首页 `<body id="scrapbook" class="mt-main-index two-columns">` |
| 首屏构成 | 顶部 `#header` → `h1#header-name`「阮一峰的网络日志」+ **站内搜索框**（`<form action="https://www.baidu.com/s" name="origin">`，用百度做站内搜索）；下方直接进入文章索引流，条目 = 标题 + 摘要 + 「分类：周刊」 |
| 导航结构 | 没有现代意义的导航栏；用 `分类：周刊` 这样的**行内分类标签**做聚类 |
| 卡片形态 | **没有卡片**。条目之间靠留白与标题层级分隔，唯一的线是 1px 边框 |
| 圆角 / 阴影 | 全站 CSS 中**未发现 `border-radius` 与 `box-shadow`**——零圆角、零阴影 |
| 深色模式 | **无**。主样式表全文 `prefers-color-scheme: dark` 出现 **0 次**，也无任何 `.dark` / `[data-theme]` 选择器 |
| **值得偷的细节** | **中西文混排微调**：`letter-spacing: -0.01em; word-spacing: 0.2em` —— 收紧字母间距、放大词间距，让 Georgia 英文与中文方块字在同一行里呼吸一致。这是中文博客最容易忽略、也最显功底的一处。 |

**证据片段**（`theme_scrapbook.css`）：

```css
body { margin:0; padding:0; background-color: #f5f5d5 ; font-family: Georgia, serif;
       letter-spacing: -0.01em; word-spacing:0.2em; line-height: 1.8em;
       font-size:62.5%; color:#111111; width:98%; }
body.one-column #container{ width: 65%; min-width:640px; max-width:960px; }
body.two-columns #container{ width:85%; min-width: 780px; max-width: 1260px; }
```

---

### 2.2 木木木木木（中文 · 生活 + 技术，个人综合博客的典型样本）

| 项 | 实测值 |
|---|---|
| URL | https://immmmm.com/ |
| 技术栈 | Hugo 0.113.0；`<html lang="en">`（**中文内容却标了 en，是个反面教材**，我们要写 `zh-CN`） |
| 主色 / 强调色 | **无强调色**。亮：`--light-background:#fafafa`、`--light-background-secondary:#eaeaea`、`--light-header:#fff`、`--light-color:#222`、`--light-color-secondary:#999`、`--light-border-color:#dcdcdc`；暗：`--dark-background:#2f2f2f`、`--dark-background-secondary:#3b3d42`、`--dark-header:#252627`、`--dark-color:#f5f5f5`、`--dark-color-secondary:#73747b`、`--dark-border-color:#4a4b50`。全站 `a { color: inherit }`——链接不换色 |
| 正文字体栈 | `"LXGW Neo ZhiSong", -apple-system, BlinkMacSystemFont, Roboto, Segoe UI, Helvetica, Arial, sans-serif`（**霞鹜新致宋**，自托管中文宋体 Web Font） |
| 字号 / 行高 | `body { font-size: 1.1rem; font-weight: 400; line-height: 2.2 }`——**行高 2.2，是本次调研中最激进的中文行距** |
| 内容宽度 | `.post { width:100%; max-width: 1000px; padding: 20px 20px 40px; margin: 40px auto }`，`@media (max-width:899px){ .post { max-width: 860px } }`；列表预览 `.post-preview { max-width: 680px }` |
| 首屏构成 | **首屏即文章流**，无个人介绍卡片。`<h1>` 实测依次为「二〇二六，你好」「Lucky-canvas 抽奖插件折腾记」「沉迷“吉卜力”中……」「懒到现在才安上肥羊 allinone」——标题本身就是内容气质 |
| 导航结构 | 页面内未检出 `<nav>` 元素，导航以普通列表实现 |
| 卡片形态 | 弱卡片：条目之间用 `border-bottom: 1px solid var(--light-border-color)` 分隔；头像 48px、`border-radius:50%`、`box-shadow: 0 12px 40px rgba(0,0,0,.15)` |
| 圆角 / 阴影 | 圆角以 **8px** 为主（出现 10 次），辅以 5px / 4px；阴影克制：`0 4px 6px rgba(0,0,0,.04)`、`0 1px 2px rgba(0,0,0,.05)`，大面积使用 `box-shadow: none` |
| 深色模式 | `.dark` 类，主样式表中出现 **67 次**，全部由上面那套 `--light-*` / `--dark-*` 变量驱动；**不支持 `prefers-color-scheme`（0 处）**，即不跟随系统 |
| **值得偷的细节** | **用 `media="print"` 把中文 Web Font 变成非阻塞加载**：`<link rel="stylesheet" href="/LXGWNeoZhiSong/lxgwneozhisong.css" media="print" onload="this.media='all'">`。该字体样式表 **103,615 字节**，若同步加载必然阻塞首屏；这招让“中文衬线字体 + 快首屏”两者兼得。 |

**证据片段**（`theme-lmm.css`）：

```css
:root { --light-background: #fafafa; --light-color: #222; --light-border-color: #dcdcdc;
        --dark-background: #2f2f2f; --dark-color: #f5f5f5; --dark-border-color: #4a4b50; /* … */ }
body { font-family: "LXGW Neo ZhiSong",-apple-system,…; font-size: 1.1rem; line-height: 2.2;
       background-color: var(--light-background); color: var(--light-color); }
.post { width: 100%; max-width: 1000px; padding: 20px 20px 40px; margin: 40px auto }
a { color: inherit }
```

---

### 2.3 罗磊的独立博客（中文 · 生活 + 技术 + 摄影）

| 项 | 实测值 |
|---|---|
| URL | https://luolei.org/ |
| 技术栈 | React RSC + Vite（`/assets/index-*.css`、`worker-entry-*.js`）+ Tailwind v4；设计 token 沿用 VitePress 的 `--vp-*` 命名；`<html lang="zh-CN" class="scroll-pt-[60px]">` |
| 主色 / 强调色 | 亮：`--vp-c-bg:#fafafa`、`--vp-c-bg-alt:#fff`、`--vp-c-text-1:#1f2937`、**`--vp-c-brand:#4faaef`**、`--vp-c-brand-light:#3d96dc`、`--vp-c-brand-soft:#4faaef73`、`--vp-c-mute:#e5e5e5`、`--vp-code-bg:#f3f3f3`；暗（`.dark`）：`--vp-c-bg:#1e1e20`、`--vp-c-bg-alt:#29292d`、`--vp-c-text-1:#e5e7eb`、`--vp-c-brand-light:#69bbf8`、`--vp-c-brand-lighter:#a0d9ff`、`--vp-c-brand-soft:#69bbf873`、`--vp-code-bg:#0f0f0f` |
| 正文字体栈 | 正文 `.article-content { font-family: -apple-system, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Helvetica, Arial, sans-serif }`；**标题走衬线** `--font-serif-cn: "Noto Serif SC", "Source Han Serif SC", "Songti SC", serif` |
| 字号 / 行高 | 无全局 `body` 字号；标题实测 `h2 { font-size: 1.95rem; font-weight: 700; line-height: 1.28; letter-spacing: -.01em }`、`h3 { font-size: 1.65rem; line-height: 1.34 }`；正文 `li { line-height: 1.72 }` |
| 内容宽度 | 文章页实测 DOM：外层 `max-w-[1220px]`，正文列 `min-w-0 flex-1 lg:max-w-[860px]`；顶栏 `max-w-[1280px]`；Tailwind 侧 `--container-3xl: 48rem` |
| 首屏构成 | 顶栏（`h-[60px]`，左右分布 logo 与导航）+ 分类导航条 `max-w-7xl`（实测分类：`/category/hot`、`/category/zuoluotv`、`/category/code`、`/category/tech`、`/category/travel`）+ 内容流 |
| 导航结构 | 顶部固定导航 + 一行横向分类导航；另有 `/about`、`/rss.xml`、`/manifest.json` |
| 卡片形态 | Tailwind 工具类拼装，圆角以 8px / 10px / 2px 混合出现 |
| 圆角 / 阴影 | `border-radius` 实测值：`2px`(3 次)、`8px`(2)、`4px`(2)、`10px`(2)；阴影几乎不用，只有 `0 10px 15px -3px #0000001a, 0 4px 6px -4px #0000001a` 一处 |
| 深色模式 | `.dark` 类，出现 **715 次**（Tailwind `dark:` 变体）；**不支持 `prefers-color-scheme`（0 处）** |
| **值得偷的细节** | **`scroll-pt-[60px]` 解决粘性导航遮挡锚点**：`<html class="scroll-pt-[60px]">` 让点击 TOC 锚点跳转后标题不被 60px 高的固定顶栏压住。这是长文站最廉价、最容易被忽略的一处体验修复。**另一半**：标题用宋体衬线（Noto Serif SC）+ 正文用系统黑体，中文博客里“标题有书卷气、正文够清晰”的稳妥解法。 |

> ⚠️ **实测警告**：`--vp-c-brand: #4faaef` 在同站浅底 `#fafafa` 上的对比度实测仅 **2.42:1**。若把它当作正文链接色，**远低于 WCAG AA 的 4.5:1**。这是“品牌色直接当链接色”的典型翻车（详见 §3.2）。

---

### 2.4 积薪 lepture（中文 · 写作 + 生活 + 技术）

| 项 | 实测值 |
|---|---|
| URL | https://lepture.com/ |
| 技术栈 | Typlog 4.0.0；主题 `theme-ueno` 0.6.3；`<html lang="en">`；接入 DocSearch |
| 主色 / 强调色 | **12 级强调色阶 + alpha 变体**（Radix 风格）：`--light-accent-1:#fefdfc` … **`--light-accent-9: #bc6262`**（主强调，砖红）… `--light-accent-12: #4f2b2a`，另有 `--light-accent-a1 … a12` 透明度变体；正文链接 `a { color: var(--accent-9) }`。灰阶 `--gray-1:#fcfcfc` … `--gray-12:#202020` |
| 正文字体栈 | `body { font-family: var(--content-font); color: var(--text-color); background-color: var(--background-color) }`，配 `text-rendering: optimizelegibility; -webkit-font-smoothing: antialiased` |
| 字号 / 行高 | 未在抓取到的样式表中检出全局 `body` 字号声明 |
| 内容宽度 | `.main .inner` 规则中 `max-width` = **680px** |
| 首屏构成 | `<h1>Just lepture</h1>` + 内容流；照片区块 `.photos` 用 flex 纵向排列，`figcaption` 悬停显示（`opacity: 0 → 1`） |
| 导航结构 | 未检出 `<nav>`；站点以内容流 + 搜索（DocSearch）为主 |
| 卡片形态 | 弱卡片 / 无卡片，靠排版与图片区块组织 |
| 圆角 / 阴影 | 未在抓取到的样式中检出全站圆角 / 阴影变量 |
| 深色模式 | `.dark` 类共 **17 处**（含灰阶整套翻转）：`.dark{ --gray-1:#111; --gray-2:#191919; --gray-3:#222; --gray-4:#2a2a2a; --gray-5:#313131; --gray-6:#3a3a3a; --gray-7:#484848; --gray-8:#606060; --gray-9:#6e6e6e; --gray-10:#7b7b7b; --gray-11:#b4b4b4; --gray-12:#eee }` |
| **值得偷的细节** | **强调色以“整套色阶”交付，而不是一个 hex**：`--accent-1…--accent-12` 覆盖从“几乎是背景色”到“深到可以当正文”的全区间，组件按需取级（链接用 9、浅底用 3、深底用 11），从此没有人在组件里硬编码颜色。 |

> ⚠️ **实测警告**：`--accent-9: #bc6262` 作为链接色，在同站灰底 `#fcfcfc` 上的对比度实测仅 **4.04:1**，**低于 WCAG AA 正文 4.5:1**。这正是暖色强调色的普遍陷阱（见 §3.2）。

---

### 2.5 Craig Mod（英文 · 行走 + 写作 + 技术，个人综合博客的世界级样本）

| 项 | 实测值 |
|---|---|
| URL | https://craigmod.com/ |
| 技术栈 | Hugo 0.166.0；1140 栅格（`css/1140.css`）+ `master-1140.css` + `cmod.css`；`<body id="index" onload="setupZoom()">` |
| 主色 / 强调色 | 亮：`--paper:#fff`、`--paper-2:#f7f7f7`、`--paper-3:#efefef`、`--rule:#ddd`、`--gray:#bbb`、`--ink-faint:#999`、`--ink-mute:#666`、`--ink-soft:#555`、**`--ink:#333`**、`--ink-deep:#222`、`--black:#000`、**`--link:#007AFC`**、`--link-dark:#0064cc`、`--sel:#ffff66`（选中高亮）；暗：`--dm-bg:#222`、`--dm-surface:#333`、`--dm-rule:#555`、`--dm-text:#ddd`、`--dm-bright:#fff`、`--dm-bg-deep:#111` |
| 正文字体栈 | `--font-sans: "ff-meta-web-pro-1","ff-meta-web-pro-2", -apple-system, BlinkMacSystemFont, …`；`--font-serif: "ff-meta-serif-web-pro-1","ff-meta-serif-web-pro-2", Georgia, Times, …`（Adobe Fonts 外部字体）；代码 `Menlo, Monaco, Courier, monospace` |
| 字号 / 行高 | 笔记类区块 `.wterr-note { max-width: 62em; font-size: 1.2em; line-height: 1.6em }` |
| 内容宽度 | `master-1140.css` 中实测出现 `max-width` 值：`3000px` / `1180px` / `900px` / `768px` / `720px` / `700px` / `62em`；`.container` 在移动断点下全部归零（`width:100%; min-width:0`） |
| 首屏构成 | 首页 `body#index` 带 `.featuredhome` 主推区（`h2 { font-size: 2.5em; font-family: var(--font-sans) }`）+ 订阅表单（`.home-signup-form`，`max-width: 520px; border-radius: 5px`） |
| 导航结构 | 大量内容入口（home / about / 各专栏），以 `.craigylinks` 链接块承载 |
| 卡片形态 | 非卡片式，用栅格 + 分隔线；链接块自带底色（`rgba(50,50,50)`，悬停 `.7` 透明） |
| 圆角 / 阴影 | 圆角实测 `5px`（订阅表单）级别，整体极小 |
| 深色模式 | **`@media (prefers-color-scheme: dark)` 出现 2 次，且用 `html:not(.light)` 作为作用域**——即“默认跟随系统，只有手动切到 light 才覆盖”。CSS 中无 `.dark` 类 |
| **值得偷的细节** | **`html:not(.light)` 的暗色作用域写法**：把系统偏好当作默认，只在用户显式选择亮色时才偏离。这样一套 `--dm-*` token 同时服务“自动跟随系统”与“手动切换”，不需要写两套媒体查询逻辑，也不会出现手动切换后又被系统偏好覆盖的经典 bug。**另一个值得记的**：他为日文内容准备了整套 `body.ja` / `body.japanese` 字体栈（`"Hiragino Kaku Gothic Pro W3", Meiryo, …`）——**多语种不是翻译问题，是字体问题**，这对我们未来可能的 i18n 预留很有参考价值。 |

---

### 2.6 Robin Sloan（英文 · 小说 + 技术 + 生活，最“有人味”的样本）

| 项 | 实测值 |
|---|---|
| URL | https://www.robinsloan.com/ |
| 技术栈 | 自研静态生成（`<meta name="generator" content="The very hands of Sloan">`）；样式**全部内联在 `<style>` 中，共 23,373 字节**，无外部 CSS |
| 主色 / 强调色 | `<meta name="theme-color" content="hsl(14, 76%, 55%)">`（暖橙，换算 **#E35E35**）；变量：`--pink: hsl(345,80%,80%)`、`--green: hsl(102,40%,57%)`、`--gold: hsl(42,85%,57%)`、`--nice-blue: hsl(208,100%,45%)`、`--dark-blue: hsl(208,100%,27.5%)`、`--nice-red: hsla(14,85%,55%)`、`--hot-red: oklch(70% 0.195 37)`、`--nice-purple: hsl(230,57%,55%)`、`--paper-gray: hsl(42,0%,96%)`、`--paper-icy: hsl(208,100%,98%)`、**`--cosmic-latte: hsl(42,100%,96%)`**（换算 #FFF9EB） |
| 正文字体栈 | `--headline-font-stack: "Kyrios", serif`；`--serif-font-stack: "Filosofia", "Times New Roman", serif`。**自托管 4 套 Web Font**（Kyrios / Filosofia / Trade Gothic Next / Job Clarendon，共 8 个 `@font-face`，全部 `.woff2` + `font-display: swap`） |
| 字号 / 行高 | `html { font-size: 14px }`；`--text-size: 1.5rem`、`--line-height: 2rem`（即行高 ≈1.33）；`body { font-size: var(--text-size); line-height: var(--line-height) }` |
| 内容宽度 | **`--text-block-width: 48rem`（768px）** |
| 首屏构成 | `<header>` 三链接导航（Home / About / Moonbound）+ `<main>` 首屏即 `h1`「Robin Sloan — a creative industrialist」+ 一段自我介绍 + 新书信息 |
| 导航结构 | 极简三链接；无搜索、无分类页 |
| 卡片形态 | 非卡片；`p.alert` 用 `border-radius: 0.5rem`、`pre` 用 `border-radius: 0.5rem` + `background: var(--paper-icy)` |
| 圆角 / 阴影 | 圆角统一 **0.5rem（8px）**；未见明显阴影 |
| 深色模式 | **无**。全文 `prefers-color-scheme: dark` 出现 **0 次** |
| **值得偷的细节** | **按栏目切换“纸色”与字号，一套模板承载不同气质**：`body.home main { --text-size: 1.25rem; --background-color: var(--paper-gray) }`，`body.meteor main, body.lab main { --text-size: 1.5rem; --background-color: var(--cosmic-latte) }`。同一篇文章模板，在「主页」是灰纸 1.25rem、在「实验室」是奶油纸 1.5rem——**用背景色和字号给栏目“换情绪”，成本几乎为零，效果却极强**。这对我们「技术 / 生活 / 读书 / 作品」四栏目是最直接可抄的一招。 |

> 注：其强调色 `#E35E35` 在自家奶油底 `#FFF9EB` 上对比度实测仅 **3.38:1**，同样不可用于小字号正文链接。

---

### 2.7 Josh W. Comeau（英文 · 前端技术 + 设计，工程化程度最高）

| 项 | 实测值 |
|---|---|
| URL | https://www.joshwcomeau.com/ |
| 技术栈 | Next.js；由 `<html>` 元素上的 `data-color-mode` 属性驱动主题（取值 light / dark） |
| 主色 / 强调色 | 亮：**`--color-text:#0a0c10`**、**`--color-background:#fff`**、`--color-action: #4242fa`、`--color-primary:#4242fa`、`--color-secondary:#e60067`、`--color-tertiary:#2c0b8e`、`--selection-background-color:#ffec8f`（选中高亮黄）；暗：**`--color-text:#e3e6e8`**、**`--color-background:#0d0f12`**、`--color-primary:#809fff`、`--color-secondary:#ff1981`、`--color-tertiary:#e6b3ff`、`--color-blurred-background:rgba(13,15,18,.75)`、`--selection-background-color:rgba(139,133,173,.35)` |
| 正文字体栈 | `--font-family: "Wotfard","Wotfard-fallback",sans-serif`；`--font-family-mono: "Cartograph CF", monospace`；`--font-family-spicy: "Sriracha","Wotfard-fallback",sans-serif`；字重三档 `--font-weight-light:400 / medium:500 / bold:600` |
| 字号 / 行高 | `body { -webkit-font-smoothing: antialiased; line-height: 1.5; line-height: calc(.95 + .62rem) }`——**行高随根字号流体缩放** |
| 内容宽度 | 未在抓取样式中检出统一正文 `max-width`（由组件级 styled-components 控制） |
| 首屏构成 | `h1`「Josh W Comeau homepage」+ 卡片式课程 / 文章入口 |
| 导航结构 | `<nav><ul><li><button>categories</button></li><li><button>courses</button></li><li><button>goodies</button></li>…`（**下拉式按钮导航，不是平铺链接**）+ About |
| 卡片形态 | 强卡片：每张卡片有独立底色与 4px 圆角 |
| 圆角 / 阴影 | **间距系统 4px 基准**：`--sp-space-1:4px` … `--sp-space-11:44px`（共 11 级）；`--sp-border-radius:4px`；过渡 `--sp-transitions-default:150ms ease` |
| 深色模式 | `data-color-mode` 属性 + 20 处暗色选择器；**不支持 `prefers-color-scheme`（CSS 中 0 处，切换逻辑在 JS）** |
| **值得偷的细节** | **强调色在暗色模式下“换值提亮”而不是沿用同一个 hex**：`--color-primary` 亮色 `#4242fa`（对白底 6.19:1）→ 暗色 `#809fff`（对 `#0d0f12` 7.60:1）；`--color-secondary` `#e60067` → `#ff1981`。**同一个品牌色在两种底色上需要两个值**——这一条直接决定我们的 token 结构必须是“语义名 → 亮/暗两套原始值”，而不能只存一个品牌色。 |

---

### 2.8 Steph Ango（英文 · 设计 + 写作，token 体系最值得抄）

| 项 | 实测值 |
|---|---|
| URL | https://stephango.com/ |
| 技术栈 | 静态站，单一样式表 `https://stephango.com/styles.css`（29,198 字节），无 JS 框架 |
| 主色 / 强调色 | **Flexoki 自研色板**。原始层：`--flexoki-black:#100F0F`、`--flexoki-paper:#FFFCF0`、`--flexoki-50:#F2F0E5`、`-100:#E6E4D9`、`-150:#DAD8CE`、`-200:#CECDC3`、`-300:#B7B5AC`、`-600:#6F6E69`、`--flexoki-cyan-600:#24837B`、`--flexoki-cyan-50:#DDF1E4`、`--flexoki-red-600:#AF3029`、`--flexoki-orange-600:#BC5215`、`--flexoki-yellow-100:#F6E2A0`、`--flexoki-green-600:#66800B`。语义层：`:root,.theme-light{ --color-bg-primary: var(--flexoki-paper); --color-bg-secondary: var(--flexoki-50); --color-tx-normal: var(--flexoki-black); --color-tx-muted: var(--flexoki-600); --color-tx-faint: var(--flexoki-300); --color-ui-normal: var(--flexoki-100); --color-highlight: var(--flexoki-yellow-100); **--color-action: var(--flexoki-cyan-600)** }` |
| 暗色 token | `.theme-dark{ --color-bg-primary: var(--flexoki-black); --color-bg-secondary: var(--flexoki-950); --color-tx-normal: var(--flexoki-200); --color-tx-muted: var(--flexoki-500); --color-tx-faint: var(--flexoki-700); --color-ui-normal: var(--flexoki-900); **--color-action: var(--flexoki-cyan-400)** }`——强调色同样换级（600→400） |
| 正文字体栈 | `--font-content: -apple-system, BlinkMacSystemFont, "Inter", "IBM Plex Sans", Segoe UI, Helvetica, Arial, sans-serif`；等宽 `ui-monospace, SFMono-Regular, "Cascadia Code", "IBM Plex Mono", …`。**零 Web Font** |
| 字号 / 行高 | `html { font-size: 62.5% }`（1rem = 10px）；`--line-height: 1.5`；`--font-small: 0.875em`；`h1 { font-size: calc(1.35em + .55vw); letter-spacing: -0.02em; line-height: 1.25; font-weight: 500 }` |
| 内容宽度 | **双宽度**：`--wrap-normal: 37em`（`p { max-width: var(--wrap-normal) }`）、`--wrap-wide: 54em`（`article { max-width: var(--wrap-wide); width: var(--wrap-normal); margin: 0 auto }`）；移动端降为 `--wrap-normal: 88vw; --wrap-wide: 100vw` |
| 首屏构成 | 导航（Steph Ango / About / Now 共 3 项）→ `Latest` 区块：最新一篇的标题 + 「日期 · 1 minute read」+ `Keep reading →` → `Topics` 标签云（advice, ai, competition, defaults, design, empathy…） |
| 导航结构 | 极简文字导航 + Now 页；无搜索 |
| 卡片形态 | 非卡片；文章列表是纯文字行，靠 `hr:before { content: "•••" }` 做分隔装饰 |
| 圆角 / 阴影 | `--border-radius: 4px`、`--image-radius: 6px`；`pre { border-radius: 4px; padding: 1em; font-size: 90%; border: 1px solid var(--color-ui-normal) }`；阴影仅用于弹层 `0 5px 20px 2px rgba(var(--flexoki-black-rgb), 1)` |
| 深色模式 | **首帧内联脚本 + body class**：`if (localStorage.theme === 'dark' \|\| (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) { document.querySelector('body').classList.add('theme-dark') }`；CSS 侧额外声明 `color-scheme: light dark` 让原生控件跟随。**CSS 中 `prefers-color-scheme` 出现 0 次**——跟随系统的判断全部在 JS 里完成，因此不存在“CSS 与 JS 打架”的闪烁 |
| **值得偷的细节** | **“外宽内窄”的双宽度阅读节奏**：`article` 可达 54em，但段落 `p` 只占 37em；需要时用 `.wide` 让图片 / 表格出血到 54em。**正文列宽守住可读性，容器留出呼吸位**——这解决了“窄栏放不下大图、宽栏读完一行太累”的死结，且实现成本只有两条 `max-width`。 |

---

## 3. 横向对比表（全部为实测值）

| 站点 | 语言 | 类型 | 正文列宽 | 正文字号 / 行高 | 正文字体 | 强调色 | 圆角策略 | 阴影策略 | 深色模式实现 |
|---|---|---|---|---|---|---|---|---|---|
| 阮一峰 | 中 | 技术+随笔 | 容器 780–1260px（双栏） | 10px 基准 / 1.8em | Georgia 衬线 | 无（米黄底 #f5f5d5 即标识） | **0** | **0** | **无** |
| 木木木木木 | 中 | **生活+技术** | 1000px（窄屏 860px） | 1.1rem / **2.2** | 霞鹜新致宋（Web Font） | 无（全站黑白灰） | 8px 为主 | 极轻（.04 / .05 透明度） | `.dark` 类 + 变量（67 处），**不跟随系统** |
| 罗磊 | 中 | **生活+技术** | 1220px 容器 / 正文 860px | 标题 1.95rem / 1.28 | 标题宋体衬线 + 正文系统黑体 | `#4faaef` | 2–10px 混合 | 几乎不用 | `.dark` 类（715 处），**不跟随系统** |
| 积薪 | 中 | **写作+生活+技术** | **680px** | 未检出 | `--content-font` | `#bc6262`（12 级色阶） | 未检出 | 未检出 | `.dark` 类（17 处）+ 灰阶整套翻转 |
| Craig Mod | 英 | **行走+写作+技术** | 62em / 720px / 768px 多档 | 1.2em / 1.6em | Adobe Fonts 衬线+无衬线 | `#007AFC` | 5px 级 | 极少 | `prefers-color-scheme` + **`html:not(.light)`** |
| Robin Sloan | 英 | **小说+技术+生活** | **48rem（768px）** | 1.5rem / 2rem（≈1.33） | 自托管 4 套字体 | `hsl(14,76%,55%)` = #E35E35 | 8px 统一 | 无 | **无** |
| Josh Comeau | 英 | 前端技术+设计 | 组件级 | 流体行高 `calc(.95+.62rem)` | Wotfard（自托管） | `#4242fa` → 暗色 `#809fff` | 4px | 组件级 | `data-color-mode` 属性（20 处） |
| Steph Ango | 英 | 设计+写作 | **37em 正文 / 54em 容器** | 1rem=10px / 1.5 | 系统栈，**零 Web Font** | `#24837B` → 暗色换级 | 4px | 仅弹层 | 内联脚本 + `.theme-dark` + `color-scheme` |

### 3.1 从表里读出来的四条硬结论

1. **正文列宽收敛在 680–860px**（积薪 680 / Craig Mod 720 / Robin Sloan 768 / 罗磊 860 / 木木木木木 1000 但窄屏降 860）。**PRD 规定的 720±40px 正好落在这个区间内，且被 Craig Mod 的 720px 与积薪的 680px 直接印证——这条不用改。**
2. **中文长文行高普遍比英文高**：木木木木木 2.2、阮一峰 1.8em、罗磊正文 li 1.72；而英文站 Robin Sloan 仅 1.33、Steph Ango 1.5。**PRD 要求“行高 ≥1.7”是对的，建议直接锁 1.8**（中文方块字没有西文的 x-height 变化，行距必须靠行高补）。
3. **“零 Web Font” 与 “中文衬线标题” 是互斥的**。想要标题有书卷气，只有三条路：① 用系统衬线（Windows 落到 SimSun，屏显观感差）；② 自托管整套中文衬线（木木木木木的霞鹜新致宋样式表 **103,615 字节**，远超 PRD「首屏 CSS < 25KB」预算）；③ **自托管“子集化”字体，只覆盖标题用到的字符**。Steph Ango 用系统栈 + 零 Web Font，Robin Sloan 用 4 套自托管字体——两种路线都成立，但必须**明确选一边**，不能既要又要。
4. **深色模式有三种实测实现，只有一种能保证“无闪烁”**：
   - Steph Ango / 木木木木木：**首帧内联 JS 读 localStorage → 给 `<body>` 加 class**（不闪烁，且 CSS 里完全不写 `prefers-color-scheme`，无 JS/CSS 打架）
   - Josh Comeau：`data-color-mode` 属性（同样首帧前设置，不闪烁）
   - Craig Mod：`@media (prefers-color-scheme: dark)` + `html:not(.light)`（跟随系统很优雅，但**手动切换前会有一帧系统色**）

   **推荐：Steph Ango 式内联脚本（PRD F-06 已要求“无闪烁”，这是最稳的实现）**，并参考 Craig Mod 补 `color-scheme: light dark` 让原生控件与滚动条跟随。

### 3.2 一条跨站点的“反面证据”

把 6 个站的强调色放到它们各自的浅色底上算对比度：

| 站点 | 强调色 | 底色 | 对比度 | 结论 |
|---|---|---|---|---|
| 罗磊 | `#4faaef` | `#fafafa` | **2.42:1** | ❌ 远低于 AA |
| Robin Sloan | `#e35e35` | `#fff9eb` | **3.38:1** | ❌ 低于 AA |
| 积薪 | `#bc6262` | `#fcfcfc` | **4.04:1** | ❌ 略低于 AA |
| Craig Mod | `#007afc` | `#ffffff` | **4.05:1** | ❌ 略低于 AA |
| Steph Ango | `#24837b` | `#fffcf0` | **4.43:1** | ⚠️ 擦边未过 |
| Josh Comeau | `#4242fa` | `#ffffff` | **6.19:1** | ✅ 通过 |

**六个优秀站点里五个强调色不达标。** 这不是他们不专业，而是**“有质感的低饱和色”天生对比度低**。结论：我们在 §5 的所有方向里，强调色一律分两级——装饰用 `--accent`、文字链接用 `--accent-text`，后者强制 ≥4.5:1。

---

## 4. 对 PRD 相关约束的实测校验

| PRD 条款 | 实测校验 | 结论 |
|---|---|---|
| §2.1 G2 正文宽度 720±40px | 5 个站实测 680 / 720 / 768 / 860 / 1000px | ✅ 保持 720px |
| §2.1 G2 行高 ≥1.7 | 中文站实测 1.72 / 1.8 / 2.2；英文站 1.33 / 1.5 | ✅ 保持，**建议锁 1.8** |
| §2.1 G2 中文字号 ≥16px | 木木木木木 1.1rem（17.6px）；Steph Ango 以 62.5% 做 10px 基准 | ✅ 保持 16–17.6px |
| §10 性能 Web Font 请求数 = 0 | 木木木木木为中文衬线付费 103,615 字节样式表；Robin Sloan 自托管 8 个 `@font-face` | ✅ 保持 0；若要衬线标题，见 §5.4 |
| §10 首屏 CSS < 25KB（gzip） | 各站原始 CSS 18KB–365KB（未 gzip，含未使用工具类）；Steph Ango 手写单文件仅 29KB 原始 | ⚠️ 需靠 PurgeCSS / 手写 CSS 保证，参考 Steph Ango 路线 |
| §9 深色模式首帧前生效 | 三种实测实现，见 §3.1 第 4 条 | ✅ 推荐内联脚本 + body class |
| §5 导航 5 项（首页/文章/归档/作品/关于） | 实测导航项数：Robin Sloan 3 项、Steph Ango 3 项、阮一峰 0 项、Josh Comeau 4 个下拉按钮 | ⚠️ 5 项偏多但可接受；参考站普遍 **3–4 项** |
| §7.1 首页个人卡片 | Robin Sloan 首屏是 h1 + 自我介绍；木木木木木首屏直接是文章流（无人格化入口）；Steph Ango 首屏 Latest + Topics | ✅ 保留个人卡片，参考 Robin Sloan 的“人 + 一句话 + 最新作品” |
| §7.6 作品页卡片网格 | Josh Comeau 的卡片网格 + 4px 圆角 + 4px 基准间距 | ✅ 可直接借鉴其间距系统 |
| §12.1 站名候选 | 八个站名全部是 2–3 词极短名（Just lepture / Lil'Log / 阮一峰的网络日志） | ✅「拾光集」「半山笔记」均符合长度惯例 |

---

## 5. 视觉方向提案（3 个）

> 以下 token 为**提案值**。所有“对比度”列均由我在本地按 WCAG 2.1 相对亮度公式实际计算得出，非估计。

### 5.0 三个方向共用的基础约定

- **Token 分两层**（照抄 Steph Ango 的结构，见 §2.8）：原始层 `--palette-*` 存具体色值 → 语义层 `--color-*` 存用途。组件**只允许**引用语义层。
- **亮暗不是反色**：暗色模式一律“降饱和 + 降对比”（参考 Lil'Log 与木木木木木的实测做法），暗色正文永远不用纯白。
- **强调色两级**：`--accent`（装饰 / 大字 / 下划线）与 `--accent-text`（正文尺寸链接），后者强制 ≥4.5:1。
- **间距基准**：统一 4px 整数倍（借 Josh Comeau 的 `--sp-space-*` 思路），但三方向取不同密度。
- **深色模式实现**：三方向统一采用 §3.1 第 4 条的“首帧内联脚本 + `<html class="dark">`”，并补 `color-scheme: light dark`。

---

### 5.1 方向 A · 纸感墨色（Paper & Ink）

**气质描述**：像一本装帧克制的纸质杂志。暖白纸底、深墨字、一个低饱和的赭红点缀。标题可衬线、正文无衬线。**零阴影、细边框、小圆角**——所有“高级感”都来自留白与字距，而不是装饰。这是三个方向里最贴近 PRD §12.2「方向一 · 纸感留白」的一个，但把“米黄”从阮一峰的 `#f5f5d5`（偏黄、偏旧）收敛到更中性的暖白，避免显旧。

**Design Tokens**

| 语义 Token | 亮色 | 暗色 |
|---|---|---|
| `--color-bg` | `#FAF8F1` | `#1A1815` |
| `--color-surface` | `#FFFFFF` | `#232019` |
| `--color-surface-2` | `#F2EFE6` | `#2B2721` |
| `--color-text` | `#1C1A17` | `#E8E3D9` |
| `--color-text-secondary` | `#6B655C` | `#A29A8C` |
| `--color-border` | `#E4DFD3` | `#3A352C` |
| `--color-accent` | `#A34A32` | `#D98A6E` |
| `--color-accent-text` | `#A34A32` | `#D98A6E` |

**对比度实测**：

| 组合 | 亮色 | 暗色 |
|---|---|---|
| 正文 / 背景 | 16.34:1 ✅ | 13.85:1 ✅ |
| 次文字 / 背景 | 5.43:1 ✅ | 6.36:1 ✅ |
| 强调色 / 背景 | 5.52:1 ✅ | 6.59:1 ✅ |
| 强调色 / 表面 | 5.86:1 ✅ | 6.05:1 ✅ |
| 次文字 / surface-2 | 5.02:1 ✅ | 5.33:1 ✅ |
| 边框 / 背景 | 1.25:1（**仅装饰，不承载信息**） | 1.46:1 |

**字体搭配**

```css
/* 标题：系统衬线栈，零 Web Font */
--font-heading: "Noto Serif SC", "Source Han Serif SC", "Songti SC",
                "SimSun", Georgia, serif;
/* 正文：系统无衬线栈（中文优先） */
--font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
             "Hiragino Sans GB", "Microsoft YaHei", "Source Han Sans SC",
             sans-serif;
--font-mono: ui-monospace, SFMono-Regular, "Cascadia Code", Consolas, monospace;
```

- 字号：正文 **17px**（1.0625rem），行高 **1.85**；标题 `h1 2rem / 1.3`、`h2 1.5rem / 1.4`、`h3 1.2rem / 1.5`
- 字距：正文 `letter-spacing: 0.01em`（中文无需负字距；阮一峰的负字距是给西文用的，见 §2.1）

**间距节奏**：8px 基准。段落间距 `1.5em`；`h2 { margin-top: 3rem }`；页面容器上下 `4rem / 6rem`；`--content-width: 720px`，`--container-width: 1024px`。

**圆角与阴影**：`--radius: 4px`（借 Steph Ango）、`--radius-pill: 999px`（仅标签）；**阴影全站为 0**，卡片与代码块一律用 `1px solid var(--color-border)` 区分。

**适用读者**：P1 未来的自己（长文回看）、P2 技术同行、P3 泛读者中的文艺型读者；尤其适合「读书」栏目占比高的站点。

**风险**：
1. **系统衬线在 Windows 上会落到 SimSun（宋体）**，屏显观感明显劣于 macOS 的 Songti SC。若不接受，需启用 §5.4 的子集化方案（会增加一个 Web Font 请求，与 PRD §10 冲突，需老板拍板）。
2. 暖白底 + 低对比边框，在**低质量显示器 / 强环境光**下容易显得“脏”。建议边框对比度不低于 1.2:1 且色相统一。
3. “纸感”极易被做成“复古”，与 PRD 定位的“专业”有张力。**必须靠克制的字号层级和精准的留白压住**，不能加纹理背景、不能加手写体。

---

### 5.2 方向 B · 墨蓝极简（Ink & Indigo）

**气质描述**：冷、准、快。近白 / 近黑双主题，单一靛蓝强调，全无衬线。信息密度略高于 A，列表页一眼能扫到 8–10 条。最接近 PRD §12.2「方向二 · 极简冷调」，也是三个方向里**工程风险最低、最像 Lil'Log 但有一个明确识别色**的一个。用户来这里是“读技术文、找旧文”，不是“逛杂志”。

**Design Tokens**

| 语义 Token | 亮色 | 暗色 |
|---|---|---|
| `--color-bg` | `#FCFCFD` | `#0F1115` |
| `--color-surface` | `#FFFFFF` | `#171A21` |
| `--color-surface-2` | `#F2F3F5` | `#1F232B` |
| `--color-text` | `#16181D` | `#E7E9EE` |
| `--color-text-secondary` | `#5B6270` | `#98A0AE` |
| `--color-border` | `#E3E5EA` | `#2A2F39` |
| `--color-accent` | `#3B4CE0` | `#8E9CFF` |
| `--color-accent-text` | `#3B4CE0` | `#8E9CFF` |

> 暗色强调色从 `#3B4CE0` **提亮**为 `#8E9CFF`，直接照搬 Josh Comeau 的实测策略（`#4242fa` → `#809fff`，见 §2.7）。

**对比度实测**：

| 组合 | 亮色 | 暗色 |
|---|---|---|
| 正文 / 背景 | 17.32:1 ✅ | 15.56:1 ✅ |
| 次文字 / 背景 | 5.98:1 ✅ | 7.18:1 ✅ |
| 强调色 / 背景 | 6.21:1 ✅ | 7.51:1 ✅ |
| 强调色 / 表面 | 6.37:1 ✅ | 6.92:1 ✅ |
| 次文字 / surface-2 | 5.52:1 ✅ | 5.98:1 ✅ |
| 边框 / 背景 | 1.23:1（仅装饰） | 1.41:1 |

**字体搭配**：全无衬线，**零 Web Font**

```css
--font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
             "Hiragino Sans GB", "Microsoft YaHei", Roboto, Helvetica, Arial, sans-serif;
--font-mono: ui-monospace, SFMono-Regular, "Cascadia Code", Consolas,
             "Liberation Mono", monospace;
```

- 字号：正文 **16px**，行高 **1.75**；`h1 1.875rem / 1.3`、`h2 1.4rem / 1.45`、`h3 1.15rem / 1.5`
- 字重：正文 400、标题 600、元信息 400 + `--color-text-secondary`

**间距节奏**：4px 基准（对齐 Josh Comeau 的 `--sp-space-*`）。`--space-1..11: 4/8/12/16/20/24/28/32/36/40/44px`；段落 `1.25em`；卡片内边距 `20px 24px`；`--content-width: 720px`，`--container-width: 1080px`。

**圆角与阴影**：`--radius-sm: 4px`（控件）、`--radius-md: 6px`（卡片）、`--radius-full: 999px`（标签）；阴影仅一档 `--shadow-card: 0 1px 2px rgba(16,18,22,.05)`（借木木木木木），暗色下改为 `0 0 0 1px var(--color-border)`。

**适用读者**：P2 技术同行（主）、P1 未来的自己（主）、P4 潜在合作方（作品页的专业感）；对「技术」栏目占比高的阶段最友好。

**风险**：
1. **辨识度最低**。PRD §1.3 明确指出 Lil'Log 的问题是“无风格风格、千人一面”；靛蓝 + 灰白是最常见的组合，**必须靠排版细节（锚点、代码块、TOC、归档密度）建立记忆点**，否则就是“又一个技术博客”。
2. 冷调 + 高密度对「生活」「读书」栏目不友好——这两个栏目放进来会有“把散文塞进 API 文档”的错位感。需要栏目级微调（参考 Robin Sloan 的按栏目换纸色，§2.6）。
3. 靛蓝 `#3B4CE0` 饱和度高，**大面积使用会刺眼**，只允许出现在链接、当前项、按钮三处。

---

### 5.3 方向 C · 暖橘生活志（Warm Journal）

**气质描述**：一本手帐。奶油底、暖橙强调、稍大的圆角、带一点点柔和阴影的卡片。首屏的人味最足（头像 + 一句话 + 最近在做的事）。这是 PRD §12.2「方向三 · 暖色个人化」的收敛版——**去掉了手写体标题**（那是最容易显不专业的一环），改用字重与圆角来传达松弛感。

**Design Tokens**

| 语义 Token | 亮色 | 暗色 |
|---|---|---|
| `--color-bg` | `#FDF8F1` | `#17130F` |
| `--color-surface` | `#FFFFFF` | `#201A15` |
| `--color-surface-2` | `#F7EFE4` | `#2A221B` |
| `--color-text` | `#221C16` | `#F0E8DE` |
| `--color-text-secondary` | `#6E6154` | `#AFA094` |
| `--color-border` | `#EBE0D1` | `#382E25` |
| `--color-accent` | `#B04520` | `#F08A5D` |
| `--color-accent-text` | `#B04520` | `#F08A5D` |

> 强调色最初我取 `#C9552A`（更接近 Robin Sloan 的 `#E35E35`），实测对比度只有 **4.13:1**，**未过 AA**，故下调到 `#B04520`（5.35:1）。这条调整本身就是 §3.2 那个结论的现场演示。

**对比度实测**：

| 组合 | 亮色 | 暗色 |
|---|---|---|
| 正文 / 背景 | 15.95:1 ✅ | 15.22:1 ✅ |
| 次文字 / 背景 | 5.68:1 ✅ | 7.28:1 ✅ |
| 强调色 / 背景 | 5.35:1 ✅ | 7.48:1 ✅ |
| 强调色 / 表面 | 5.65:1 ✅ | 6.97:1 ✅ |
| 次文字 / surface-2 | 5.26:1 ✅ | 6.16:1 ✅ |
| 边框 / 背景 | 1.23:1（仅装饰） | 1.40:1 |

**字体搭配**：零 Web Font，正文用系统黑体，**靠字重与圆角而非字体制造温度**

```css
--font-body: -apple-system, BlinkMacSystemFont, "PingFang SC",
             "HarmonyOS Sans SC", "Microsoft YaHei", "Segoe UI", sans-serif;
--font-heading: var(--font-body);   /* 与正文同栈，用 600 字重拉开层级 */
--font-mono: ui-monospace, SFMono-Regular, "Cascadia Code", Consolas, monospace;
```

- 字号：正文 **17px**，行高 **1.8**；`h1 2rem / 1.3`、`h2 1.45rem / 1.4`、`h3 1.15rem / 1.5`

**间距节奏**：8px 基准，留白比 A 更大。段落 `1.6em`；卡片内边距 `24px`；卡片间距 `24px`；页面容器上下 `5rem / 7rem`；`--content-width: 720px`，`--container-width: 1100px`。

**圆角与阴影**：`--radius-card: 12px`、`--radius-control: 8px`、`--radius-pill: 999px`；`--shadow-card: 0 4px 12px rgba(120,80,40,.08)`（亮色）/ 暗色改为 `0 2px 8px rgba(0,0,0,.35)`。

**适用读者**：P3 朋友与泛读者（主）、P1 未来的自己；对「生活」「读书」栏目最友好，适合内容结构偏“生活 + 读书 + 作品”、技术文为辅的阶段。

**风险**：
1. **最容易被做成“不专业”**。奶油 + 暖橙 + 大圆角 + 阴影，四项里任意一项过头就会像个人主页模板。**必须靠正文密度和排版精度压住**：正文行高与大方向一致、阴影透明度不超过 0.10、圆角不超过 12px。
2. P4 潜在合作方看作品页时，“手帐感”可能削弱技术可信度。**作品页需要单独收一档**（去掉卡片阴影、圆角降到 6px、强调色降饱和）。
3. 暖色底 + 暖色强调，**色相过于接近**，链接与正文的区分度依赖饱和度差，在色觉障碍用户那里可能失效——正文链接必须同时带下划线（不能只靠颜色）。

---

### 5.4 三方向共有的一个待决问题：标题要不要 Web Font

这是本次调研唯一一个“必须老板拍板、且会反向影响方向选择”的问题。

| 方案 | 代价 | 收益 | 与 PRD §10 的冲突 |
|---|---|---|---|
| **① 纯系统栈**（Steph Ango / Josh Comeau 实测路线） | 0 请求；但中文标题在 Windows 上只能落到黑体或 SimSun | 性能满分 | ✅ 无冲突 |
| **② 自托管整套中文衬线**（木木木木木实测路线） | 其字体样式表实测 **103,615 字节** | 标题书卷气最好 | ❌ 严重超「首屏 CSS < 25KB」 |
| **③ 自托管“子集化”标题字体**（本次新增建议） | 只收录标题常用字（约 600–1000 字），预计 30–80KB，用 `media="print" onload` 非阻塞加载（抄木木木木木的手法） | 兼顾两者，且不阻塞首屏 | ⚠️ 破坏“Web Font 请求数 = 0”，但不影响 LCP |

**我的建议**：MVP 阶段走 **①**，把 ③ 作为 P1 增强项。理由：PRD §10 的性能门禁是硬指标，而“标题衬线”是锦上添花；且方向 B 本来就不需要衬线标题。

---

## 6. 推荐结论

### 我最推荐：**方向 A · 纸感墨色**，并用方向 B 的工程纪律执行它

**理由（四条，全部基于本次实测）**：

1. **它匹配我们的定位，而 B 和 C 各偏一头**。我们的产品是「技术 + 生活 + 读书 + 作品」的**综合**博客（PRD §1.1）。方向 B（冷调极简）对生活/读书栏目错位；方向 C（暖橘手帐）对作品页和 P4 合作方偏弱。**A 是唯一能同时容纳“技术长文”和“生活随笔”的气质**——纸感本身就是“什么都能印”的媒介。
2. **它抄的都是被实测验证过的结构，不是审美偏好**：720px 正文列宽（Craig Mod 实测 720px、积薪 680px）、1.8 行高（阮一峰 1.8em、木木木木木 2.2）、零阴影 + 1px 边框（Steph Ango `--border-radius:4px` 与 `border: 1px solid var(--color-ui-normal)`）、暖白纸底（Flexoki paper `#FFFCF0`、阮一峰 `#f5f5d5`）。
3. **它的性能账最好算**：零 Web Font、零阴影、零图片装饰，天然满足 PRD §10 的“首屏 CSS < 25KB”“Web Font = 0”。参考 Steph Ango 的手写单文件 CSS 路线（29,198 字节原始、无工具类膨胀）即可。
4. **它的风险是可控且已知的**：唯二风险是“Windows 系统衬线观感”与“纸感容易做旧”，前者有 §5.4 的明确备选方案，后者靠“去掉纹理、收敛米黄到暖白”就能规避——我的 token 里 `#FAF8F1` 就是为此选的（比阮一峰的 `#f5f5d5` 明显更中性）。

**如果老板更看重“工程师气质”而非“生活气息”**，那么选 **方向 B**，但必须接受一个附加条件：**为「生活」和「读书」栏目做栏目级视觉微调**（照抄 Robin Sloan 的 `body.<栏目> main { --background-color: …; --text-size: … }` 手法，见 §2.6），否则综合定位会被冷调吃掉。

**方向 C 我不推荐作为主线**，但它的一个元素值得吸收进 A：**卡片圆角与柔和阴影用于“作品页”**，让作品页比文章页更有“陈列感”。

---

## 7. 需要老板拍板的问题

| # | 问题 | 我的建议 |
|---|---|---|
| V1 | 视觉方向选 A / B / C？ | **A · 纸感墨色**（用 B 的工程纪律执行） |
| V2 | 标题是否允许加载 Web Font？ | MVP 用**纯系统栈**；P1 再上子集化标题字体 |
| V3 | 强调色是否接受“两级”（装饰色 + 文字链接色）？ | **必须接受**，否则 6 个参考站里 5 个的翻车案例会在我们身上重演 |
| V4 | 暗色模式是否“跟随系统”？ | **跟随系统 + 手动覆盖 + 记忆**，用内联脚本实现（Steph Ango 方案） |
| V5 | 是否做“栏目级配色微调”（技术/生活/读书/作品各一套纸色）？ | 建议 **P1 做**，成本极低、收益极高（Robin Sloan 实测手法） |

---

## 附录 A · 证据来源清单

| 站点 | 抓取的 HTML | 抓取的 CSS（实测字节数） |
|---|---|---|
| 阮一峰 | `https://www.ruanyifeng.com/blog/`（18,600 B） | `/static/themes/theme_scrapbook/theme_scrapbook.css`（28,404 B） |
| 木木木木木 | `https://immmmm.com/`（27,148 B） | `/theme-lmm.css?v=2401-1`（46,363 B）、`/LXGWNeoZhiSong/lxgwneozhisong.css`（103,615 B） |
| 罗磊 | `https://luolei.org/`（105,849 B）、`/my-network-2026`（90,785 B） | `/assets/index-Dmm0xR8v.css`（127,702 B） |
| 积薪 | `https://lepture.com/`（23,831 B） | `ui.typlog.com/gh/typlog/theme-ueno/0.6.3/base.css`（18,074 B）、`ui.typlog.com/accent/bc6262.css`（7,522 B） |
| Craig Mod | `https://craigmod.com/`（43,170 B） | `/css/master-1140.css`（173,888 B）、`/css/cmod.css`（9,001 B）、`/css/1140.css`（4,274 B） |
| Robin Sloan | `https://www.robinsloan.com/`（40,538 B，含 23,373 B 内联 CSS） | 无外部样式表 |
| Josh Comeau | `https://www.joshwcomeau.com/`（118,513 B） | 3 个 `/_next/static/css/*.css`（合计 69,257 B） |
| Steph Ango | `https://stephango.com/`（21,918 B） | `https://stephango.com/styles.css`（29,198 B） |

## 附录 B · 深色模式实现方式实测对照

| 站点 | `prefers-color-scheme: dark` 出现次数 | 类 / 属性选择器出现次数 | 实现方式 |
|---|---|---|---|
| 阮一峰 | 0 | 0 | **无深色模式** |
| 木木木木木 | 0 | 67 | `.dark` 类 + 变量；**不跟随系统** |
| 罗磊 | 0 | 715 | `.dark` 类 + Tailwind `dark:`；**不跟随系统** |
| 积薪 | 0 | 17 | `.dark` 类 + 灰阶整套翻转 |
| Craig Mod | **2** | 0 | `@media (prefers-color-scheme: dark)` + `html:not(.light)` |
| Robin Sloan | 0 | 0 | **无深色模式** |
| Josh Comeau | 0 | 20 | `data-color-mode` 属性 |
| Steph Ango | 0 | 7 | 首帧内联脚本 + `body.theme-dark` + `color-scheme: light dark` |

**结论**：8 个站里只有 6 个做深色模式，其中 **4 个完全不用 CSS 媒体查询**——把“跟随系统”的判断放在首帧前的内联 JS 里，是当前最主流的无闪烁做法。这也印证了 PRD F-06 的实现路径。

---

*本文为视觉调研产出，供 D3 视觉方向拍板与 04-design-system.md 使用。§5 的所有 token 为提案值，需在 M2 设计系统阶段定稿并冻结。*






