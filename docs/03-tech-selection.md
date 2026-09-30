# ADR-001 · 技术方案定案：静态站点生成器选型

| 项 | 内容 |
|---|---|
| 状态 | ✅ **已批准**（2026-09-30）——按 Astro 执行，Gate G1 兜底仍然有效 |
| 日期 | 2026-09-30 |
| 决策人 | Product Manager（Lead），需老板批准 |
| 上游 | `docs/02-prd.md`（已批准）· `docs/research/tech-stack-matrix.md` |
| 影响范围 | M1–M6 全部工程实现 |

---

## 1. 决策

> **选用 Astro v7.3.5 作为静态站点生成器，配合 Pagefind 做站内搜索，部署到 GitHub Pages。**

配套：包管理用 **npm**（本机已装 11.17.0，不引入 pnpm）；样式用**原生 CSS + CSS 变量**（不引入 Tailwind 等框架，保住首屏 CSS < 25KB 门禁）。

---

## 2. 候选与结论

| 方案 | 得分 | 结论 |
|---|---|---|
| **Astro v7.3.5** | **4.35** | ✅ **选定** |
| Hugo v0.167.0 | 4.10 | 备选（兜底方案，见 §6） |
| Hexo v8.1.2 | — | ❌ 定制=改主题源码；主题普遍自带首屏 JS，与 30KB 门禁相冲 |
| VitePress v1.6.4 | — | ❌ **实测硬伤**：官方站首屏预加载 JS gzip **81.6 KiB**，单项即破 PRD 门禁 |
| Next.js v16.3.7 | — | ❌ 静态导出不支持 `next/image` 默认优化；React 运行时对博客是纯负债 |

---

## 3. 为什么是 Astro（五条，均对应 PRD 条款）

| # | 理由 | 对应 PRD |
|---|---|---|
| 1 | **Content Collections + Zod**：用 schema 声明"分类只能是技术/生活/读书/作品"、字段必填，**构建期即校验**。五个候选里唯一能原生表达 PRD §6.2 冻结的 front-matter 契约 | §6.2 · **AC-7** |
| 2 | **islands 架构默认 0 首屏 JS**：纯静态内容不发 JS；对比 VitePress 同位置要付 81.6 KiB | §10 性能门禁 |
| 3 | **构建期图片管线内置**：默认输出 `.webp`、支持 avif 与响应式 `srcset` | P1 F-17 及后续图片需求 |
| 4 | **搜索与部署都是"现成一步"**：`astro-pagefind` + 官方 `withastro/action`；Pagefind 按页面 `lang="zh-CN"` 做中文分词 | F-05 · F-14 |
| 5 | **视觉定制自由度最高**：组件化 + 任意 CSS，是落地「方向 A · 纸感墨色」这类**非模板化设计**的最短路径 | §12.2 · G6 |

**第 6 条现实理由**：本机**已装 node v24.19.0 / npm 11.17.0，未装 go/hugo**。选 Astro 不需要新增任何系统级工具链。

---

## 4. 已知代价与应对（诚实清单）

| # | 代价 | 应对 | 工作量 |
|---|---|---|---|
| C1 | **无内置深色模式**，需自写首帧内联脚本 | recon 文档已有可直接照搬的范式（localStorage 优先 → prefers-color-scheme 回落 → 首帧前置 class） | ~30 行 |
| C2 | **无内置 CJK 阅读时长/词数**（Hugo 有 `hasCJKLanguage` 一个开关） | 自写 CJK 计数工具：中文字符数 + 英文词数 → 分钟数 | ~40 行 |
| C3 | **依赖链最长**：node_modules + sharp + Pagefind 二进制 | 见 §5 风险对策；且设了 §6 的兜底闸门 | — |
| C4 | 无内置分类值校验报错（Astro 用 Zod 反而更强，此项无代价） | — | — |

---

## 5. 环境风险与对策

| 风险 | 实测证据 | 对策 |
|---|---|---|
| **Windows 长路径未启用** | `LongPathsEnabled = 0` | 项目路径 `E:\DPH_Projects\personal-blog` 仅 33 字符，留有充足余量；若 `npm install` 报 `ENAMETOOLONG` → 启用长路径注册表（需管理员）或临时启用 corepack+pnpm |
| 二进制下载失败（sharp / pagefind） | 需首次联网拉取预编译包 | 失败即记录日志 → 触发 §6 兜底闸门，**不纠缠** |
| 构建速度未实测 | 预研禁止安装依赖，无法实测 | PRD 门槛 <60s 对 0–50 篇规模不构成瓶颈，但**这是推断不是证据**；M1 实测并回填 |
| GitHub Pages 国内访问慢 | 已知（recon §8） | 保持纯静态产出 → 未来可一键迁 Cloudflare Pages，迁移成本近零 |

---

## 6. 兜底方案与触发闸门（本项目最重要的风险控制）

> **M1 门禁（Gate G1）**：自脚手架开工起 **一个工作日内**，若无法达成「本地 `npm run build` 成功 **且** 推送到 GitHub Pages 后线上可见」，**立即切换到 Hugo（ADR-002）**，不在 Astro 的依赖问题上继续投入。

切换成本评估：此时尚未写业务页面，仅损失脚手架与配置时间；PRD、设计系统、内容契约**全部可复用**（它们与 SSG 无关）。这是把"选型风险"限制在 1 天内的设计。

> ✅ **Gate G1 已于 2026-09-30 闭环：Astro 定案验证通过，Hugo 兜底方案（ADR-002）不再需要。**
>
> 证据链：① 本地冷构建（删 dist/.astro 后）exit 0，1.33s，远低于 PRD 的 <60s 门槛；② 首次 push 到 `main` 成功，GitHub Actions 部署完成；③ 线上 `https://ppywww.github.io/` 返回 **200**，产物核验：`<title>ppy-Blog</title>`、description 含老板定稿的弯引号文案、canonical 正确、CSS 指纹文件已加载、中文导航 5 项、主题切换按钮存在、**外部脚本 0 个**、空态文案友好、含 skip-link 无障碍入口。
>
> 本项目最大的技术风险（U4 长路径 / U8 依赖兼容 / 部署链路）至此全部证伪或闭环。

---

## 7. 最终技术栈清单

`@
生成器      Astro v7.3.5
内容模型    Astro Content Collections + Zod（强制 front-matter 契约）
样式        原生 CSS + CSS 变量（零 CSS 框架，零 Web Font）
搜索        Pagefind v1.5.2（构建后索引，中文按 lang 分词）
评论        Giscus（front-matter 逐篇开关，全局默认关闭）
图片        astro:assets（构建期 webp/avif + 响应式 srcset）
数学        KaTeX 自托管 —— P1，MVP 不做
深色模式    首帧内联脚本 + CSS 变量（自写）
RSS         @astrojs/rss v4.0.19
部署        GitHub Actions（withastro/action）→ GitHub Pages
包管理      npm 11.17.0（本机已有）
Node        v24.19.0（本机已有，满足 Astro engines >= 22.12.0）
`@

---

## 8. 预定目录结构

`@
personal-blog/
├─ docs/                    # 项目文档（本目录，只增不改他人文件）
├─ src/
│  ├─ content/
│  │  ├─ posts/             # 文章（Page Bundle：index.md + 同目录图片）
│  │  ├─ works/             # 作品
│  │  └─ pages/             # 关于我等独立页
│  ├─ content.config.ts     # Zod schema —— front-matter 契约的唯一真相源
│  ├─ components/           # Header / Footer / PostCard / Toc / ThemeToggle ...
│  ├─ layouts/              # BaseLayout / PostLayout
│  ├─ pages/                # 路由：/ /posts /archives /tags /categories /search /works /about /404
│  ├─ styles/               # tokens.css / base.css / prose.css
│  └─ lib/                  # reading-time.ts 等工具
├─ public/                  # favicon、静态资源
├─ astro.config.mjs
└─ .github/workflows/deploy.yml
`@

---

## 9. 未验证项（沿用预研 §6，M1 回填）

U1 构建速度 · U2 Hugo 兜底路径未验证 · U3 pnpm 未装 · U4 长路径实际影响 · U6 Pagefind 中文检索质量 · U8 Astro v7 与 astro-pagefind v2 兼容性 · U9 GitHub Pages 国内访问质量 · U10 100+ 篇规模增量构建

---

## 10. 批准栏

| 角色 | 意见 | 日期 |
|---|---|---|
| PM（Lead） | 推荐 Astro，理由见 §3，风险已用 §6 闸门兜底 | 2026-09-30 |
| 老板 | ✅ 已批准（选择视觉方向 B、提供 GitHub 账号 ppywww，并指令「先完成 MVP」） | 2026-09-30 |
