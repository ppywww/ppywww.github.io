# ppy-Blog

> 个人综合博客：记录技术、生活与读书。基于 **Astro v7 + npm**，纯静态，部署在 GitHub Pages。
> 线上地址：<https://ppywww.github.io>

---

## 1. 技术栈与硬约束

| 项 | 选型 |
|---|---|
| 生成器 | Astro v7（`output: 'static'`） |
| 内容模型 | Content Collections + Zod（`src/content.config.ts`） |
| 样式 | **原生 CSS + CSS 变量**，零 CSS 框架、零 Web Font |
| 部署 | GitHub Actions → GitHub Pages |
| 包管理 | npm（仓库含 `package-lock.json`） |
| Node | **>= 22.12.0**（本机验证版本 v24.19.0） |

硬约束（不要违反）：

- 站点是 **用户站点**（仓库名 `ppywww.github.io`），页面走**根路径**，因此 `astro.config.mjs` **不设 `base`**。
- 不引入 Tailwind / 任何 CSS 框架；首屏 CSS（gzip）必须 < 25KB。
- 不引入 Web Font；字体只用系统栈。
- 组件只准引用**语义层** token（`--color-*`），禁止直接写裸色值或 `--palette-*`。
- 靛蓝强调色只允许出现在「链接 / 当前导航项 / 按钮」三处。

---

## 2. 本地开发

```bash
# 0) 环境：Node >= 22.12.0
node -v

# 1) 安装依赖（首次 / 依赖变更后）
npm install

# 2) 启动开发服务器 → http://localhost:4321
npm run dev

# 3) 生产构建（产物在 dist/）
npm run build

# 4) 本地预览构建产物 → http://localhost:4321
npm run preview
```

---

## 3. 发布：三步流程

> 目标（PRD G5）：写文章 → 提交 → 自动上线，**不超过 3 步**。

```bash
# 第 1 步：写文章
#   src/content/posts/YYYY-MM-DD-slug.md
#   （或 Page Bundle：src/content/posts/YYYY-MM-DD-slug/index.md + 同目录图片）

# 第 2 步：本地自检（强烈建议，CI 也是同一条命令）
npm run build

# 第 3 步：提交并推送
git add . && git commit -m "post: 文章标题" && git push
```

推送后 GitHub Actions 自动构建并发布，通常 1–2 分钟上线。
在仓库 **Actions** 页可看构建日志；失败时错误会直接指出是哪个文件的哪个字段不合法。

### 首次部署前的一次性设置

1. 仓库 `ppywww.github.io` → **Settings → Pages**
2. **Source** 选择 **GitHub Actions**（不要选 "Deploy from a branch"）
3. 之后每次 push 到 `main` 会自动发布；也可在 Actions 页用 **Run workflow** 手动触发

> 🔒 **凭据安全**：本项目的首次 `git push` 由仓库所有者在**本机**通过浏览器授权（Git Credential Manager）完成。任何 Agent 都不应持有密码或 Token。

---

## 4. 写一篇新文章

Front-matter 契约（**冻结项**，唯一真相源是 `src/content.config.ts`）：

```yaml
---
title: "文章标题"                 # 必填
date: 2026-09-30T14:00:00+08:00   # 必填，带时区
lastmod: 2026-10-02T09:00:00+08:00 # 选填，有值则显示「更新于」
draft: false                      # 选填，默认 false；true 不进生产构建
description: "一句话摘要，用于列表卡片与 SEO"  # 必填
categories: ["技术"]               # 必填，枚举：技术 / 生活 / 读书 / 作品
tags: ["Astro", "性能优化"]         # 选填
series: "从0搭建个人博客"           # 选填
cover: "/images/cover/xxx.webp"   # 选填
toc: true                         # 选填，默认 true
comments: false                   # 选填，默认 false
math: false                       # 选填，默认 false
---
```

**分类写错会直接构建失败**（这是设计如此，用于保证分类页只有 4 个合法栏目）。

文件命名：`YYYY-MM-DD-slug.md`，slug 用英文小写 + 连字符。

---

## 5. 目录结构

```
personal-blog/
├─ src/
│  ├─ consts.ts             # 站点配置唯一真相源（站名/描述/作者/导航/分类枚举）
│  ├─ content.config.ts     # Front-matter 契约（Zod schema）
│  ├─ content/
│  │  ├─ posts/             # 文章
│  │  ├─ works/             # 作品
│  │  └─ pages/             # 独立页（关于我）
│  ├─ components/           # Header / Footer / PostCard / ThemeToggle
│  ├─ layouts/              # BaseLayout（SEO + 零闪烁深色模式）
│  ├─ pages/                # 路由
│  ├─ lib/                  # reading-time.ts / date.ts
│  └─ styles/               # tokens.css / base.css
├─ public/                  # favicon 等静态资源
├─ .github/workflows/deploy.yml
└─ astro.config.mjs
```

---

## 6. 当前进度（诚实清单）

已就绪：脚手架、设计 token、front-matter 契约、首页、深色模式、Pages 部署管线。

**尚未实现**（后续里程碑）：文章详情页 / 归档 / 分类 / 标签 / 搜索（Pagefind）/ RSS / 关于 / 作品页 / 404 / Giscus / sitemap。
