---
title: "从 0 搭建这个博客：选型、目录与实测数据"
date: 2026-09-30T14:00:00+08:00
lastmod: 2026-09-30T16:00:00+08:00
draft: false
description: "记录本站从选型到骨架跑通的真实过程：Astro、Hugo、VitePress 的实测对比结论、最终目录结构，以及构建产物的真实体积数据。"
categories: ["技术"]
tags: ["Astro", "静态站点", "性能优化", "GitHub Pages"]
series: "从 0 搭建个人博客"
toc: true
comments: false
math: false
---

> 这篇文章记录本站（个人博客）从选型到骨架跑通的真实过程。文中的数据来自项目的选型矩阵、架构决策记录与本机构建产物的实测；凡是还没验证的部分，都会明确写「未验证」。

## 先说结论

- **生成器**：Astro v7.3.5 —— 候选里唯一能「用 schema 声明 Front-Matter 契约、构建期直接报错」的方案。
- **中文搜索**：Pagefind v1.5.2，按页面的 `lang` 标注做中文分词。
- **样式**：原生 CSS + CSS 变量，零 CSS 框架、零 Web Font。
- **包管理**：npm（本机已装 11.17.0），不引入 pnpm。
- **兜底**：Hugo v0.167.0，并设了一道一天之内触发的时间闸门。

## 为什么先做选型

个人博客看着只是「挑个框架写文章」，实际有三个绕不开的硬约束，它们直接决定后期的返工量：

1. **首屏 JS 要少**：博客是纯静态内容，读者打开就该看到字，而不是等运行时加载完。
2. **中文要能用**：搜索要能分词，阅读时长要按汉字估算，摘要截断不能把汉字切断。
3. **构建期要能报错**：分类写错、字段缺失，应该在 CI 日志里一眼看到文件名和字段名。

把这三条写成可验收的门禁之后，选型就不太会摇摆：

| 门禁 | 阈值 |
| --- | --- |
| 首屏 JS（gzip） | < 30KB |
| 首屏 CSS（gzip） | < 25KB |
| Web Font 请求数 | 0 |
| 构建时间 | < 60s |

## 候选与实测结论

### 对比矩阵

5 个候选按 8 个维度（中文内容工程、站内搜索、深色模式、评论、视觉定制、工程管线、部署、长期维护成本）加权打分，结果是：

| 方案 | 版本 | 加权得分 | 结论 |
| --- | --- | --- | --- |
| Astro | v7.3.5 | **4.35** | **选定** |
| Hugo | v0.167.0 | 4.10 | 备选，同时作为兜底 |
| Hexo | v8.1.2 | 3.35 | 不选：定制等于改主题源码 |
| Next.js 静态导出 | v16.3.7 | 3.25 | 不选：运行时对博客是纯负债 |
| VitePress | v1.6.4 | 3.20 | 不选：首屏 JS 实测超标 |

### VitePress 是怎么被淘汰的

这是全流程里最有价值的一次实测。做法很土：把官方文档站首页的首屏预加载资源抓下来，再逐个用 `gzip -9` 复算体积。

```text
# vitepress.dev 首页首屏资源，gzip -9 复算（实测）
framework    41,693 B
metadata     20,240 B
theme        19,745 B
app             757 B
页面数据        1,136 B
-------------------------
JS 合计      83,571 B ≈ 81.6 KiB   # 单项就超过 30KB 门禁
CSS 合计     40,235 B ≈ 39.3 KiB   # 同样超过 25KB 门禁
```

> 这不是「VitePress 不好」，而是它的默认形态是文档站：只要带着 Vue 运行时和客户端水合，就得先付 41.7 KiB 的底。拿它做博客不是不行，而是要先自研一套轻主题，才可能达到门禁。

### Hugo 为什么只是备选

从落地风险看，Hugo 其实是最低的：单个 exe，没有 `node_modules`，没有二进制下载；中文有内置的 `hasCJKLanguage` 开关，图片处理与数学公式都在核心里。

但对我来说有两处更贵：

- 组件化能力弱，Go template 的学习曲线会拖慢整个骨架阶段；
- Front-Matter 的强校验要用模板加 `errorf` 复刻，而不是写一段 schema。

所以结论是：**综合最优选 Astro，落地风险最低的是 Hugo**，并把 Hugo 留作兜底——如果一天之内做不到「本地构建成功 + 线上可见」，就立刻切换，不在依赖问题上纠缠。

## 目录结构

约定很简单：内容、组件、布局、样式、路由各占一层，站点级配置只有两个文件。

```text
personal-blog/
├─ astro.config.mjs          # site / output / build.format
├─ package.json              # 依赖只有 astro 一个
├─ public/
│  └─ favicon.svg
├─ src/
│  ├─ consts.ts              # 站点名 / 副标题 / 导航 / 分类枚举（唯一真相源）
│  ├─ content.config.ts      # Front-Matter 契约（Zod schema）
│  ├─ content/
│  │  ├─ posts/              # 文章：YYYY-MM-DD-slug.md
│  │  ├─ works/              # 作品条目
│  │  └─ pages/              # 独立页（关于等）
│  ├─ components/
│  ├─ layouts/
│  ├─ lib/                   # date.ts / reading-time.ts
│  ├─ pages/                 # 路由
│  └─ styles/                # tokens.css / base.css
└─ .github/workflows/deploy.yml
```

两条原则值得单独说：

1. **站点文案只有一个出处**：站点名、副标题、导航、分类枚举都放在 `src/consts.ts`，页面只引用、不复制。
2. **内容契约只有一个出处**：字段与取值约束写在 `src/content.config.ts`，分类只能是「技术 / 生活 / 读书 / 作品」之一，写错就在构建期失败。

### 内容契约长什么样

```ts
const postSchema = z.object({
  title: z.string().min(1, "title 必填"),
  date: z.coerce.date(),
  description: z.string().min(1, "description 必填"),
  categories: z.array(z.enum(CATEGORIES)).min(1),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  toc: z.boolean().default(true),
});
```

## 两件必须自己写的东西

Astro 把内容层做得很好，但有两件事它不提供，得自己补。

### 深色模式：一段首帧内联脚本

主题必须在第一帧之前定下来，所以这段脚本要内联在 `<head>` 里、所有样式表之前。关键点是必须显式声明为内联脚本，否则会被打包成延迟执行的模块，白闪就回来了：

```html
<script is:inline>
  (function () {
    var KEY = "ppy-blog-theme";
    var el = document.documentElement;
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { /* 隐私模式：忽略 */ }
    var prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = (saved === "dark" || saved === "light") ? saved : (prefersDark ? "dark" : "light");
    if (theme === "dark") el.classList.add("dark");
    el.style.colorScheme = theme;   /* 原生控件与画布底色同步 */
  })();
</script>
```

还有一条容易被忽略的纪律：CSS 里**不写** `@media (prefers-color-scheme: dark)`。跟随系统只在内联脚本里判断一次，否则 JS 与 CSS 两套判断会打架。

### 中文阅读时长：自己数汉字

没有现成的开关，就按「汉字按字计、拉丁文按词计」折算，并且先剔掉代码块与行内代码，避免代码把时长撑爆：

```ts
export function readingTime(text: string, cjkPerMinute = 350, wordsPerMinute = 220): number {
  const { cjk, words } = countUnits(text);   // countUnits 内部已剔除代码与链接语法
  return Math.max(1, Math.round(cjk / cjkPerMinute + words / wordsPerMinute));
}
```

## 构建产物的实测体积

骨架跑通后，直接量 `dist/` 里的真实产物：

| 产物 | 原始体积 | gzip -9 | 对照门禁 |
| --- | --- | --- | --- |
| 首屏 CSS（单个 `dist/_astro/*.css`） | 8,461 B / 8.26 KiB | **2,249 B / 2.20 KiB** | < 25KB，达标 |
| 外部 JS 文件 | **0 个** | — | < 30KB，达标 |
| 首页 HTML | 5,655 B / 5.52 KiB | 2,514 B / 2.45 KiB | — |
| `@font-face` 声明 | **0 处** | — | 0 请求，达标 |

三点说明：

- 「外部 JS 0 个」指产物里没有任何 `script src=...`。页面上只有 3 段内联脚本：首帧主题脚本 730 B、JSON-LD 260 B、主题切换模块 663 B。
- 「零 Web Font」的判据是 CSS 里 `@font-face` 与 `url()` 均为 0 处，字体全部走系统字体栈。
- 以上是骨架阶段的数字。文章详情、归档、搜索等页面上线后，首屏 CSS 还会变大，**最终数字要等完整构建后重新量一次**（未验证）。

## 发布流程只有三步

> 目标：写文章 → 提交 → 自动上线，不超过 3 步。

1. 新建 `src/content/posts/YYYY-MM-DD-slug.md`，按契约写 Front-Matter；
2. 本地跑一次构建自检（CI 跑的是同一条命令）；
3. 提交并推送，剩下的交给 GitHub Actions。

```bash
npm run build      # 本地自检：与 CI 同一条命令
npm run preview    # 预览 dist/ 产物
git add . && git commit -m "post: 文章标题" && git push
```

## 已知代价与未验证项

设计再干净，也要把代价写清楚，否则下一个人会以为它没有成本：

- **深色模式要自己写**：框架没有内置方案，得在 `<head>` 里放一段首帧内联脚本，否则刷新会闪一下。
- **中文阅读时长要自己算**：没有 `hasCJKLanguage` 这类开关，只能按汉字数加英文词数折算。
- **依赖链更长**：`node_modules`、图片处理的原生依赖、搜索索引的二进制都在链上，这是 Astro 相对 Hugo 的固有劣势。
- **未验证清单**：构建耗时、搜索的中文检索质量、完整站点上线后的首屏体积、GitHub Pages 在国内的访问质量。

## 小结

选型最后比拼的不是「谁更先进」，而是「谁更符合自己写下的门禁」。先把门禁量化，再用实测数据去淘汰候选，剩下的那个就是答案；同时提前写死兜底方案与切换时间点，而不是临场决定。
