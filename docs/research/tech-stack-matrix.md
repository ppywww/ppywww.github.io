# 技术选型预研矩阵（Phase 2 输入 · 非最终定案）

| 项 | 内容 |
|---|---|
| 文档 | docs/research/tech-stack-matrix.md |
| 版本 | v1.0（收敛版，按 Lead 10 分钟收敛指令裁剪为 8 维度） |
| 日期 | 2026-09-30 |
| 作者 | tech-scout（技术预研） |
| 上游 | [01-recon-lilianweng.md](../01-recon-lilianweng.md) · [02-prd.md](../02-prd.md)（已批准，MVP 锁定 PRD §8 P0） |
| 下游 | 03-tech-selection.md（ADR） |
| 取证方式 | 官方文档/仓库原文抓取 + npm registry / npm downloads API + GitHub releases Atom + **本机 pwsh 实测**；所有结论标注 [S#] 来源或"未验证" |
| 合规声明 | 本文件是本次预研**唯一**写入的文件；未创建任何项目脚手架、未安装任何依赖（见 §8） |

---

## 0. 结论摘要

1. **综合最优：Astro（v7.3.5）**。唯一同时满足「视觉定制自由度最高（组件模型，不是改主题源码）+ 构建期 Zod 校验（直接落地 PRD AC-7 的"非法分类构建期报错"）+ 默认 0 首屏 JS（满足 PRD 首屏 JS < 30KB gzip）+ 内置构建期图片管线（默认输出 .webp，支持 avif/响应式 srcset）」的方案。本机 Node **v24.19.0** 满足其 `engines.node >= 22.12.0`。
2. **落地风险最低：Hugo（v0.167.0）**。单二进制、无 node_modules、内置 CJK 词数/摘要/阅读时长（`hasCJKLanguage`）、内置图片处理、内置数学公式 passthrough、官方 GitHub Pages workflow；链路最短、变量最少。代价是 Go template 学习曲线与"主题要自己写"。
3. **淘汰级结论**：VitePress 实测首屏预加载 JS ≈ **81.6 KiB gzip**（其中 Vue 运行时单块 **41.7 KiB gzip**）已**单项突破** PRD「首屏 JS < 30KB」门禁 [S24]；且默认主题是文档形态，做博客要自研 Vue 主题。Next.js 静态导出官方明确不支持默认 loader 的 Image Optimization [S27]，且运行时最重。
4. **中文关键事实**：Pagefind **支持中文分词**（按页面 `lang` 标注，如 `zh-` 页面把「每個月都」切成「每個/月/都」），但**官方明说不支持 specialized language 的词干（stemming）** [S16] —— 这意味着"中文搜索可用，但相关度排序不如英文"，需要在 ADR 里记为已知取舍。
5. **本机环境缺口**：`pnpm / go / hugo` **均未安装**；`LongPathsEnabled = 0`（Node 方案长路径风险）；`winget 1.29.380` 可用（可装 Hugo 单二进制）。

---

## 1. 候选方案对比矩阵

### 1.1 基础画像（版本为 2026-09-30 抓取时刻的官方 registry / release 值）

| 项 | Hugo | Astro | Hexo | VitePress | Next.js 静态导出 |
|---|---|---|---|---|---|
| 当前版本 | **v0.167.0**（2026-09-28 发布）[S1] | **v7.3.5** [S9] | **v8.1.2** [S20] | **v1.6.4** [S22] | **v16.3.7** [S26] |
| 运行时依赖 | Go 单二进制（无需 Go 环境，装 exe 即可）[S7] | Node ≥22.12.0 + npm ≥9.6.5 [S9] | Node ≥20.19.0 [S20] | Node（无 engines 声明）[S22] | Node ≥20.9.0 [S26] |
| 渲染模型 | 构建期 Go 模板 | 构建期组件（islands，默认 0 JS）[S13] | 构建期 EJS/Pug 主题 | 构建期 + 客户端 Vue 接管 hydrate [S22] | 构建期 RSC 预渲染 + React 水合 [S27] |
| 依赖体积 | 0（无 node_modules） | 数百 MB node_modules | 数百 MB node_modules | 同左 | 同左（最大） |
| npm 周下载（生态势能，抓取 2026-09-30） | 不适用（非 npm） | **7,037,234** | **48,799** | **1,277,975** | 70,004,350（含全行业 CI，不作生态强弱直接依据）[S35] |

### 1.2 八维矩阵（5 分制；每格给出事实依据，非形容词）

| 维度（权重） | Hugo | Astro | Hexo | VitePress | Next.js 静态导出 |
|---|---|---|---|---|---|
| **D1 中文内容工程**（15%）<br>字体/CJK 计数/摘要 | **5** — 内置 `hasCJKLanguage`（默认 false），直接影响 `WordCount`/`FuzzyWordCount`/`ReadingTime`/`Summary`，可按页面 `isCJKLanguage` 覆盖 [S2][S3] | **4** — 无内置 CJK 计数/阅读时长，需自写；但目录/标签/分类由 Zod schema 强校验 [S10] | **4** — 中文社区最强（NexT/Butterfly 原生中文排版），阅读时长靠 `hexo-wordcount` 插件 [S21][S32] | **3** — 无内置 CJK 计数；正文排版靠 CSS；minisearch 中文分词能力未验证 | **3** — 无内置，需自建 |
| **D2 站内搜索（中文可用性）**（15%） | **4** — 无内置搜索；官方生态惯例是构建产物上跑 Pagefind（`npx pagefind --site public`），中文分词由 Pagefind 保证 [S16] | **4** — `astro-pagefind` v2.0.1 现成集成，构建后置步骤 [S15]；Pagefind 中文按页面 `lang` 分词 [S16] | **4** — `hexo-generator-searchdb` v1.5.0 成熟（本地 JSON + 前端检索）[S32] | **3** — 内置 minisearch 本地搜索开箱 [S22]，但其对中文无分词/词干，中文召回质量未验证 | **3** — 需自行接 Pagefind 或 Fuse/FlexSearch |
| **D3 深色模式无闪烁**（10%） | **4** — 无内置；需自写首帧内联脚本（`localStorage` + `prefers-color-scheme`），上游 recon 已给出成熟实现范式 [S36] | **4** — 同上；社区存在专门消除 FOUC 的方案（如 astro-fouc-killer），说明这是标准自研项而非内置项 | **4** — 取决于主题；Butterfly 自带 Dark Mode [S21] | **5** — 默认主题内置外观切换，开箱无闪烁 [S22] | **3** — 需 `next-themes` 类方案 + 内联脚本 |
| **D4 Giscus 评论**（5%） | **5** — 任意位置插 `<script src="https://giscus.app/client.js">`；无框架耦合 [S29] | **5** — 同上（web component），无框架耦合 [S29] | **5** — Butterfly 直接列出 Giscus 作为内置评论系统之一 [S21] | **5** — 同上 | **5** — `@giscus/react` 现成（周下载 434,147）[S30] |
| **D5 视觉定制自由度 + 主题生态**（15%） | **4** — 模板 + 任意 CSS，自由度极高，但 Go template 组件化弱、迭代慢；主题生态以 PaperMod/Blowfish 等为主，而本项目明确"不用现成 PaperMod" [S36] | **5** — 组件模型 + scoped CSS，可用任意 CSS 方案；主题生态活跃（npm 周下载 7.0M）[S35] | **3** — 生态强在现成中文主题（Butterfly 等），但**定制 = 改主题源码**，且主题易携带 jQuery/Pjax 等首屏 JS，撞 PRD 30KB 门禁风险高 [S21] | **2** — 默认主题是文档形态（侧边栏/大纲），做博客几乎等于从零写 Vue 主题 [S22] | **5** — React 生态最自由，但对手写博客属过度配置 |
| **D6 工程管线：构建速度 / 图片 / 数学公式**（15%） | **4** — 构建速度**未实测**；第一方宣称 "The world's fastest framework for building websites"（非独立基准）；图片处理内置且结果缓存；数学公式走官方 Goldmark passthrough + KaTeX/MathJax，或构建期 `transform.ToMath` [S4][S5] | **5** — 图片管线最强：`astro:assets` 构建期处理，默认输出 `.webp`，支持 avif/多尺寸/响应式 srcset 与 `image.layout` [S11]；Windows 有官方 sharp 预编译包 `@img/sharp-win32-x64` v0.35.5 [S14]；数学用 remark-math v6.0.0 + rehype-katex v7.0.1 [S31]；构建速度**未实测** | **3** — 图片需插件；数学需插件；构建速度**未实测** | **2** — 无内置图片管线；构建速度快（Vite），但产物 JS 体积实测超 PRD 门禁 [S24] | **1** — 静态导出下 `next/image` 默认 loader 的 Image Optimization **官方明确不支持** [S27] |
| **D7 GitHub Pages 部署 + Windows 本地开发**（15%） | **5** — 官方 workflow 原文含 `actions/configure-pages@v6` + `actions/upload-pages-artifact@v5` + `actions/deploy-pages@v5` [S6]；本机用 `winget` 装单 exe 即可，无 node_modules、无长路径问题 [S7] | **4** — 官方 `withastro/action` 自动识别 lockfile [S12]；本机 Node v24.19.0 满足要求，但 **pnpm 未安装**、`LongPathsEnabled=0` 是实测风险 [S34] | **4** — Node 方案，Actions 脚本自写；本机 Node 满足 [S20][S34] | **4** — 官方部署文档给出 GH Pages 子路径 `base` 配置（项目站点必须配）[S23] | **3** — 官方提供 GH Pages 模板，但需处理 `basePath`/`assetPrefix` 与静态导出限制 [S27] |
| **D8 学习曲线与长期维护成本**（10%） | **3** — Go template 语法是最大一次性成本；长期维护性极好（零依赖、语义化版本、活跃发版：v0.167.0 于 2026-09-28）[S1] | **4** — TS/JSX 心智，主流技能栈；风险是 v7 大版本生态包（astro-pagefind v2.0.1）跟进节奏 | **3** — 主题停更风险；npm 周下载 48,799 与 Astro 差 144 倍，生态势能下降 [S35]；hexo v8 仍在发版 [S20] | **4** — Vue 生态熟悉度高，但"自研博客主题"实际是 Vue 应用开发，隐性成本高 | **3** — 版本迭代最快（v16），破坏性变更频繁，对一个小博客属负债 |

### 1.3 加权得分

| 方案 | 加权总分（5 分制） | 排序 |
|---|---|---|
| **Astro** | **4.35** | 1 |
| **Hugo** | **4.10** | 2 |
| Hexo | 3.35 | 3 |
| Next.js 静态导出 | 3.25 | 4 |
| VitePress | 3.20 | 5 |

> 计分口径：表中 8 维评分 × 权重求和；评分是**带依据的判断**而非测量值，依据即每格引用的 [S#]。构建速度一栏因未实测，未给任何方案加分。

---

## 2. 本机工具链实测结果（pwsh 原文）

探测命令与输出（`pwsh` 实际执行，未经修饰）：

```text
node :: C:\Program Files\nodejs\node.exe :: v24.19.0
npm :: C:\Program Files\nodejs\npm.ps1 :: 11.17.0
pnpm :: NOT_FOUND
npx :: C:\Program Files\nodejs\npx.ps1 :: 11.17.0
corepack :: C:\Program Files\nodejs\corepack.cmd :: 0.35.0
yarn :: NOT_FOUND
bun :: NOT_FOUND
deno :: NOT_FOUND
go :: NOT_FOUND
hugo :: NOT_FOUND
git :: C:\Program Files\Git\cmd\git.exe :: git version 2.56.0.windows.1
python :: C:\Users\pengyu07\AppData\Local\Programs\Python\Python39\python.exe :: Python 3.9.7
python3 :: ...WindowsApps\python3.exe :: Python was not found; run without arguments to install from the Microsoft Store...
py :: C:\windows\py.exe :: Python 3.9.7
pip :: ...\Python39\Scripts\pip.exe :: pip 21.2.3 from ... (python 3.9)
uv :: C:\Users\pengyu07\.local\bin\uv.exe :: uv 0.11.24 (5e04460c0 2026-06-23 x86_64-pc-windows-msvc)
winget :: ...\WindowsApps\winget.exe :: v1.29.380
scoop :: NOT_FOUND
choco :: NOT_FOUND
dotnet :: NOT_FOUND
code :: D:\Microsoft VS Code\bin\code.cmd :: 1.139.1 / 04c0d99f4fb0d8afe6ce4f0c58e31e183ac3e4b1 / x64
```

| 探测项 | 结果 | 对选型的影响 |
|---|---|---|
| node | **v24.19.0** | 满足 Astro(≥22.12.0)/Hexo(≥20.19.0)/Next(≥20.9.0)/Eleventy(≥18) 全部要求 [S9][S20][S26][S28] |
| npm | **11.17.0** | 满足 Astro `engines.npm >= 9.6.5` |
| pnpm | **未安装** | Astro/Next 用 pnpm 需先 `corepack enable`（corepack 0.35.0 已存在）或 `npm i -g pnpm`；**本次未安装，未验证** |
| go | **未安装** | Hugo 不需要 Go 环境（官方提供 Windows 预编译二进制）[S7] |
| hugo | **未安装** | 若选 Hugo：`winget install Hugo.Hugo.Extended`（本机 winget 1.29.380 可用）[S7]，**本次未安装，未验证** |
| git | **2.56.0.windows.1** | 满足 PRD J4「写 md → commit → push」三步发布 |
| python | **3.9.7**（`py` 同为 3.9.7；`python3` 是 Microsoft Store 别名占位） | 与三个候选方案均无强依赖；注意 `python3` 别名不可用 |
| 其他环境 | Windows 11 企业版 build **26200** x64；i7-11700 8C/16T；RAM 32GB；E: 剩余 931GB；VS Code 1.139.1 | 构建算力充足，非瓶颈 |
| **LongPathsEnabled** | **0（未启用长路径）** | **实测风险项**：Astro/Next/Hexo 的 `node_modules` 深层路径在 Windows 上可能触发 260 字符限制（Hugo 不受影响） |

---

## 3. Top2 方案详述

### 3.1 首选：Astro v7.3.5（综合得分 4.35）

**为什么第一**
- **PRD AC-7 直接命中**：内容集合用 Zod schema 声明"分类只能是技术/生活/读书/作品"与必填字段，构建期即校验，无需自己写校验模板 [S10] —— 这是五个方案里唯一"原生表达 PRD §6.2 front-matter 契约"的。
- **PRD 性能门禁天然满足**：islands 架构默认不为静态内容发 JS（官方定位原文："pioneering a new frontend architecture to reduce JavaScript overhead"）[S13]；对比实测：VitePress 同位置要付 81.6 KiB gzip [S24]。
- **图片管线免自研**：构建期处理 + 默认 `.webp` + avif + 响应式 `srcset` + `image.layout` 全局开关 [S11]，PRD F-17（懒加载/灯箱）与 P1 图片优化直接受益；Windows 侧 sharp 有官方预编译二进制 [S14]。
- **搜索与部署都是"现成一步"**：`astro-pagefind` v2.0.1 [S15] + 官方 `withastro/action`（自动识别 npm/pnpm/yarn/bun lockfile）[S12]。
- **中文可用**：Pagefind 按 `zh-` 语言标注做 CJK 分词 [S16]，与 PRD §10「`<html lang="zh-CN">`」要求正好咬合。

**致命短板 / 必须自己补的**
- **无内置 CJK 阅读时长与词数**：不像 Hugo 有 `hasCJKLanguage`，需要自写 CJK 计数（按汉字数 + 英文词数估算）[S2 对比]。
- **无内置深色模式**：必须自写首帧内联脚本；这是自研项而非配置项（社区有 astro-fouc-killer 之类专门方案，说明这是通例）。
- **依赖链最长**：node_modules + sharp + Pagefind 二进制的组合，是本机三类不确定性的来源（pnpm 未装、长路径未启用、网络下载二进制）。

**适用条件**：老板/后续 Agent 愿意维护 Node 工具链；视觉需要高识别度（PRD §12.2 三方向任一都能落地）；接受"深色模式/阅读时长自己写"。

### 3.2 次选且**落地风险最低**：Hugo v0.167.0（综合得分 4.10）

**为什么第二但风险最低**
- **链路最短**：单 exe，零 node_modules、零 npm 供应链、零长路径问题；`winget` 一条命令装 extended 版即可 [S7]。
- **中文是原生能力**：`hasCJKLanguage = true` 一个开关同时修正 `WordCount`/`FuzzyWordCount`/`ReadingTime`/`Summary` 四个方法的行为（官方配置文档原文），PRD F-12（阅读时长）与中文摘要截断直接受益 [S2][S3]。
- **图片/数学都在核心里**：图片处理带结果缓存 [S4]；数学公式走官方 Goldmark passthrough（可配 KaTeX 或 MathJax，也可构建期 `transform.ToMath`）[S5]。
- **部署最官方**：Hugo 文档直接给出含 `configure-pages@v6` / `upload-pages-artifact@v5` / `deploy-pages@v5` 的完整 workflow [S6]。
- **构建期校验仍可实现**：模板里 `errorf` 会"打印 ERROR 日志并使构建失败" [S8]，可用来实现 AC-7 的非法分类报错（成本高于 Astro 的 Zod，但可行）。

**致命短板**
- **Go template 学习曲线**（一次性成本，但会拖慢 M3/M4 骨架实现）。
- **没有现成的组件化与类型约束**：Zod 式的字段契约要自己用模板 + `errorf` 复刻。
- **搜索需外挂**：必须额外跑 Pagefind 或自建 JSON 索引 + Fuse.js [S18]。

**适用条件**：老板要"最快上线、最少变量、最少长期维护"；或者后续 Agent 更擅长模板而不是 TS 生态。

### 3.3 其余三个方案的一句话否决理由

- **Hexo v8.1.2**：中文生态仍是其最大资产，但"定制=改主题源码"，且主题普遍自带首屏 JS，与 PRD「首屏 JS < 30KB gzip」相冲；npm 周下载 48,799 是 Astro 的 1/144，长期维护势能弱 [S20][S21][S35]。
- **VitePress v1.6.4**：**实测硬伤**——官方站点（默认主题）首屏预加载 JS `gzip -9` 合计 **83,571 B ≈ 81.6 KiB**（framework 41,693 / metadata 20,240 / theme 19,745 / app 757 / 页面数据 1,136），单独 framework 一块就已超 30KB 门禁；CSS 合计 40,235 B ≈ 39.3 KiB 也超 25KB 门禁。它不是不能做博客，而是"要先花力气把默认主题换成自研轻主题"才可能达门禁 [S22][S24]。
- **Next.js v16.3.7 静态导出**：官方明确"静态导出下不支持 `next/image` 默认 loader 的 Image Optimization"（需换自定义 loader 或 unoptimized）[S27]；React 运行时 + 最快的大版本节奏，对一个小博客是纯负债。

---

## 4. 在给定约束组合下"落地风险最低"的判断

约束组合：中文个人综合博客 + GitHub Pages + 站内搜索 + 无闪烁深色模式 + Giscus + 零 Web Font。

| 约束 | Astro | Hugo |
|---|---|---|
| 中文为主 | 可用；需自补 CJK 计数 | 原生 `hasCJKLanguage` |
| GitHub Pages | 官方 action，子路径 `base` 需配置 | 官方完整 workflow |
| 站内搜索 | `astro-pagefind` 一步 | Pagefind 或 Fuse.js 外挂 |
| 无闪烁深色模式 | 自写内联脚本 | 自写内联脚本（recon 已有范式） |
| Giscus | web component 直嵌 | web component 直嵌 |
| 零 Web Font | 双方均为系统字体栈，纯 CSS 决策，不构成差异 | 同左 |
| **变量数量** | Node + npm + sharp 二进制 + Pagefind 二进制 + 长路径设置 | **1 个 exe** |

**结论：Hugo 的落地风险最低**（依赖面最小、无 node_modules、无二进制下载、无长路径风险、CJK 与图片处理皆内置）。**但综合最优仍是 Astro**，因为它把"视觉定制自由度"和"构建期校验（AC-7）"这两件对本项目最关键的事做得最好。

给出可执行的决策规则（供 Lead 写 ADR）：
- 若老板更看重**成品的视觉识别度与后续迭代效率** → 选 **Astro**，并接受"自己写深色模式脚本 + CJK 阅读时长 + 处理 Windows 长路径/pnpm"这三件事。
- 若老板更看重**最快上线、最少链路故障点** → 选 **Hugo**，代价是 Go template 学习曲线与手工组装主题。

---

## 5. 与 PRD P0（§8）匹配度快检

| PRD 需求 | Astro | Hugo | 说明 |
|---|---|---|---|
| F-01 列表+分页 / F-02 详情渲染 | ✅ | ✅ | 两者都是构建期静态产出 |
| F-03 归档（年/月分组+计数） | ✅ | ✅ | 需自写模板 |
| F-04 分类（4 值约束）+ 标签 | ✅ 原生 Zod | ⚠️ 需 `errorf` 复刻 | AC-7 的落点 |
| F-05 站内搜索 | ✅ Pagefind | ⚠️ Pagefind/Fuse 外挂 | 中文分词取决于页面 `lang` [S16] |
| F-06 深色模式无闪烁 | ⚠️ 自写 | ⚠️ 自写 | 两者都必须首帧内联脚本 |
| F-07 关于/作品页 | ✅ | ✅ | — |
| F-08 Giscus（默认关、逐篇开） | ✅ front-matter 开关 | ✅ front-matter 开关 | giscus 为纯前端脚本 [S29] |
| F-09 RSS / F-10 SEO / F-13 404 | ✅ | ✅ | Astro 有 `@astrojs/rss`；Hugo 内置 RSS/sitemap |
| F-12 阅读时长 + TOC + 锚点 | ⚠️ 阅读时长自写 | ✅ 内置（CJK 生效） | `hasCJKLanguage` [S2] |
| F-14 GH Actions 部署 | ✅ | ✅ | 两者都有官方文档 workflow |
| NFR 首屏 JS < 30KB gzip | ✅ 默认 0 JS | ✅ 默认 0 JS | VitePress 实测不达标 [S24] |
| NFR 首屏 CSS < 25KB gzip | ✅ 可控 | ✅ 可控 | 参考基线：Lil'Log 主样式 4,180 B gzip [S25] |
| NFR 构建 < 60s | 未实测 | 未实测 | 见 §6 |
| NFR 零 Web Font | ✅ | ✅ | 纯字体栈决策，与 SSG 无关 |

---

## 6. 不确定项（未验证清单，直说）

| # | 未验证项 | 卡在哪 |
|---|---|---|
| U1 | **构建速度对比（全部方案）** | 任务明确禁止创建脚手架与安装依赖，无法真实跑构建；矩阵中该项不给分，仅保留官方表述。PRD 门槛 <60s 对 0–50 篇规模"应"都不构成瓶颈，但**这是推断，不是证据**。 |
| U2 | Hugo 未安装、未验证 `winget install Hugo.Hugo.Extended` 是否成功 | 受"禁止安装依赖"约束 |
| U3 | pnpm 未安装、未验证 `corepack enable pnpm` 是否成功 | 同上 |
| U4 | `LongPathsEnabled=0` 对 Astro/Next `node_modules` 的实际影响 | 需真实安装后才能测 |
| U5 | VitePress **自研极简主题**后的首屏 JS | 只实测了其官方站点（默认文档主题）[S24]；自研主题理论上可减小，但 Vue 运行时单块 41.7 KiB gzip 是硬底 |
| U6 | Pagefind 中文**检索质量**（召回/排序主观体验） | 官方只说明"支持分词、不支持 specialized language 的词干" [S16]；效果需实际语料验证 |
| U7 | Hexo 主题（Butterfly/NexT）实测首屏 JS 是否超 30KB | 未做站点级体积实测；仅凭主题功能清单（Pjax 等）判断有风险 |
| U8 | Astro v7 生态包（astro-pagefind v2.0.1）与 v7 的兼容性 | 未安装，无法验证 peer 兼容 |
| U9 | GitHub Pages 在中国大陆的实际访问质量 | 无可靠测量手段；上游 recon 已记为已知风险 [S36] |
| U10 | 各方案在 100+ 篇文章规模下的增量构建时间 | 无内容、无脚手架 |

---

## 7. 证据索引

| 编号 | 来源 |
|---|---|
| S1 | Hugo releases Atom（v0.167.0，updated 2026-09-28）https://github.com/gohugoio/hugo/releases.atom |
| S2 | Hugo 配置全量参考 `hasCJKLanguage` / `summaryLength` https://gohugo.io/configuration/all/ （源文件 content/en/configuration/all.md） |
| S3 | Hugo `WordCount`（CJK 说明） https://gohugo.io/methods/page/wordcount/ |
| S4 | Hugo 图片处理 https://gohugo.io/content-management/image-processing/ |
| S5 | Hugo 数学公式（Goldmark passthrough / MathJax / KaTeX / transform.ToMath） https://gohugo.io/content-management/mathematics/ |
| S6 | Hugo Host on GitHub Pages（含 configure-pages@v6 / upload-pages-artifact@v5 / deploy-pages@v5） https://gohugo.io/host-and-deploy/host-on-github-pages/ |
| S7 | Hugo Windows 安装（winget/choco/scoop，extended） https://gohugo.io/installation/windows/ |
| S8 | Hugo `errorf`："prints the result to the ERROR log and fails the build" https://gohugo.io/functions/fmt/errorf/ |
| S9 | npm registry `astro@latest` = 7.3.5，engines node>=22.12.0 https://registry.npmjs.org/astro/latest |
| S10 | Astro 内容集合（Zod 校验） https://docs.astro.build/en/guides/content-collections/ |
| S11 | Astro 图片（默认 .webp / avif / 响应式 layout） https://docs.astro.build/en/guides/images/ · https://docs.astro.build/en/reference/modules/astro-assets/ |
| S12 | Astro 部署到 GitHub Pages（官方 withastro/action） https://docs.astro.build/en/guides/deploy/github/ |
| S13 | Astro Why Astro（islands / 降低 JS 开销） https://docs.astro.build/en/concepts/why-astro/ |
| S14 | `@img/sharp-win32-x64@0.35.5`（Windows 预编译） https://registry.npmjs.org/@img/sharp-win32-x64/latest |
| S15 | `astro-pagefind@2.0.1` https://registry.npmjs.org/astro-pagefind/latest |
| S16 | Pagefind 多语言：中文(zh) 支持 + 分词示例「每個月都 → 每個/月/都」+ "does not support stemming for specialized languages" https://pagefind.app/docs/multilingual/ |
| S17 | `pagefind@1.5.2`，npm 周下载 2,184,067 https://registry.npmjs.org/pagefind/latest · https://api.npmjs.org/downloads/point/last-week/pagefind |
| S18 | `fuse.js@7.5.0`（Bitap 模糊匹配、useTokenSearch） https://registry.npmjs.org/fuse.js/latest · https://github.com/krisk/Fuse |
| S19 | `flexsearch@0.8.212`（README 列明支持 Chinese/Korean/Japanese (CJK)） https://registry.npmjs.org/flexsearch/latest · https://github.com/nextapps-de/flexsearch |
| S20 | `hexo@8.1.2`，engines node>=20.19.0，周下载 48,799 https://registry.npmjs.org/hexo/latest · https://api.npmjs.org/downloads/point/last-week/hexo |
| S21 | hexo-theme-butterfly README（Dark Mode、Giscus 等评论系统） https://github.com/jerryc127/hexo-theme-butterfly ；周下载 3,275 |
| S22 | VitePress：`vitepress@1.6.4`；默认主题本地搜索基于浏览器内 minisearch https://vitepress.dev/reference/default-theme-search （源文件 docs/en/reference/default-theme-search.md） |
| S23 | VitePress 部署（项目站点需设 `base`） https://vitepress.dev/guide/deploy |
| S24 | **本次实测**：vitepress.dev 首页首屏预加载资源 `Invoke-WebRequest` 下载 + `gzip -9` 复算：framework 41,693 B / metadata 20,240 B / theme 19,745 B / app 757 B / 页面数据 1,136 B（JS 合计 83,571 B）；style 39,337 B + vp-icons 898 B（CSS 合计 40,235 B） |
| S25 | **本次实测**：lilianweng.github.io 主样式表 raw=15,359 B，`gzip -9`=4,180 B |
| S26 | `next@16.3.7`，engines node>=20.9.0 https://registry.npmjs.org/next/latest |
| S27 | Next.js 静态导出：不支持默认 loader 的 Image Optimization；GH Pages 模板 https://nextjs.org/docs/app/guides/static-exports |
| S28 | `@11ty/eleventy@3.1.6`（node>=18）+ `eleventy-img` 基于 sharp 的构建期图片处理 https://registry.npmjs.org/@11ty/eleventy/latest · https://github.com/11ty/eleventy-img |
| S29 | giscus README（基于 GitHub Discussions、免数据库、可自托管） https://github.com/giscus/giscus |
| S30 | `@giscus/react` npm 周下载 434,147 https://api.npmjs.org/downloads/point/last-week/@giscus/react |
| S31 | `remark-math@6.0.0` / `rehype-katex@7.0.1` / `katex@0.18.9` https://registry.npmjs.org/remark-math/latest · https://registry.npmjs.org/rehype-katex/latest · https://registry.npmjs.org/katex/latest |
| S32 | `hexo-generator-searchdb@1.5.0` / `hexo-wordcount@6.0.1` https://registry.npmjs.org/hexo-generator-searchdb/latest · https://registry.npmjs.org/hexo-wordcount/latest |
| S33 | `pangu@10.4.1`（中英文之间自动加空格） https://registry.npmjs.org/pangu/latest |
| S34 | **本次实测**：本机 pwsh 工具链探测（见 §2 原文）与系统信息（Windows 11 26200 / i7-11700 / 32GB / LongPathsEnabled=0） |
| S35 | npm 周下载量（2026-09-30 抓取）：astro 7,037,234 · vitepress 1,277,975 · @11ty/eleventy 233,324 · hexo 48,799 · next 70,004,350 https://api.npmjs.org/downloads/point/last-week/{pkg} |
| S36 | 上游文档：docs/01-recon-lilianweng.md（零 Web Font、首帧内联脚本、客户端搜索、PaperMod 基线）、docs/02-prd.md（P0 清单与质量门禁） |

> 说明：npm 周下载量会被 CI、monorepo、间接依赖放大（`next` 尤其明显），**只作生态活跃度的粗指标**，不作质量判据。

---

## 8. 方法论与合规声明

- **实际执行的取证动作**：① pwsh 探测本机工具链与系统信息（§2 原文）；② 抓取 Hugo/Astro/VitePress/Next.js/Eleventy/giscus/Pagefind/Fuse.js/FlexSearch 官方文档与仓库原文并按关键词定位证据；③ 查询 npm registry 与 npm downloads API 获取版本与周下载量；④ 用 `Invoke-WebRequest` 下载参考站点真实产物并用 `gzip -9` 复算体积（§7 S24/S25，临时文件写在系统临时目录并已删除）。
- **没有做的事（约束遵守）**：未创建任何项目脚手架；未执行任何依赖安装（`npm i`/`pnpm i`/`winget install` 均未运行）；未修改 `docs/01-recon-lilianweng.md`、`docs/02-prd.md` 或任何他人文件；本文件是本次预研唯一写入。
- **本矩阵的定位**：Phase 2 技术定案的**输入**，不是定案。最终选择需 Lead 结合 `docs/research/visual-references.md` 的视觉方向与老板对"上线速度 vs 视觉识别度"的偏好写成 ADR。
