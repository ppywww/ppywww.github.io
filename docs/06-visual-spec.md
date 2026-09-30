# 06 · 视觉定稿 v1.0（对齐 Lil'Log / PaperMod 灰阶）

| 项 | 内容 |
|---|---|
| 版本 | v1.0（落档即定稿，等老板点头后执行） |
| 日期 | 2026-09-30 |
| 上游依据 | `docs/01-recon-lilianweng.md` §2 + **线上唯一 CSS bundle 实测**（`stylesheet.min.8e2f522e…css`，站点与仓库两处逐字节一致） |
| 取代 | `00-decision-log.md` **B-01（墨蓝极简）** · `04-design-system.md` 中与之冲突的硬规则 |
| 状态 | ⏳ 待老板确认 |

---

## 0. 一句话

全站换成 PaperMod 的**纯灰阶体系（删除强调色）**，布局 / 间距 / 圆角 / 字号逐值对齐；中文排版只保留**正文行高 1.75** 一项偏离；社交入口 = **GitHub · RSS · X**（3 个）。

---

## 1. 色板（替换 `tokens.css` 原始层 + 语义层）

### 1.1 原始层 `--palette-*`

`@
--palette-white:        #FFFFFF
--palette-gray-50:      #F5F5F5   列表页底色 / 行内代码底（原站同一个 token 兼任两职，我们拆成语义层两个）
--palette-gray-100:     #EEEEEE   边框
--palette-gray-300:     #D6D6D6   tertiary（分隔、禁用）
--palette-gray-400:     #AAAAAA   链接 hover（原站硬编码，亮暗同值）
--palette-gray-500:     #6C6C6C   secondary（元信息、摘要）
--palette-gray-800:     #333333   暗色边框
--palette-gray-900:     #1F1F1F   正文
--palette-gray-950:     #1E1E1E   主文字 / 标题（原站 --primary）
--palette-ink-950:      #1D1E20   暗色页面底
--palette-ink-900:      #2E2E33   暗色卡片底 / 暗色代码块底
--palette-ink-700:      #414244   暗色 tertiary
--palette-ink-400:      #9B9C9D   暗色 secondary
--palette-ink-200:      #C4C4C5   暗色正文
--palette-ink-100:      #DADADB   暗色主文字
--palette-code-bg:      #F5F5F5   行内代码底
--palette-code-block:   #1C1D21   代码块底（亮色模式下也是深色 → 与 G-04 冲突，见 §5）
`@

**注**：原站 `--primary`(#1E1E1E) 与 `--content`(#1F1F1F) 是差 1 度的两个值，无感知差异 —— 我们**合并为一个 `--color-text`**。

### 1.2 语义层 · 亮色

| Token | 值 | 用途 |
|---|---|---|
| `--color-bg` | `#FFFFFF` | 文章详情页底色 |
| `--color-bg-list` | `#F5F5F5` | **列表类页面**底色：首页 / 文章列表 / 归档 / 标签 / 分类（原站 `.list`） |
| `--color-surface` | `#FFFFFF` | 卡片底色 |
| `--color-surface-2` | `#F5F5F5` | 标签底、悬停底 |
| `--color-text` | `#1E1E1E` | 标题 / 正文 |
| `--color-text-secondary` | `#6C6C6C` | 摘要、元信息、图标 |
| `--color-text-tertiary` | `#D6D6D6` | 分隔符、禁用态 |
| `--color-border` | `#EEEEEE` | 卡片边框、页头底线 |
| `--color-link-hover` | `#AAAAAA` | 链接 hover |
| `--color-code-bg` | `#F5F5F5` | 行内代码底 |
| `--color-code-block-bg` | `#1C1D21` | 代码块底（见 §5 第 3 条） |
| `--color-focus` | `#1E1E1E` | **焦点环**（替代原 `--color-accent`） |

### 1.3 语义层 · 暗色

| Token | 值 |
|---|---|
| `--color-bg` | `#1D1E20` |
| `--color-bg-list` | `#1D1E20`（原站暗色下列表页切回 `--theme`，与文章页同色） |
| `--color-surface` | `#2E2E33` |
| `--color-surface-2` | `#37383E` |
| `--color-text` | `#DADADB` |
| `--color-text-secondary` | `#9B9C9D` |
| `--color-text-tertiary` | `#414244` |
| `--color-border` | `#333333` |
| `--color-link-hover` | `#AAAAAA`（照抄，两主题同值） |
| `--color-code-bg` | `#37383E` |
| `--color-code-block-bg` | `#2E2E33` |
| `--color-focus` | `#DADADB` |

### 1.4 强调色：**删除**

- `--color-accent` / `--color-accent-text` / `--color-on-accent` / `--palette-indigo-*` **全部移除**（原站 CSS 中不存在任何强调色 token，实测确认）
- 正文链接 = `--color-text` + **常驻 1px 下划线**，hover 变 `--color-link-hover`
- 导航当前项 = `font-weight: 500` + `border-bottom: 2px solid currentColor`（**不再用颜色标记**）
- 焦点环改用 `--color-focus`（仍是 2px 实线，无障碍要求不降级）

---

## 2. 排版尺度

| 角色 | 值 | 说明 |
|---|---|---|
| 正文 | 16px / **1.75** | 原站 1.6 —— **唯一不抄的排版参数**（见 §5.1） |
| 首页问候 `h1` | **34px** / 1.3 / 700 | 原站 `.first-entry h1` |
| 文章页标题 | **36px** / 1.3 / 700 | 原站 `.post-title` |
| 列表 / 归档 / 标签页 `h1` | **40px** / 1.2 / 700 | 原站 `.page-header h1` |
| 卡片标题 | **24px** / 1.3 / 700 | 现在是 18.4px / 600，**这是"列表被压平"的主因** |
| 卡片摘要 | **14px** / 1.6 / 2 行截断 | 现在实际是 16px |
| 卡片元信息 | **13px** | 现在实际是 14px |
| 正文内 `h2` / `h3` | 24px / 19px | 对齐原站的浏览器默认比例（1.5em / 1.17em） |
| 导航项 | **16px**；当前项 500 + 2px 下划线 | 现在 15px + 靛蓝 600 |
| logo / 站名 | **24px / 700** | 现在 17px |
| 标签 | 13px | 不变 |

**标题字重统一改 700**（原站未声明字重 → 浏览器默认 bold；现规范是 600）。

---

## 3. 布局与组件

| 项 | 值 | 备注 |
|---|---|---|
| 内容列宽 | **720px**（外层 `max-width: 768px` + `padding: 24px`） | 首页此前撑满 1080 容器 → 最大差距 |
| 导航列 / 页脚宽 | **1024px** | |
| 页头高 / 页脚高 | 60px / 60px | 现在 64px |
| 间距基准 | `--gap: 24px`；`≤768px` → **14px** | 现在 20/24 混用 |
| 圆角 | **8px**（全站，含卡片与控件） | 规范 §444 的"≤6px"作废 |
| 卡片 | 白底 + `1px solid #EEEEEE` + **无阴影** + padding 24 + 卡间距 24 | 现在有 `--shadow-card` |
| 卡片交互 | `transition: transform .1s` + `:active { transform: scale(.96) }`，**无 hover 态** | 照抄 |
| 卡片可点区 | **整卡可点**（overlay 链接铺满），标题链接为唯一可聚焦链接，标签 `z-index` 置顶保持可点 | 现在只有标题可点 |
| profile 区 | **无边框透明块**（无背景 / 无圆角 / 无 padding）；上 24px、下 48px | 规范 §1065 的"卡片"作废 |
| profile 内容 | 问候 `h1` + 一句话（16px）+ 图标行；**默认不放头像** | 原站 welcome 区无头像 |
| 页头 | `position: sticky` + `1px solid #EEEEEE` 底线 | **故意偏离**，见 §5.2 |
| 元信息分隔符 | `\|`（现在用 `·`） | 例：`2026-09-30 \| 12 分钟 \| 技术` |
| 空态 | **去掉虚线框**，改一行文案 + 一个出口链接（"关于我"） | 现在违反规范 §1068（缺出口链接、主文案字号过大） |

---

## 4. 社交图标行

**3 个图标，顺序：GitHub · RSS · X**（能正常访问的两个在前；X 在大陆需代理，放最后）。

最终数据（`consts.ts` 的 `SOCIAL`）：

`@ts
{ label: 'GitHub', href: 'https://github.com/ppywww', icon: 'github' }
{ label: 'RSS',    href: '/rss.xml',                  icon: 'rss'    }
{ label: 'X',      href: 'https://x.com/ppy00111404', icon: 'x'      }
`@

**已剔除**：微信 / QQ（老板决定不做）· Facebook（2026-09-30 撤除 —— 该链接会跳转到 `facebook.com/people/<真名>/pfbid…`，暴露姓名，与 `00-decision-log.md` D5「不公开真名」冲突）。

| 项 | 值 |
|---|---|
| 尺寸 | **26 × 26 px** |
| 间距 | **12px**（`a:not(:last-of-type) { margin-inline-end: 12px }`，`a` 设 `display: inline-flex` 以消除源码换行空白） |
| 上下留白 | `padding: 12px 0` |
| 颜色 | `--color-text-secondary`（hover → `--color-text`） |
| 图标风格 | **实心官方 mark**（Simple Icons 单路径，内联 SVG，不引图标库） |
| 链接属性 | `target="_blank" rel="noopener noreferrer me"` + `aria-label`（平台名） |
| 数据结构 | **不变**：`{ label, href, icon }`（微信 / QQ / Facebook 均不在列，无需扩展类型） |

**关于描边 vs 实心**：原站用 `stroke-width: 2 / fill: none` 的描边风格，但 **X 的 logo 只有实心字形**，混用比统一实心更伤观感 —— 故统一实心，靠灰色把视觉重量压下来。尺寸/间距/颜色/位置四项与原站完全一致。

**素材已齐**：X = `https://x.com/ppy00111404`（2026-09-30 实测 200，显示名 `ppy001`，无隐私风险）；RSS 指向 `/rss.xml`。

---

## 5. 故意不抄的 7 条（附理由）

| # | 项 | 原站 | 我们 | 理由 |
|---|---|---|---|---|
| 1 | 正文行高 | 1.6 | **1.75** | 中文方块字需要更大行距；PRD G2 硬约束 |
| 2 | 页头 | 无 sticky、无底线 | **sticky + 1px 底线** | 长文导航/搜索/返回的可用性，非风格问题 |
| 3 | 代码块 | 亮色模式下也是深底 `#1C1D21` | **保留 G-04 双主题** | 既有裁决；双语系阅读一致性。**可推翻** |
| 4 | 暗色挂载点 | `.dark` 挂 `<body>` | 挂 `<html>`（现状） | 首帧前消除闪烁，实现细节不影响观感 |
| 5 | 主题切换按钮位置 | 紧贴 logo | **页头右侧**（现状） | PRD §5 规定"搜索图标 + 主题切换"同区 |
| 6 | 图标风格 | 描边 2px | **实心官方 mark** | X 无描边版本，见 §4 |
| 7 | hover 反馈 | 导航/卡片无 hover | **保留导航与链接 hover** | 对齐不必对到"删掉可用性反馈"；卡片的 `:active` 缩放照抄 |

---

## 6. 施工顺序（3 个 Commit）

| # | 范围 | 文件 | 结果 |
|---|---|---|---|
| 1 | 换肤 | `src/styles/tokens.css`（整体替换）、`src/styles/base.css`（改色/圆角/字号/间距引用） | 全站立刻变灰阶，结构不动 |
| 2 | 首页骨架 | 新建 `src/components/ProfileCard.astro`；改 `src/pages/index.astro`、`BaseLayout.astro`（列表页 body class） | 720 列宽 + 透明 profile 块 + 空态修正 |
| 3 | 列表与社交 | 新建 `src/components/SocialIcons.astro`；改 `PostCard.astro`、`Footer.astro` | 整卡可点 + 元信息 13px + 图标行 |

**验证**：`npm run build` 通过 + 亮/暗两套截图对比。（注：本机 pwsh 沙箱存在 ACL 故障 `grantWrite(E:\DPH_Projects)`，需先修复才能跑构建。）

---

## 7. 连带文档变更

| 文档 | 变更 |
|---|---|
| `00-decision-log.md` | B-01 标注**已废止**；新增 **B-05 视觉方向 = 对齐 Lil'Log 灰阶**；T-02 修订为"借鉴结构 + 对齐视觉 token" |
| `04-design-system.md` | §288（字号上限 30px）**作废**；§444（圆角 ≤6px）→ 8px；§586 卡片标题 → 24px；§1065 `.profile-card` → 透明块、无头像；§523 保留 sticky（标注偏离） |
| `01-recon-lilianweng.md` | §0 "黑白灰加一个**酒红**点缀" → **订正**为"纯灰阶、无强调色"（实测 CSS 中不存在酒红，唯一痕迹是 favicon 文件名） |
| `02-prd.md` §7.1 | 个人卡片的"头像"一项标注为**本轮不做**（D5 不再阻塞） |

---

## 8. 待办清单

- [ ] 老板确认本方案
- [x] 社交素材已确认：X = `https://x.com/ppy00111404`；**不含 Facebook**（撤除，理由见 §4）
- [ ] 素材已齐，无阻塞项
- [ ] （可选）头像：默认不放；要放的话是唯一"加了不破坏风格"的增项
- [ ] （可选）首页问候语：默认 `👋 Welcome to ppy-Blog`，与 B-04 的英文一句话保持一致；可一句话替换
- [x] pwsh 沙箱 ACL 已修复（2026-09-30，受限模式重跑命令成功）
- [ ] ⚠️ **本会话受限 shell 仍写不进 `personal-blog/`**（令牌为 Low 完整性；沙箱授权只落在工作区根目录及此后新建的目录，未覆盖已存在的 `personal-blog` 子树。Python 与 PowerShell 均复现 `Permission denied`）。另一个会话可以正常写入（`.astro` 18:26 / `dist` 18:39 由其它进程生成），故属**本会话授权范围**问题：需要我在本地跑构建验证时，把本会话切「完全权限」即可

---

## 9. 站点图标 favicon（方案 E · 2026-09-30 老板选定）

| 项 | 值 |
|---|---|
| 方案 | **E**：头部 + 双耳方形裁切 + **1px 白描边** |
| 源图 | ⚠️ **待落位**：目前在 `E:\DPH_Projects\_scratch\stitch-src.png`；目标位置 `personal-blog/assets/favicon/stitch-source.png`（518×717，白底，换成更好的原图后重跑脚本即可）。**复制进仓库这一步被沙箱拒绝写入，需先在实施会话切「完全权限」** |
| 处理链路 | ① 去背（源图若已带 alpha 则跳过）→ ② 取 **alpha 包围盒的左上角正方形**（实测 `(6,8,507,509)`，即头 + 双耳）→ ③ 缩放到目标尺寸 → ④ **在该目标尺寸上**加 1px 白描边 |
| 关键细节 | 描边必须在**目标尺寸**生成。在大图上描边再缩小，16px 下会变成亚像素而消失 |
| 产出（`public/`） | `favicon.ico`(16/32/48 三尺寸) · `favicon-16x16.png` · `favicon-32x32.png` · `favicon-192.png` · `favicon-512.png` · `apple-touch-icon.png`(180，**不透明白底、不预圆角** —— iOS 会把透明区填黑) |
| 参考实现 | `E:\DPH_Projects\_scratch\make_preview.py`（去背 / 裁切 / `halo()` 均已跑通，可直接改写为 `scripts/build-favicon.py`） |
| HTML | `BaseLayout.astro`：`<link rel="icon">` 换成 ico + 16/32 png + apple-touch-icon；删除 `public/favicon.svg`（旧蓝色 P） |

**选型依据**（5 方案实测对比见 `_scratch/favicon-preview.png`）：A 保留白底 → 深色标签栏里是一个白方块；B 全身抠图 → 等比缩放后只有约 11×16px，16px 下糊成一团；C 头+耳 → 可辨，但深色栏下对比度不足；D 白底板 → 醒目，但浅色栏里底板消失、且压缩角色尺寸；**E 在深浅两种标签栏下都成立，且不需要维护两套图标**。

> 版权提示：史迪仔为迪士尼角色。个人站点自用；不要用于商用或周边。

---

## 附录 A · 实测来源与未确认项

**来源**：线上唯一样式表 `/assets/css/stylesheet.min.8e2f522e170c601ef0b359b6e27078d17e3020e1f4d928afdff4dae588c1e9e4.css`，从线上站点与 GitHub 仓库分别抓取、内容逐字节一致；HTML 结构取自 `index.html`。色值与上游 PaperMod 默认值逐字相同 → 主题色板零定制。

**未确认（不影响本方案）**：

1. `h1` / `h2` 的 `font-weight` 在 CSS 中**未声明**，本方案的 700 是按浏览器默认值（bold）推导
2. `favicon_wine.ico` 的具体色值未能解码（二进制）—— 但 CSS 中无酒红，故对色板无影响，**不追**
3. 页头 60px 由 `--header-height` + `.nav { line-height }` 推导，非渲染实测
4. 社交图标间除 CSS 的 12px 外，原站源码换行空白另叠约 4–5px（我们显式用 `inline-flex` 消除该不确定性）
