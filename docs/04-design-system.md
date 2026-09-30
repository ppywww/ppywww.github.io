# 04 · 设计系统规范 v1.0（方向 B · 墨蓝极简 Ink & Indigo）

| 项 | 内容 |
|---|---|
| 文档版本 | v1.0 |
| 日期 | 2026-09-30 |
| 作者 | design-system（设计系统 Agent） |
| 状态 | ⏳ **待 Lead 复核** —— 复核通过后冻结，作为 M3–M6 全项目视觉唯一规范 |
| 上游 | `docs/00-decision-log.md`（B-01 视觉方向 / V3 两级强调色 / V4 深色策略 / V6 排版）· `docs/02-prd.md` v1.0 · `docs/03-tech-selection.md`（ADR-001）· `docs/research/visual-references.md` §5.0 / §5.2 |
| 下游 | M3 骨架实现 · M4 功能补全 · M5 打磨 · M6 验收 |
| 授权范围 | 本文只描述规范，**不产出任何代码文件**：不创建 `src/`、不落盘 `tokens.css`。§2.4 的 CSS 由 M3 实现者粘贴为 `src/styles/tokens.css` |

> **一致性优先级**：本文与 `00-decision-log.md` §一 冲突时以决策日志为准；本文内部冲突时以 §2 令牌为准。实现时若认为需要偏离本文，先改本文再改代码。

### 一句话总纲

> **中性近白/近黑底 + 单一靛蓝强调色 + 全系统字体栈 + 4px 节奏 + 零装饰阴影**。
> 所有"高级感"来自留白、层级与信息密度，而不是装饰——这是方向 B 抵抗"'又一个技术博客'"的唯一武器。

---

## 0. 给实现者的三条铁律（违反即返工）

1. **只引用语义层**：组件样式里出现 `--palette-*` 即为违规。唯一例外是 `tokens.css` 自身。
2. **零硬编码**：组件 CSS 中不得出现任何硬编码色值（`#xxx` / `rgb()` / `hsl()`）与魔法数字间距；颜色/间距/圆角/字号/动效一律走 token。
3. **状态不全 = 组件未完成**：每个可交互组件必须按 §6 的状态表逐项实现（默认 / hover / focus-visible / active / disabled，或写明"不适用"的理由）。

---

## 1. 设计原则（争议仲裁用）

| # | 原则 | 可判定的落地标准 |
|---|---|---|
| **D1** | **阅读优先** | 任何装饰若降低正文可读性（对比度、行宽、行高），一律否决 |
| **D2** | **强调色是预算，不是装饰** | 靛蓝只回答两个问题："哪里能点"、"当前在哪"；用量见 §2.6 |
| **D3** | **结构靠排版，不靠容器** | 用字号/字重/间距/1px 分隔线建立层级；不加阴影、不套卡片、不加色块 |
| **D4** | **零依赖的克制** | 0 Web Font、0 CSS 框架、0 首屏 JS（主题与必要交互除外）；每一个字节都要能说出理由 |

---

## 2. Token 体系

### 2.1 两层结构与命名规则

```text
原始层  --palette-*   只存"这是什么颜色"（paper-50 / ink-900 / indigo-600 / night-900 …）
语义层  --color-*     只存"用在哪里"（bg / surface / text / border / accent / focus …）
        --space-* --fs-* --lh-* --fw-* --radius-* --shadow-* --font-* --content-width …
```

规则：

- `--palette-*` 定义在 `:root`，**与主题无关**：亮暗两套色板始终同时存在，只是取值不同。
- `--color-*` 在 `:root` 定义亮色、在 `html.dark` 覆盖为暗色，**组件不需要知道当前主题**。
- 主题无关 token（字体/字号/行高/字重/间距/圆角/宽度/动效）只定义一次。
- 新增 token 的门槛：**至少两个组件要用**，且能说明它不能被现有 token 表达；否则用现有 token 组合。

### 2.2 原始层色板 `--palette-*`

| Token | 值 | 说明 |
|---|---|---|
| `--palette-paper-0` | `#FFFFFF` | 亮色最高面 |
| `--palette-paper-50` | `#FCFCFD` | 亮色页面底（近白，非纯白） |
| `--palette-paper-75` | `#F7F8FA` | 亮色代码块底 |
| `--palette-paper-100` | `#F2F3F5` | 亮色次级面 |
| `--palette-paper-150` | `#E8EAEE` | 亮色按下态 / 高亮底 |
| `--palette-paper-200` | `#E3E5EA` | 亮色描边 |
| `--palette-ink-900` | `#16181D` | 亮色正文（近黑，非纯黑） |
| `--palette-ink-600` | `#5B6270` | 亮色次文字 |
| `--palette-indigo-600` | `#3B4CE0` | 主强调色 |
| `--palette-indigo-700` | `#2E3BC8` | 强调色 hover（亮色） |
| `--palette-night-950` | `#0F1115` | 暗色页面底（近黑，非纯黑） |
| `--palette-night-925` | `#14171D` | 暗色代码块底 |
| `--palette-night-900` | `#171A21` | 暗色最高面 |
| `--palette-night-800` | `#1F232B` | 暗色次级面 |
| `--palette-night-750` | `#262B35` | 暗色按下态 / 高亮底 |
| `--palette-night-700` | `#2A2F39` | 暗色描边 |
| `--palette-night-100` | `#E7E9EE` | 暗色正文（**永不用 `#FFFFFF`**） |
| `--palette-night-400` | `#98A0AE` | 暗色次文字 |
| `--palette-indigo-300` | `#8E9CFF` | 暗色强调色（提亮，借 Josh Comeau 实测策略） |
| `--palette-indigo-200` | `#A6B1FF` | 暗色强调色 hover |

### 2.3 语义层 `--color-*`

| 语义 Token | 亮色 | 暗色 | 用途 | 允许出现在 |
|---|---|---|---|---|
| `--color-bg` | `#FCFCFD` | `#0F1115` | 页面底色 | 全局 |
| `--color-surface` | `#FFFFFF` | `#171A21` | 卡片 / 抬升面 / 页头页脚面板 | 全局 |
| `--color-surface-2` | `#F2F3F5` | `#1F232B` | 次级面：标签底、行内代码底、hover 底、输入框底 | 全局 |
| `--color-surface-3` | `#E8EAEE` | `#262B35` | 按下态底、搜索结果高亮（`mark`）底 | 全局 |
| `--color-code-bg` | `#F7F8FA` | `#14171D` | 代码块底 | 代码块 |
| `--color-text` | `#16181D` | `#E7E9EE` | 正文 / 标题 | 全局 |
| `--color-text-secondary` | `#5B6270` | `#98A0AE` | 次文字：元信息、图注、说明、占位符 | 全局 |
| `--color-border` | `#E3E5EA` | `#2A2F39` | 描边 / 分隔线（纯装饰） | 全局 |
| `--color-accent` | `#3B4CE0` | `#8E9CFF` | 强调：按钮底、当前项标记、焦点环 | 见 §2.6 |
| `--color-accent-hover` | `#2E3BC8` | `#A6B1FF` | 强调 hover | 见 §2.6 |
| `--color-accent-text` | `#3B4CE0` | `#8E9CFF` | 正文尺寸的链接文字 | 链接 |
| `--color-focus` | `#3B4CE0` | `#8E9CFF` | 焦点环（交互控件状态，计入 §2.6 允许范围） | 控件焦点态 |

> 亮暗强调色同值时仍保留两个 token，是为了将来单独调"链接色"而不动"按钮色"（调研硬结论 3 的两级策略）。

### 2.4 完整令牌 CSS（可直接粘贴为 `src/styles/tokens.css`）

```css
/* ============================================================
   tokens.css · ppy-Blog 设计令牌 v1.0（方向 B · 墨蓝极简）
   两层结构：原始层 --palette-*（存色值）/ 语义层（存用途）
   铁律：--palette-* 只允许出现在本文件；组件只引用语义层
   ============================================================ */

:root {
  /* ---------- 原始层 · 亮色色板 ---------- */
  --palette-paper-0:     #FFFFFF;
  --palette-paper-50:    #FCFCFD;
  --palette-paper-75:    #F7F8FA;
  --palette-paper-100:   #F2F3F5;
  --palette-paper-150:   #E8EAEE;
  --palette-paper-200:   #E3E5EA;
  --palette-ink-900:     #16181D;
  --palette-ink-600:     #5B6270;
  --palette-indigo-600:  #3B4CE0;
  --palette-indigo-700:  #2E3BC8;

  /* ---------- 原始层 · 暗色色板 ---------- */
  --palette-night-950:   #0F1115;
  --palette-night-925:   #14171D;
  --palette-night-900:   #171A21;
  --palette-night-800:   #1F232B;
  --palette-night-750:   #262B35;
  --palette-night-700:   #2A2F39;
  --palette-night-100:   #E7E9EE;
  --palette-night-400:   #98A0AE;
  --palette-indigo-300:  #8E9CFF;
  --palette-indigo-200:  #A6B1FF;

  /* ---------- 语义层 · 亮色（默认主题） ---------- */
  --color-bg:             var(--palette-paper-50);
  --color-surface:        var(--palette-paper-0);
  --color-surface-2:      var(--palette-paper-100);
  --color-surface-3:      var(--palette-paper-150);
  --color-code-bg:        var(--palette-paper-75);
  --color-text:           var(--palette-ink-900);
  --color-text-secondary: var(--palette-ink-600);
  --color-border:         var(--palette-paper-200);
  --color-accent:         var(--palette-indigo-600);
  --color-accent-hover:   var(--palette-indigo-700);
  --color-accent-text:    var(--palette-indigo-600);
  --color-focus:          var(--palette-indigo-600);

  /* ---------- 字体（零 Web Font，纯系统栈） ---------- */
  --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
               "Hiragino Sans GB", "Microsoft YaHei", Roboto, Helvetica, Arial,
               sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "Cascadia Code", Consolas,
               "Liberation Mono", monospace;

  /* ---------- 字号阶 ---------- */
  --fs-2xs:    0.75rem;    /* 12px · 语言标签、徽标（仅 mono） */
  --fs-xs:     0.8125rem;  /* 13px · 元信息、图注、页脚、TOC */
  --fs-sm:     0.9375rem;  /* 15px · 导航、按钮、摘要、列表条目 */
  --fs-body:   1rem;       /* 16px · 正文（PRD G2：中文 ≥16px） */
  --fs-h3:     1.15rem;    /* 18.4px */
  --fs-h2:     1.4rem;     /* 22.4px */
  --fs-h1:     1.875rem;   /* 30px · 文章标题 —— ⚠️ v1.1 起本值作废：新字号阶见 docs/06-visual-spec.md §2 */
  --fs-display:2.75rem;    /* 44px · 仅 404 代码数字（mono） */

  /* ---------- 行高 ---------- */
  --lh-tight:      1.3;    /* h1 */
  --lh-heading:    1.45;   /* h2 */
  --lh-subheading: 1.5;    /* h3 / 卡片标题 */
  --lh-compact:    1.7;    /* 摘要、列表条目、代码 */
  --lh-body:       1.75;   /* 正文（见 §12 U1 待裁决项） */

  /* ---------- 字重 ---------- */
  --fw-normal:   400;
  --fw-medium:   500;
  --fw-semibold: 600;

  /* ---------- 间距（4px 基准） ---------- */
  --space-1:  4px;   --space-2:  8px;   --space-3:  12px;
  --space-4:  16px;  --space-5:  20px;  --space-6:  24px;
  --space-7:  28px;  --space-8:  32px;  --space-9:  36px;
  --space-10: 40px;  --space-11: 44px;

  /* ---------- 圆角 ---------- */
  --radius-sm:   4px;    /* 控件：按钮、输入框、行内代码 */
  --radius-md:   8px;    /* 卡片、代码块、图片 —— v1.1：原 6px，依 06-visual-spec §3 改 8px */
  --radius-full: 999px;  /* 标签胶囊、头像 */

  /* ---------- 阴影（全站仅此一档） ---------- */
  --shadow-card: 0 1px 2px rgba(16, 18, 22, 0.05);

  /* ---------- 布局 ---------- */
  /* v1.1（2026-09-30 · task-19，依 06-visual-spec §3）：--content-width 768px 指**外层内容列**（含左右 24px padding）
     → 内层正文恒为 720px；--container-width 1072px。tokens.css 实际值在换肤 commit 时同步。 */
  --content-width:   768px;
  --container-width: 1072px;
  --header-height:   56px;   /* v1.1：06-visual-spec §3 要求页头 60px，本值待换肤时同步 */

  /* ---------- 动效 ---------- */
  --dur-fast: 120ms;
  --dur-base: 150ms;
  --ease-out: cubic-bezier(0.2, 0.6, 0.3, 1);

  /* ---------- 焦点环 ---------- */
  --focus-width:  2px;
  --focus-offset: 2px;

  /* ---------- 断点（仅供文档与 JS 引用；CSS 媒体查询必须写字面值） ---------- */
  /* sm 640px · md 900px · lg 1080px */
}

/* ============================================================
   暗色主题：由首帧内联脚本给 <html> 加 .dark（见 §7）
   暗色不是反色：降饱和、降对比，正文永不用纯白
   ============================================================ */
html.dark {
  --color-bg:             var(--palette-night-950);
  --color-surface:        var(--palette-night-900);
  --color-surface-2:      var(--palette-night-800);
  --color-surface-3:      var(--palette-night-750);
  --color-code-bg:        var(--palette-night-925);
  --color-text:           var(--palette-night-100);
  --color-text-secondary: var(--palette-night-400);
  --color-border:         var(--palette-night-700);
  --color-accent:         var(--palette-indigo-300);
  --color-accent-hover:   var(--palette-indigo-200);
  --color-accent-text:    var(--palette-indigo-300);
  --color-focus:          var(--palette-indigo-300);

  /* 暗色下阴影不可见 → 用 1px 外扩描边替代，视觉上等价于"无阴影 + 清晰边界" */
  --shadow-card: 0 0 0 1px var(--color-border);
}
```

### 2.5 对比度实测（本机按 WCAG 2.1 相对亮度公式实算，非估计）

| 组合 | 亮色 | 暗色 | 门槛 | 结论 |
|---|---|---|---|---|
| 正文 / 页面底 | **17.32:1** | **15.56:1** | ≥4.5（AA 文本） | ✅ 远超 |
| 正文 / surface | 17.76:1 | 14.33:1 | ≥4.5 | ✅ |
| 正文 / surface-2 | 15.99:1 | 12.96:1 | ≥4.5 | ✅ |
| 次文字 / 页面底 | 5.98:1 | 7.18:1 | ≥4.5 | ✅ |
| 次文字 / surface | 6.13:1 | 6.61:1 | ≥4.5 | ✅ |
| 次文字 / surface-2 | 5.52:1 | 5.98:1 | ≥4.5 | ✅ |
| 强调（文字链接）/ 页面底 | 6.21:1 | 7.51:1 | ≥4.5 | ✅ |
| 强调 / surface | 6.37:1 | 6.92:1 | ≥4.5 | ✅ |
| 强调 / surface-2 | 5.74:1 | 6.26:1 | ≥4.5 | ✅ |
| 按钮文字 / 按钮底 | 6.37:1（白/靛蓝） | 7.51:1 | ≥4.5 | ✅ |
| 按钮 hover 文字 / 底 | 8.15:1 | 9.32:1 | ≥4.5 | ✅ |
| 代码文字 / 代码块底 | 16.71:1 | 14.78:1 | ≥4.5 | ✅ |
| 语言标签 / 代码块底 | 5.77:1 | 6.82:1 | ≥4.5 | ✅ |
| 焦点环 / 各背景 | 5.74–6.37:1 | 6.26–7.51:1 | ≥3（非文本） | ✅ |
| `mark` 高亮底上的正文 | 14.74:1 | 11.69:1 | ≥4.5 | ✅ |
| 边框 / 页面底 | 1.23:1 | 1.41:1 | 不适用 | ⚠️ **仅装饰，不承载信息**（见 §5.3） |

> 复核方式：任意 WCAG 对比度计算器输入上表两色即可复现。**新增任何颜色组合前必须重算并 ≥4.5:1（文本）或 ≥3:1（非文本 UI）。**

### 2.6 强调色使用边界（硬约束 · 来自任务书与调研硬结论 3）

**靛蓝只允许出现在三处：**

1. **链接**（正文内链接文字/下划线、卡片标题 hover、页脚链接 hover）
2. **当前项**（导航 `aria-current`、分页当前页、标签页当前标签）
3. **按钮**（`.btn--primary` 底色、图标按钮的 focus 态）

**唯一解释性扩展**：`--color-focus` 取强调色。焦点环是"链接/按钮/输入控件"的状态表现，计入第 1、3 类，**不属于新增第四处**。请勿据此再扩大范围。

**明令禁止**：作为大面积背景填充（除按钮外任何纯色块 > 40×40px）、用于正文文字、用于边框装饰、用于图标默认态、用于卡片/区块/表头底色、用于代码语法高亮的品牌色。

**自检方法**：页面截图去色后，靛蓝应仍只出现在"可以点的地方"；若去色后某处失去含义，说明该处违规使用。

---

## 3. 排版规范

### 3.1 字号阶与用途

| Token | 值 | 用途 | 行高 | 字重 |
|---|---|---|---|---|
| `--fs-display` | 44px / 2.75rem | 仅 404 代码数字（`--font-mono`） | 1.1 | 600 |
| `--fs-h1` | 30px / 1.875rem | 文章标题、页面主标题 | `--lh-tight` 1.3 | 600 |
| `--fs-h2` | 22.4px / 1.4rem | 正文一级章节 | `--lh-heading` 1.45 | 600 |
| `--fs-h3` | 18.4px / 1.15rem | 正文二级章节、**卡片标题**、搜索结果标题 | `--lh-subheading` 1.5 | 600 |
| `--fs-body` | 16px / 1rem | 正文（PRD G2 门槛 ≥16px）、个人卡片一句话 | `--lh-body` 1.75 | 400 |
| `--fs-sm` | 15px / 0.9375rem | 导航、按钮、列表摘要、归档条目、TOC、分页 | `--lh-compact` 1.7 | 400/500 |
| `--fs-xs` | 13px / 0.8125rem | 元信息、图注、页脚、面包屑、标签 | 1.6 | 400 |
| `--fs-2xs` | 12px / 0.75rem | 代码块语言标签（**仅 `--font-mono`**） | 1.4 | 500 |

> **⚠️ v1.1 修订（2026-09-30 · task-19，依 G-05 / `06-visual-spec.md` §7）**：本节的**字号硬上限规则（原：全站最大 30px）作废**。v1.1 字号阶以 `docs/06-visual-spec.md` §2 为准：列表 / 归档 / 标签页 `h1` **40px**、文章页标题 **36px**、首页问候 `h1` **34px**、正文内 `h2` / `h3` **24 / 19px**、**卡片标题 24px**、卡片摘要 **14px**、卡片元信息 **13px**、导航项 16px、logo 24px。**标题字重统一 700**——故 §3.2「禁止 700+」中**针对标题**的部分一并失效（正文仍为 400 / 500）。本表 `--fs-*` 的正式重定义在 `tokens.css` 换肤 commit 时同步。
>
> **上限规则（残余有效部分）**：除 404 数字外**不得出现比正文更大的装饰性文字**；不使用 `clamp()` 流体字号（方向 B 要「准」，不要「飘」）。

### 3.2 行高与字重

- 行高只允许取 `--lh-*` 五档，禁止行内写 `line-height: 1.6` 这类魔法数。
- 字重只用 400 / 500 / 600。**禁止 700+**（中文粗体在多数系统字体下会糊成一团），**禁止 <400 细体**（低分屏可读性差）。
- 中文**一律不使用斜体**：`font-style: normal`。中文字体没有真斜体，浏览器合成倾斜会显著降低可读性；需要强调时用字重 600 + 语义标签（`<strong>` / `<em>` 视觉上都渲染为 600 字重，不倾斜）。
- **中文不使用负字距**：`letter-spacing: 0`。唯一的正字距例外是 mono 语言标签（`0.08em`）与全大写徽标。

### 3.3 中英混排规则（中文为主站点，逐条可检查）

| # | 规则 | 正确示例 | 错误示例 |
|---|---|---|---|
| R1 | 中文标点用**全角** | 完成。下一步，继续 | 完成.下一步,继续 |
| R2 | **中英文/数字之间加一个半角空格** | 使用 Astro 7.3.5 构建，首屏 JS 为 0 | 使用Astro7.3.5构建 |
| R3 | 数值与计量单位之间加空格；百分比/角度/像素按技术社区惯例不加 | 8 MB、3 kg ／ 99%、90°、720px | 8MB、720 px |
| R4 | 全角标点之后**不再加空格** | 完成。下一步 | 完成。 下一步 |
| R5 | 括号包裹西文用半角括号 | 使用 Astro（v7.3.5） | 使用 Astro（ｖ7.3.5） |
| R6 | 省略号用 `……`，破折号用 `——` | 等等…… | 等等... |
| R7 | 代码标识符 / 路径 / 命令一律行内代码，内部不加中文标点 | `content/posts/` 目录 | content/posts/ 目录 |
| R8 | 标题不加句号；标题内不换行断词 | 从零搭建个人博客 | 从零搭建个人博客。 |
| R9 | 日期格式统一 `YYYY-MM-DD`（`<time datetime>` 用 ISO 8601 带时区） | 2026-09-30 | 2026/9/30 |

> **R2 的实现方式（重要）**：MVP 采用**写作侧手打空格**——零依赖、100% 可控、不会破坏代码与 URL。PRD §10 提到的"自动加空格"若要在构建期实现，只能做成 remark/rehype 插件（在文本节点层插入），**该方案未验证**（见 §12 U8），列 P1。**禁止在客户端用 JS 遍历 DOM 插入空格**（破坏 SSR 内容、影响首屏、Pagefind 索引可能与显示不一致）。

### 3.4 链接样式（全站唯一表）

| 场景 | 默认 | hover | focus-visible | active / visited |
|---|---|---|---|---|
| **正文内链接** | 色 `--color-accent-text`；下划线 `text-decoration-thickness: 1px; text-underline-offset: 0.18em` | 色 → `--color-accent-hover`；下划线粗 2px | 保留下划线 + 焦点环 | active 同 hover；**visited 不变色**（避免用颜色差异承载"是否读过"，也避免紫红污染配色） |
| **导航链接** | 色 `--color-text-secondary`；无下划线 | 色 → `--color-text` | 焦点环 | — |
| **当前导航项** | 色 `--color-accent-text`；字重 600；底部 2px 实线 `--color-accent`（`aria-current="page"`） | 不变 | 焦点环 | — |
| **卡片标题链接** | 色 `--color-text`；无下划线 | 色 → `--color-accent-text`；卡片底 → `--color-surface-2` | 焦点环 | — |
| **图标链接 / 图标按钮** | 色 `--color-text-secondary` | 色 → `--color-text`；底 → `--color-surface-2` | 焦点环 | active：底 `--color-surface-3` |
| **外链** | 同"正文内链接" + 尾随 12px 外链图标（`stroke="currentColor"`，`aria-hidden="true"`） | 同 | 同 | 同 |

三条硬规则：

1. **正文内链接默认就带下划线**（不是 hover 才出现）。颜色不能作为唯一的链接线索（WCAG 1.4.1）。
2. 外链一律 `target="_blank" rel="noopener"`（PRD §9 / AC-12），并在链接文本里保留可读的域名（不写"点击这里"）。
3. **禁止**用 `<a href="#">` 或 `<div onclick>` 冒充按钮；导航用 `<a>`，动作（切主题、展开、复制）用 `<button>`。

### 3.5 标题锚点

```html
<h2 id="design-tokens">
  设计令牌
  <a class="heading-anchor" href="#design-tokens" aria-label="本节锚点：设计令牌">#</a>
</h2>
```

```css
.heading-anchor {
  margin-left: 0.35em;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-weight: var(--fw-normal);
  opacity: 0;
  transition: opacity var(--dur-base) var(--ease-out),
              color var(--dur-base) var(--ease-out);
}
@media (hover: hover) and (pointer: fine) {
  :is(h2, h3):hover .heading-anchor { opacity: 1; }
}
.heading-anchor:focus-visible { opacity: 1; }   /* 键盘用户必须看得见 */
@media (max-width: 639px) { .heading-anchor { display: none; } }  /* 移动端不侵占标题 */
```

- 锚点标签内容固定为 `#`，`aria-label` 写明"本节锚点：<标题文本>"，避免屏幕阅读器只读出"井号"。
- 点击后标题不能被 sticky 页头遮住：`.prose :is(h1,h2,h3,h4) { scroll-margin-top: calc(var(--header-height) + var(--space-4)); }`

### 3.6 正文容器与断行

```css
.prose {
  max-width: 100%;                      /* v1.1：正文列宽由外层 .content（768px − 24px×2 padding）决定 = 720px；任何视口都不放宽（PRD G2 / AC-4） */
  margin-inline: auto;
  font-family: var(--font-body);
  font-size: var(--fs-body);            /* 16px */
  line-height: var(--lh-body);          /* 1.75 */
  color: var(--color-text);
  letter-spacing: 0;
  text-align: left;                     /* 禁止 justify：中文两端对齐会产生难看的字距 */
  word-break: normal;                   /* 禁止 break-all：中文会被逐字切断 */
  overflow-wrap: break-word;            /* 长 URL / 长标识符不撑破容器 */
  text-wrap: pretty;                    /* 渐进增强，不支持的浏览器忽略 */
}
.prose :is(h1, h2, h3) { text-wrap: balance; }  /* 渐进增强：标题不出现单字成行 */
```

**正文宽度是硬约束**：720px，对应实测区间 680–860px（调研硬结论 1）。任何"看起来太窄/太宽"的主观意见都不构成修改理由；要改必须先改 PRD G2。

---

## 4. 间距与节奏

### 4.1 `--space-*` 用法表

| Token | 值 | 主要用途（超出此表即视为随意取值） |
|---|---|---|
| `--space-1` | 4px | 图标与文字间距、分页项间距、标签内上下 |
| `--space-2` | 8px | 标签内左右（配合 padding）、图注上边距、列表项之间 |
| `--space-3` | 12px | **卡片列表 gap**、摘要与元信息之间、页脚移动端行距、元信息项之间 |
| `--space-4` | 16px | 容器左右内边距（<640px）、面包屑下、H1 下、h2 下边距 |
| `--space-5` | 20px | **段落之间（1.25em）**、卡片纵向 padding、导航项间距 |
| `--space-6` | 24px | 卡片横向 padding、图片/代码块/表格/引用上下间距、容器左右内边距（≥640px） |
| `--space-7` | 28px | 区块内边距（移动端）；代码块头部右侧预留位（未来复制按钮） |
| `--space-8` | 32px | 页脚上下 padding、元信息行下（接正文）、h3 上边距 |
| `--space-9` | 36px | h2 上边距（<640px）、页面上下留白（移动端） |
| `--space-10` | 40px | 按钮高度、输入框高度、归档条目最小高度 |
| `--space-11` | 44px | h2 上边距（≥640px）、页面上下留白（桌面）、空态留白、区块之间 |

**节奏铁律**：同一页面里"同一种关系"必须用同一个 token。出现两种段落间距、两种卡片 gap 即为违规。

### 4.2 容器与断点

```css
/* v1.1（2026-09-30 · task-19，依 06-visual-spec §3）：--container-width 1072px / --content-width 768px（含 padding）
   .content 的 768px = 24px×2 padding + 720px 内层正文，正文宽度因此恒为 720px */
.container { width: 100%; max-width: var(--container-width); margin-inline: auto; padding-inline: var(--space-4); }
@media (min-width: 640px) { .container { padding-inline: var(--space-6); } }
.content  { width: 100%; max-width: var(--content-width); margin-inline: auto; padding-inline: var(--space-6); }
```

| 断点 | 范围 | 变化 |
|---|---|---|
| **sm** | < 640px | 单列；容器左右 16px；顶部导航折叠为汉堡；卡片 padding 16px 20px；h2 上边距 36px；TOC 为折叠块；归档页降级为单列 |
| **md** | 640–899px | 容器左右 24px；卡片 padding 20px 24px；h2 上边距 44px |
| **lg** | ≥ 900px | 顶部导航完整展开；页脚两栏；归档页启用"年份脊"（sticky）；作品页网格 ≥2 列 |
| **xl** | ≥ 1080px | 容器达 **1072px**（v1.1，原 1080px，依 06-visual-spec §3）；**正文仍锁 720px 居中**，不随视口变宽 |

> CSS 媒体查询条件里**必须写字面值**（`@media (min-width: 900px)`），CSS 变量不能用于媒体查询条件；`tokens.css` 中的断点注释仅供文档与 JS 引用。

### 4.3 垂直节奏总表（正文区）

| 关系 | 值 |
|---|---|
| 段落 ↔ 段落 | `--space-5` 20px |
| h2 上边距 / 下边距 | 44px（<640px 为 36px） / 16px |
| h3 上边距 / 下边距 | 32px / 12px |
| 列表 ↔ 上下文；`li` 之间 | 20px / 8px |
| 图片、代码块、表格、引用 ↔ 上下文 | 24px |
| 面包屑 ↦ H1 ↦ 元信息 ↦ 正文 | 16px / 16px / 32px |
| 正文结束 ↦ 文末区块（版权/系列/相关/评论） | 44px |
| 页面顶部/底部留白 | 移动端 36px，桌面 44px 起 |

---

## 5. 圆角 / 阴影 / 边框

### 5.1 圆角

| Token | 值 | 用途 |
|---|---|---|
| `--radius-sm` | 4px | 控件：按钮、输入框、分页项、行内代码、焦点环 |
| `--radius-md` | **8px** | 容器：卡片、代码块、图片、搜索结果项（v1.1：原 6px，依 06-visual-spec §3） |
| `--radius-full` | 999px | 标签胶囊、头像 |

规则：卡片内部元素圆角 ≤ 卡片圆角；**全站圆角上限 8px**（v1.1 · 2026-09-30 依 `06-visual-spec.md` §3：原「圆角上限 6px」规则**作废**）（方向 B 是"准、快"，不是"圆润"）；同一元素不混用两种圆角。

### 5.2 阴影（全站仅一档）

| Token | 亮色 | 暗色 |
|---|---|---|
| `--shadow-card` | `0 1px 2px rgba(16,18,22,.05)` | `0 0 0 1px var(--color-border)`（等价"无阴影 + 清晰边界"） |

规则：**除 `--shadow-card` 外不存在任何阴影 token**。禁止：hover 抬升（`translateY(-2px)` + 阴影变大）、多层阴影、彩色阴影、`backdrop-filter` 毛玻璃、`box-shadow` 发光。暗色下"抬升"只能靠 `--color-surface` 的明度差 + 1px 描边表达。

### 5.3 边框

- 统一 `1px solid var(--color-border)`，**仅作装饰与分区，不承载信息**（对比度 1.23:1 / 1.41:1，天然不可作为唯一线索）。
- "选中 / 错误 / 必填 / 有新内容"等**信息性状态必须配文字或图标**，不能只靠边框颜色或粗细。
- 分隔线用 `border-top`；`<hr>` 在 `.prose` 中重置为 `border: 0; border-top: 1px solid var(--color-border); margin: var(--space-8) 0;`。
- 禁止 `dashed` / `dotted`（唯一例外：上传占位等空态可用 `1px dashed`，且必须同时有文字说明）。
- 不使用 `outline: none` 取消焦点样式（见 §8.1）。

---

## 6. 组件规范

### 6.0 通用约定

| 项 | 规定 |
|---|---|
| 命名 | 小写 kebab-case；块 `.post-card`、元素 `.post-card__title`、变体 `.post-card--compact`、状态 `.is-active`；**优先用原生伪类与 ARIA 属性选择器**（`[aria-current]`、`:focus-visible`），JS 态类只作补充 |
| hover 包裹 | 所有 `:hover` 规则必须包在 `@media (hover: hover) and (pointer: fine)` 内，避免触屏"粘住"hover 态 |
| 过渡 | 只允许过渡 `color / background-color / border-color / opacity / transform`，时长 `--dur-base`；**禁止过渡 `width/height/margin/padding/box-shadow`** |
| 动效降级 | `@media (prefers-reduced-motion: reduce)` 下关闭全部过渡与 `scroll-behavior` |
| 焦点环 | 全局统一（§8.1），组件不得自行取消；组件若换了底色，必须确认焦点环仍 ≥3:1 |
| 触控目标 | 所有可点元素**命中区域 ≥44×44 CSS px**（`@media (pointer: coarse)` 下用 padding 补足，视觉尺寸可更小） |
| 图标 | 一律内联 SVG：`viewBox="0 0 24 24"`、`stroke="currentColor"`、`stroke-width="1.75"`、`fill="none"`、`aria-hidden="true" focusable="false"`；禁止图标字体、禁止 emoji 当图标 |
| 组件清单 | 6.1 Header · 6.2 ThemeToggle · 6.3 PostCard · 6.4 TagPill · 6.5 Pagination · 6.6 TOC · 6.7 CodeBlock · 6.8 InlineCode · 6.9 Blockquote · 6.10 Table · 6.11 Figure · 6.12 Footer · 6.13 Breadcrumb · 6.14 Button · 6.15 NotFound · 6.16 SearchResultItem · 6.17 补充组件 |

---

### 6.1 顶部导航 Header `.site-header`

**用途**：全站一级导航与全局动作入口（搜索、主题切换、移动端菜单）。

**结构**

```html
<header class="site-header">
  <div class="site-header__inner container">
    <a class="site-header__brand" href="/">ppy-Blog</a>

    <nav class="site-nav" aria-label="主导航">
      <ul class="site-nav__list">
        <li><a class="site-nav__link" href="/" aria-current="page">首页</a></li>
        <li><a class="site-nav__link" href="/posts/">文章</a></li>
        <li><a class="site-nav__link" href="/archives/">归档</a></li>
        <li><a class="site-nav__link" href="/works/">作品</a></li>
        <li><a class="site-nav__link" href="/about/">关于</a></li>
      </ul>
    </nav>

    <div class="site-header__actions">
      <a class="icon-btn" href="/search/" aria-label="站内搜索（快捷键 Alt+/）"><svg …></svg></a>
      <button class="icon-btn theme-toggle" type="button" aria-pressed="false" aria-label="深色模式">…</button>
      <details class="site-menu">
        <summary class="icon-btn site-menu__toggle" aria-label="打开导航菜单"><svg …></svg></summary>
        <nav class="site-menu__panel" aria-label="移动端导航"><ul>…</ul></nav>
      </details>
    </div>
  </div>
</header>
<a class="skip-link" href="#main">跳到正文</a>
```

**尺寸**：高度 `--header-height` 56px（<640px 为 52px）；品牌名 `--fs-body` / 600；导航项 `--fs-sm`；`.icon-btn` 视觉 36×36（coarse pointer 44×44）。

**间距**：`.site-header__inner` 水平 padding 用 `.container`（16/24px）；品牌与导航 `--space-6`；导航项之间 `--space-5`；动作区间 `--space-1`。

**状态**

| 状态 | 表现 |
|---|---|
| 默认 | `position: sticky; top: 0; z-index: 10;` 背景 `--color-bg`；底边 `1px solid var(--color-border)`；**无阴影、无毛玻璃**。**⚠️ 此为对参考站的「故意偏离」（v1.1 · 2026-09-30 · task-19）**：参考站（Lil'Log / PaperMod）页头**既无 sticky 也无底线**，我们**保留 sticky + 1px 底线**——理由是长文里导航 / 搜索 / 返回的可用性，属功能决策而非风格决策（出处：`docs/06-visual-spec.md` §5 第 2 条「故意不抄」） |
| hover（导航项） | 色 `--color-text-secondary` → `--color-text` |
| focus-visible | 全局焦点环（§8.1） |
| active | 色保持 hover；不加位移 |
| 当前项 | `aria-current="page"` → 色 `--color-accent-text`、600、底边 2px `--color-accent` |
| 移动端（<900px） | `.site-nav__list` 隐藏；`.site-menu` 显示，用原生 `<details>` 实现展开（**零 JS、原生键盘可达**）；面板全宽、背景 `--color-surface`、底边 1px；每项 44px 高 |
| disabled | 不适用（导航项恒可用） |

**无障碍**：`<header>` + `<nav aria-label="主导航">`；当前项 `aria-current="page"`；图标按钮必须有 `aria-label`（描述动作，不是图标名）；SVG `aria-hidden="true"`；页面第一个可聚焦元素是 `.skip-link`（默认视觉隐藏、focus 时出现在左上角）；Tab 顺序：skip-link → 品牌 → 导航项 → 搜索 → 主题 → 菜单。

---

### 6.2 主题切换按钮 `.theme-toggle`

**用途**：在亮/暗之间手动切换并记忆（PRD F-06）。

**结构**

```html
<button class="icon-btn theme-toggle" type="button" aria-pressed="false" aria-label="深色模式">
  <svg class="theme-toggle__icon theme-toggle__icon--moon" …><!-- 日间显示：月亮 --></svg>
  <svg class="theme-toggle__icon theme-toggle__icon--sun" hidden …><!-- 夜间显示：太阳 --></svg>
</button>
```

**尺寸**：视觉 36×36，图标 18×18，圆角 `--radius-sm`；`@media (pointer: coarse)` 下命中区 44×44。

**间距**：与相邻图标按钮 `--space-1`。

**状态**

| 状态 | 表现 |
|---|---|
| 默认 | 色 `--color-text-secondary`，背景透明 |
| hover | 色 `--color-text`，背景 `--color-surface-2` |
| focus-visible | 焦点环 |
| active | 背景 `--color-surface-3`，`transform: translateY(1px)` |
| 按下（`aria-pressed="true"`，即暗色开启） | 图标切为太阳；背景不变（**不做高亮填充**，避免误用强调色） |
| disabled | 不适用 |

**无障碍**：`aria-label` 固定为"深色模式"（**不要**随状态改成"切换到亮色"——名称漂移会让屏幕阅读器用户困惑），状态由 `aria-pressed` 表达；切换后不弹提示、不移动焦点；严格禁止用颜色单独表示当前主题。

---

### 6.3 文章卡片 PostCard `.post-card`

**用途**：首页 / 分类页 / 标签页 / 相关文章的列表条目。

**结构**

```html
<article class="post-card">
  <h2 class="post-card__title"><a class="post-card__link" href="/posts/2026-09-30-xxx/">文章标题</a></h2>
  <p class="post-card__desc">一句话摘要，最多两行。</p>
  <p class="meta-row">
    <time datetime="2026-09-30">2026-09-30</time>
    <span aria-hidden="true">·</span><span>8 分钟</span>
    <span aria-hidden="true">·</span><a href="/categories/tech/">技术</a>
    <span aria-hidden="true">·</span><span class="tag-pill tag-pill--static">性能优化</span>
  </p>
</article>
```

**尺寸**：宽 100%（列表容器内层 720px）；标题 **24px** / `--lh-subheading` / **700**；摘要 **14px** / `--lh-compact`，**最多 2 行**；元信息 **`--fs-xs` 13px**。**v1.1 修订（2026-09-30 · task-19，依 `06-visual-spec.md` §2）**：标题由 `--fs-h3` 18.4px / 600 改为 **24px / 700**；摘要由 `--fs-sm` 15px 改为 **14px**；元信息 13px 不变。

**间距**：padding 20px 24px（<640px 16px 20px）；卡片之间 `--space-3` 12px；标题 ↦ 摘要 `--space-2`；摘要 ↦ 元信息 `--space-3`。

**状态**

| 状态 | 表现 |
|---|---|
| 默认 | 背景 `--color-surface`；圆角 `--radius-md`；1px `--color-border`；阴影 `--shadow-card` |
| hover | 卡片背景 `--color-surface-2`；标题色 → `--color-accent-text`（**同时改变两处**，不只靠颜色） |
| focus-visible | 标题链接的焦点环（卡片本身不加环，避免双环） |
| active | 同 hover（卡片不做位移） |
| disabled / 空态 | 不适用；无文章时用 `.empty-state`（§6.17） |
| 有封面图（`cover`） | 缩略图 96×64、`--radius-sm`、右侧 `--space-4`；无封面图时不占位（**不留灰块**） |

**无障碍**：`<article>`；标题层级由页面决定（首页有 `<h1>` 时卡片用 `<h2>`，无更高层级时用 `<h2>` 亦可，**不得跳级**）；整卡热区用标题链接的 `::after { content:""; position:absolute; inset:0 }` 扩展，**因此卡片内不得再放其他链接**——分类与标签在卡片里渲染为 `.tag-pill--static`（非链接纯文本），文章页才是链接版。这样屏幕阅读器只会播报一次标题链接，键盘 Tab 也只停一次；摘要 2 行截断只用 CSS（`-webkit-line-clamp: 2`），**完整文本必须保留在 DOM 中**，禁止用 JS 截断字符串。

---

### 6.4 标签胶囊 TagPill `.tag-pill`

**用途**：标签列表、文章元信息行里的标签、标签云。

**结构**

```html
<!-- 可点版（标签页、标签云、文章页元信息） -->
<a class="tag-pill" href="/tags/performance/" rel="tag" aria-label="标签：性能优化，12 篇文章">
  性能优化<span class="tag-pill__count" aria-hidden="true">12</span>
</a>
<!-- 纯文本版（列表卡片内，避免与整卡热区冲突） -->
<span class="tag-pill tag-pill--static">性能优化</span>
```

**尺寸**：高 24px（padding 2px 10px）；`--fs-xs`；圆角 `--radius-full`；计数与文字间 `--space-1`；coarse pointer 下高 44px 命中区（视觉仍 24px，用 `padding-block` 透明扩展）。

**间距**：标签之间 `--space-2`；与元信息项之间 `--space-3`。

**状态**

| 状态 | 表现 |
|---|---|
| 默认 | 背景 `--color-surface-2`；文字 `--color-text-secondary`；**无边框** |
| hover | 背景 `--color-surface-3`；文字 `--color-text`（**不使用强调色**，把预算留给当前项） |
| focus-visible | 焦点环 |
| active | 背景 `--color-surface-3` + `translateY(1px)` |
| 当前标签（`aria-current="page"`） | 背景透明；1px 边框 `--color-accent`；文字 `--color-accent-text`（属于"当前项"，符合 §2.6） |
| disabled | 不适用 |

**无障碍**：计数是视觉冗余，用 `aria-hidden="true"` + `aria-label` 播报完整语义（"标签：性能优化，12 篇文章"）；`rel="tag"`；**标签名不加 `#` 前缀**（靠胶囊形状即可识别，避免与锚点 `#` 混淆）。

---

### 6.5 分页 Pagination `.pagination`

**用途**：列表页翻页（每页 10 篇，PRD F-01）。

**结构**

```html
<nav class="pagination" aria-label="分页导航">
  <a class="pagination__link" rel="prev" href="/posts/page/2/">← 上一页</a>
  <ol class="pagination__list">
    <li><a class="pagination__link" href="/posts/" aria-label="第 1 页">1</a></li>
    <li><span class="pagination__ellipsis" aria-hidden="true">…</span></li>
    <li><a class="pagination__link" href="/posts/page/3/" aria-current="page" aria-label="第 3 页，当前页">3</a></li>
    <li><a class="pagination__link" href="/posts/page/4/" aria-label="第 4 页">4</a></li>
    <li><span class="pagination__ellipsis" aria-hidden="true">…</span></li>
    <li><a class="pagination__link" href="/posts/page/12/" aria-label="第 12 页">12</a></li>
  </ol>
  <a class="pagination__link" rel="next" href="/posts/page/4/">下一页 →</a>
</nav>
```

**尺寸**：控件高 36px（coarse pointer 44px），序号最小宽 36px，圆角 `--radius-sm`，`--fs-sm`。

**间距**：项之间 `--space-1`；与列表末项 `--space-8`；整体水平居中，或与内容左对齐（**全站二选一，不得混用**——建议居中）。

**状态**

| 状态 | 表现 |
|---|---|
| 默认 | 文字 `--color-text-secondary`；背景透明 |
| hover | 文字 `--color-text`；背景 `--color-surface-2` |
| focus-visible | 焦点环 |
| active | 背景 `--color-surface-3` |
| 当前页 | 文字 `--color-accent-text`、600、背景 `--color-surface-2`、`aria-current="page"`（**不做靛蓝填充**，避免大面积强调色） |
| 首页 / 末页 | **不渲染**禁用按钮（"没有上一页"无需播报）；若为保持布局需占位，用 `<span class="pagination__link is-placeholder" aria-hidden="true">`，**不用 `disabled` 属性**（`<a>` 无 disabled，伪禁用会骗过辅助技术） |

**无障碍**：`<nav aria-label="分页导航">`；编号用 `<ol>`（页序天然有序）；当前页 `aria-current="page"`；省略号 `aria-hidden="true"`；每个链接 `aria-label="第 N 页"`（避免屏幕阅读器只读出一个数字）；`rel="prev"/"next"` 供阅读器与爬虫识别。

---

### 6.6 目录 TOC `.toc`

**用途**：长文跳转；默认折叠，展开后显示 h2/h3 层级（PRD F-12）。

**结构（MVP：原生 `<details>`，零 JS）**

```html
<details class="toc">
  <summary class="toc__toggle">
    <span class="toc__label">目录</span>
    <span class="toc__count">12</span>
    <svg class="toc__chevron" aria-hidden="true" focusable="false">…</svg>
  </summary>

  <nav class="toc__nav" aria-label="文章目录">
    <ol class="toc__list">
      <li class="toc__item"><a class="toc__link" href="#design-tokens">设计令牌</a></li>
      <li class="toc__item toc__item--h3"><a class="toc__link" href="#two-layers">两层结构</a></li>
    </ol>
  </nav>
</details>
```

**形态（记忆点之一，见 §9 M3）**：左侧 1px 竖线轨道 + 两位 mono 序号 + 悬停/聚焦时 2px 靛蓝滑块。

```css
.toc__list { border-left: 1px solid var(--color-border); counter-reset: toc; }
.toc__item { counter-increment: toc; }
.toc__link {
  display: block;
  position: relative;
  padding: var(--space-1) var(--space-3);
  margin-left: -1px;                     /* 滑块正好压在轨道上 */
  border-left: 2px solid transparent;
  color: var(--color-text-secondary);
  font-size: var(--fs-xs);
  line-height: var(--lh-compact);
  text-decoration: none;
}
.toc__link::before {
  content: counter(toc, decimal-leading-zero);   /* 01 02 03 … */
  margin-right: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--fs-2xs);
  color: var(--color-text-secondary);
  opacity: .7;
}
@media (hover: hover) and (pointer: fine) {
  .toc__link:hover { border-left-color: var(--color-accent); color: var(--color-text); }
}
.toc__link:focus-visible { border-left-color: var(--color-accent); color: var(--color-text); }
.toc__item--h3 .toc__link { padding-left: calc(var(--space-3) + var(--space-4)); }  /* 层级缩进 16px */
```

**尺寸**：折叠条高 40px；展开后每项行高 32px；`--fs-xs`；展开区最大高 `40vh` 且内部滚动（长文目录不占满屏）。

**间距**：折叠条 padding 0 `--space-3`；与元信息行 `--space-6`、与正文 `--space-6`；展开区内上下 padding `--space-2`。

**状态**

| 状态 | 表现 |
|---|---|
| 折叠（默认） | `<details>` 未开；箭头 `0deg`；`.toc__count` 显示条目数 |
| 展开 | `<details open>`；箭头 `rotate(180deg)`（过渡 150ms）；展开区背景 `--color-surface` + 1px `--color-border` + `--radius-md` |
| hover（条目） | 左轨变 2px `--color-accent`；文字 `--color-text-secondary` → `--color-text` |
| focus-visible（条目 / summary） | 焦点环；条目同样触发左轨变色 |
| active | 背景 `--color-surface-2` |
| disabled | 不适用；无标题的文章（`toc: false` 或没有 h2/h3）**整个组件不渲染** |

**无障碍**：`<nav aria-label="文章目录">`；`<summary>` 自带展开/折叠语义与键盘可达（Enter/Space），**不要给 summary 设 `display: flex`**（Safari/Firefox 会丢语义），用 `list-style: none` + `::-webkit-details-marker { display: none }` 隐藏原生三角后自绘箭头；缩放/焦点跳转后标题不被页头遮挡（`scroll-margin-top`，§3.5）；Alt+C 快捷键属 P1（F-18），MVP 不实现。

---

### 6.7 代码块 CodeBlock `.code-block`

**用途**：正文中的多行代码；**含常驻语言标签**（记忆点之二，见 §9 M2）。

**结构**

```html
<figure class="code-block" data-lang="ts">
  <figcaption class="code-block__header">
    <span class="code-block__lang">TS</span>
  </figcaption>
  <pre class="code-block__pre" tabindex="0" aria-label="TypeScript 代码示例"><code class="code-block__code language-ts">…</code></pre>
</figure>
```

**尺寸**：圆角 `--radius-md`；1px `--color-border`；背景 `--color-code-bg`；头部高 32px；代码 `--font-mono` / 14px（0.875rem）/ `--lh-compact`；语言标签 `--fs-2xs` + `letter-spacing: .08em` + 大写 + 500 字重；移动端代码字号不变（**允许横向滚动，不缩小字号**）。

**间距**：头部 padding 0 `--space-3`（右侧预留 `--space-7` 给未来的复制按钮，避免 P1 返工）；`pre` padding `--space-4`；与上下文 `--space-6`。

**状态**

| 状态 | 表现 |
|---|---|
| 默认 | 头部底边 1px `--color-border`；语言标签 `--color-text-secondary`（5.77:1 / 6.82:1 ✅） |
| hover | 无变化（代码块不是交互元素，**不做 hover 高亮**） |
| focus-visible（`pre` 可聚焦以支持键盘横向滚动） | 焦点环 |
| active | 不适用 |
| disabled | 不适用 |
| 超长横向溢出 | `overflow-x: auto`；无滚动条样式定制（保留系统滚动条，暗色由 `color-scheme` 处理） |

**无障碍**：代码必须是**真实文本**，禁止图片渲染代码；`pre` 可聚焦（`tabindex="0"`）+ `aria-label="<语言> 代码示例"`，使键盘用户可横向滚动；语法高亮配色**必须逐色实测 ≥4.5:1**（与代码块底对比），不达标则降级为"单色 + 关键字加粗"（见 §12 U2）；不依赖颜色单独区分语法（关键字同时加粗）；复制按钮属 P1（F-16），MVP 不做。

---

### 6.8 行内代码 InlineCode `.prose :not(pre) > code`

**用途**：正文中的标识符、路径、命令、字段名。

**结构**：Markdown 反引号直接产出 `<code>`，无额外包裹。

**尺寸与间距**：`--font-mono`；字号 `0.9em`（相对正文 ≈14.4px）；padding `0.1em 0.35em`；圆角 `--radius-sm`；`word-break: break-word`。

**状态**

| 状态 | 表现 |
|---|---|
| 默认 | 背景 `--color-surface-2`；文字 `--color-text`（15.99:1 / 12.96:1 ✅）；**无边框** |
| hover / active / disabled | 不适用（非交互元素） |
| 位于链接内 | 继承链接色与下划线，背景保持 `--color-surface-2` |

**无障碍**：保持语义 `<code>`；不使用 `::before/::after` 添加装饰引号（会被部分屏幕阅读器朗读）；长路径允许换行，不允许撑破 720px 容器。

---

### 6.9 引用块 Blockquote `.prose blockquote`

**用途**：引用他人观点、原文摘录。

**结构**

```html
<blockquote>
  <p>被引用的原文。</p>
  <cite>—— 出处</cite>
</blockquote>
```

**尺寸与间距**：边框左 2px `--color-border`（**不用强调色**）；padding-left `--space-4`；正文保持 `--fs-body` / `--lh-body`；`cite` `--fs-xs` + `--color-text-secondary`；上下间距 `--space-6`；嵌套引用第二层左轨 1px。

**状态**：非交互元素，默认/hover/focus/active/disabled 全部不适用；**不给 blockquote 加背景色**（避免与代码块抢视觉）。

**无障碍**：引用文字**保持 `--color-text` 全对比**（15.99–17.32:1）——中文长引用一旦降对比就会累眼，这是与英文站点常见的做法刻意不同之处；`<cite>` 仅用于作品名/出处，不用于人名（人名用普通文本或 `<footer>` 包裹）。

---

### 6.10 表格 Table `.prose table`

**用途**：对比矩阵、参数表、清单。

**结构**（Markdown GFM 产出，构建期需包一层滚动容器）

```html
<div class="table-wrap" tabindex="0" role="group" aria-label="表格：SSG 对比（可横向滚动）">
  <table>
    <thead><tr><th scope="col">方案</th><th scope="col">得分</th></tr></thead>
    <tbody><tr><td>Astro</td><td>4.35</td></tr></tbody>
  </table>
</div>
```

**尺寸与间距**：宽 100%；`border-collapse: collapse`；单元格 padding 8px 12px；表头 `--fs-sm` + 600 + 背景 `--color-surface-2`；单元格 `--fs-sm` / `--lh-compact`；行分隔为 `border-bottom: 1px solid var(--color-border)`（**不用竖线网格**）；与上下文 `--space-6`。

**状态**

| 状态 | 表现 |
|---|---|
| 默认 | 表头底 `--color-surface-2`；无斑马纹 |
| hover（行） | 背景 `--color-surface-2`（**仅在宽表且行可点时使用；MVP 默认不加**，避免"表格像可点"的误导） |
| focus-visible（滚动容器） | 焦点环 |
| active / disabled | 不适用 |

**无障碍**：必须保留表头（GFM 表格天然有 `<thead>`）；`<th>` 需带 `scope="col"`——**remark-gfm 是否默认输出 scope 未实测**（见 §12 U4，M3 验证，缺失则加 rehype 插件补）；表格必须有 `<caption>` 或紧邻的说明文字（Markdown 无 caption 语法时，用斜体行"表 N · 说明"承载）；窄屏用 `.table-wrap { overflow-x: auto }` + `tabindex="0"` + `aria-label`，**不把表格转成卡片**；数字列加 `font-variant-numeric: tabular-nums`。

---

### 6.11 图片与图注 Figure `.prose figure`

**用途**：正文插图、截图、示意图。

**结构**

```html
<figure>
  <img src="/posts/2026-09-30-xxx/diagram.webp"
       srcset="… 720w, … 1440w" sizes="(max-width: 720px) 100vw, 720px"
       width="1440" height="900" loading="lazy" decoding="async"
       alt="令牌两层结构的示意图：原始层指向语义层，组件只引用语义层">
  <figcaption>图 1 · 两层令牌的引用方向</figcaption>
</figure>
```

**尺寸与间距**：宽度 ≤ 720px（`max-width: 100%; height: auto`）；圆角 `--radius-md`；图注 `--fs-xs` + `--color-text-secondary`，居中，上边距 `--space-2`；图片与上下文 `--space-6`。

**状态**

| 状态 | 表现 |
|---|---|
| 默认 | 圆角 + 无边框 + 无阴影 |
| 加载中 | 由 `width/height` 预留空间（**防 CLS**）；不使用骨架屏动画 |
| 加载失败 | 显示 `alt` 文本 + 1px `--color-border` 的占位框（PRD §9） |
| hover / active | 无变化；**MVP 不做灯箱**（F-17 属 P1） |
| disabled | 不适用 |

**无障碍**：`alt` 必填——内容图写"图在表达什么"，装饰图写 `alt=""`；图注用 `<figcaption>`（不要用 `<p class="caption">`）；`width`/`height` 必填（CLS < 0.1）；关键信息不得只存在于图片里；图片优先 `.webp`、宽度 ≤1600px（PRD §11）。

---

### 6.12 页脚 Footer `.site-footer`

**用途**：版权、许可、RSS 与联系方式。

**结构**

```html
<footer class="site-footer">
  <div class="site-footer__inner container">
    <p class="site-footer__copy">© 2026 ppy-Blog · 内容采用 CC BY-NC-SA 4.0 许可</p>
    <nav class="site-footer__nav" aria-label="页脚导航">
      <a href="/rss.xml">RSS</a>
      <a href="https://github.com/ppywww" target="_blank" rel="noopener">GitHub<svg class="icon-external" …></svg></a>
      <a href="mailto:…">邮箱</a>
    </nav>
  </div>
</footer>
```

**尺寸与间距**：顶部 1px `--color-border`；上下 padding `--space-8`；文字 `--fs-xs` + `--color-text-secondary`（5.98:1 / 7.18:1 ✅）；两栏之间 `--space-6`；与正文区 `--space-11`。

**状态**

| 状态 | 表现 |
|---|---|
| 默认 | 文字 `--color-text-secondary`；无下划线 |
| hover（链接） | 色 `--color-text-secondary` → `--color-text`；下划线出现（页脚链接默认无下划线，hover 补上） |
| focus-visible | 焦点环 |
| active | 保持 hover 表现 |
| disabled | 不适用 |
| 布局 | ≥900px 左右两栏（`justify-content: space-between`）；<900px 纵向堆叠 + `--space-3` |

**无障碍**：`<footer>` + `<nav aria-label="页脚导航">`；年份在构建期生成（不写死）；外链 `rel="noopener"` + 可见外链图标（图标 `aria-hidden="true"`，语义靠文字）。

---

### 6.13 面包屑 Breadcrumb `.breadcrumb`

**用途**：文章页层级定位（首页 / 分类 / 标题）。

**结构**

```html
<nav class="breadcrumb" aria-label="面包屑">
  <ol class="breadcrumb__list">
    <li class="breadcrumb__item"><a href="/">首页</a></li>
    <li class="breadcrumb__item"><a href="/categories/tech/">技术</a></li>
    <li class="breadcrumb__item" aria-current="page">文章标题</li>
  </ol>
</nav>
```

**尺寸与间距**：`--fs-xs`；项之间 `--space-2`；分隔符用 CSS 伪元素 `.breadcrumb__item + .breadcrumb__item::before { content: "/"; color: var(--color-border) }`（**不在 DOM 里写分隔符**，避免屏幕阅读器朗读"/"）；与 H1 `--space-4`。

**状态**

| 状态 | 表现 |
|---|---|
| 默认 | 链接 `--color-text-secondary`；末项 `--color-text`（**不加粗**，靠 `aria-current` 与位置区分） |
| hover | 链接色 → `--color-text` + 下划线 |
| focus-visible | 焦点环 |
| active | 保持 hover |
| disabled | 不适用；末项**不渲染为链接**（不是"禁用的链接"） |
| 超长标题 | 末项 `max-width: 26ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap`（完整标题由 H1 承载） |

**无障碍**：`<nav aria-label="面包屑">` + `<ol>`（层级有序）；末项 `aria-current="page"`；分隔符为 CSS 生成内容，不进 DOM 文本。

---

### 6.14 按钮 Button `.btn` / `.icon-btn`

**用途**：动作触发（返回首页、订阅、重置主题等）。**注意：页面跳转用 `<a>`，动作才用 `<button>`**。

**结构**

```html
<a class="btn btn--primary" href="/">返回首页</a>
<button class="btn btn--secondary" type="button">复制链接</button>
<button class="btn btn--ghost" type="button" aria-expanded="false">显示更多</button>
<button class="icon-btn" type="button" aria-label="返回顶部"><svg …></svg></button>
```

**尺寸**：默认高 40px、padding 0 `--space-5`、`--fs-sm`、500 字重、圆角 `--radius-sm`；`.btn--sm` 高 32px / padding 0 `--space-4`；`.icon-btn` 36×36（图标 18×18）；coarse pointer 下全部 ≥44×44 命中区。

**间距**：相邻按钮 `--space-3`；按钮组与上下文 `--space-6`。

**状态**

| 状态 | `.btn--primary` | `.btn--secondary` | `.btn--ghost` | `.icon-btn` |
|---|---|---|---|---|
