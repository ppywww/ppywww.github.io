---
title: "ppy-Blog 个人博客"
summary: "一个中文个人综合博客：技术、生活、读书三线并行，纯静态、零 Web Font、零 CSS 框架，部署在 GitHub Pages。"
date: 2026-09-30
stack: ["Astro", "TypeScript", "原生 CSS", "Pagefind", "GitHub Actions"]
repo: https://github.com/ppywww/ppywww.github.io
demo: https://ppywww.github.io
featured: true
draft: false
order: 1
---

本站本身就是第一个作品条目，用来验证作品页的卡片、技术栈标签与外链。

## 是什么

一个中文为主的个人综合博客，内容分技术、生活、读书三条线。不追日更，追求可回看：搜索、归档、分类、标签四路都能到达同一篇文章。

## 技术要点

- **生成器**：Astro v7.3.5，纯静态输出，站点走根路径；
- **内容模型**：Content Collections + Zod，Front-Matter 取值非法时在构建期直接报错；
- **样式**：原生 CSS + 两层 CSS 变量（原始色板 / 语义 token），零 CSS 框架、零 Web Font；
- **性能**：骨架阶段首屏 CSS gzip 约 2.20 KiB，外部 JS 文件 0 个；
- **部署**：GitHub Actions，推送即发布。

## 链接

- 源码：<https://github.com/ppywww/ppywww.github.io>
- 线上：<https://ppywww.github.io>
