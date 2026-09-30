# 发文速查卡 · ppy-Blog

> 给老板本人看的。目标：**3 步发一篇文章，无需理解技术细节。**
> 维护：Product Manager（Lead）· 更新日期 2026-09-30

---

## 一、三步发文

### 第 1 步：新建文件

在 `E:\DPH_Projects\personal-blog\src\content\posts\` 下新建一个 `.md` 文件，文件名格式：

```
YYYY-MM-DD-英文短标题.md
```

例如：`2026-10-05-my-first-post.md`

> 日期前缀**必须**是 `YYYY-MM-DD`（决定 URL 与排序）。短标题用英文小写 + 连字符，不要中文、不要空格。

### 第 2 步：粘贴模板并填写

```markdown
---
title: "文章标题"
date: 2026-10-05T20:00:00+08:00
description: "一句话摘要，40–80 字，会显示在列表卡片和搜索结果里"
categories: ["技术"]
tags: ["Astro", "前端"]
draft: false
---

正文从这里开始。用 Markdown 写。

## 这是二级标题

正文段落。
```

### 第 3 步：发布

```powershell
cd E:\DPH_Projects\personal-blog
git add .
git commit -m "post: 文章标题"
git push
```

推送后约 1 分钟，GitHub 自动构建并上线。**不需要做任何其它操作。**

---

## 二、Front-Matter 字段全表

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | ✅ | 文章标题 |
| `date` | ✅ | **必须带时区**：`2026-10-05T20:00:00+08:00` |
| `description` | ✅ | 摘要 40–80 字。列表页、RSS、搜索都靠它 |
| `categories` | ✅ | **只能是 `技术` / `生活` / `读书` / `作品` 之一**。填错 → 构建失败 |
| `tags` | ⬜ | 自由标签，如 `["Astro", "性能优化"]` |
| `draft` | ⬜ | `true` = 草稿不上线，默认 `false` |
| `lastmod` | ⬜ | 填了会显示「更新于」 |
| `series` | ⬜ | 系列名 |
| `cover` | ⬜ | 封面图路径 |
| `toc` | ⬜ | 是否显示目录，默认 `true` |
| `comments` | ⬜ | 是否开评论，默认 `false` |

---

## 三、写作规范

| 规则 | 说明 |
|---|---|
| **标题层级从 `##` 开始** | `#`（H1）由页面自动生成，正文里不要再写 |
| **摘要必写** | 决定列表卡片和搜索结果的展示文案 |
| **分类四选一** | 技术 / 生活 / 读书 / 作品 |
| 外链直接贴 | 系统自动加安全属性，不用手写 |
| 代码块标语言 | 写 ```ts` 这种，会显示语言标签并高亮 |

---

## 四、图片怎么放（Page Bundle）

```
src/content/posts/
└─ 2026-10-05-my-first-post/
   ├─ index.md          ← 文章本体
   ├─ cover.webp        ← 封面
   └─ diagram.webp      ← 正文插图
```

正文引用：`![示意图](./diagram.webp)`

---

## 五、本地预览（可选）

```powershell
cd E:\DPH_Projects\personal-blog
npm run dev
```

浏览器打开提示地址（通常 http://localhost:4321），改文章自动刷新。`Ctrl+C` 停止。

---

## 六、常见错误

| 症状 | 原因 | 解决 |
|---|---|---|
| 推送后站点没更新 | 构建失败 | 打开仓库 **Actions** 标签页，点红叉那次看报错 |
| 提示 categories 错误 | 分类不在 4 个合法值内 | 改成 技术 / 生活 / 读书 / 作品 |
| 文章没出现 | `draft: true` | 改成 `false` |
| 日期显示不对 | 没带时区 | 写成带 `+08:00` 的形式 |
| 图片不显示 | 路径写错 | 用 Page Bundle，路径写 `./图片名` |
| front-matter 报错 | 少了分隔线 | 开头和结尾都要有 `---` 单独一行 |

---

## 七、发布前自检三条

1. `description` 写了吗？
2. `categories` 是 4 个合法值之一吗？
3. `draft` 是 `false` 吗？

---

## 八、改一次、全站生效的地方

| 想改什么 | 改哪里 |
|---|---|
| 站点名 | `src/consts.ts` → `SITE.title` |
| 副标题（SEO / RSS） | `src/consts.ts` → `SITE.description` |
| 顶部导航 | `src/consts.ts` → `NAV` |
| 社交链接 | `src/consts.ts` → `SOCIAL` |
| 关于我 | `src/content/pages/about.md` |
| 作品 | `src/content/works/` 下增删 `.md` |

**都是一处改、全站生效**，不需要动页面代码。
