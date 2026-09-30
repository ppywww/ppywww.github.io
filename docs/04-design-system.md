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

### 2.2 原始层色板 `--palette-*`（v1.1 · **以 `src/styles/tokens.css` 为准**）

> **2026-09-30 同步（task-25 · 依 G-03「原始层以代码为准」）**：v1.1 换肤后原始层**命名已变**——旧的 `--palette-paper-*` / `--palette-night-*` **在代码中已不存在**，现行是 `white` / `gray-*` / `ink-*` / `indigo-*`。本节按 `tokens.css` 逐值重写，凡引用旧名的写法一律视为错误。

| Token | 值 | 用途（注释摘自 `tokens.css`） |
|---|---|---|
| `--palette-white` | `#FFFFFF` | 文章页底 / 卡片底 / 行内代码底 / 强调块上的文字 |
| `--palette-gray-50` | `#F5F5F5` | 列表页底色 / 行内代码底 |
| `--palette-gray-100` | `#EEEEEE` | 边框 |
| `--palette-gray-300` | `#D6D6D6` | tertiary：分隔符 / 禁用态（**不可作正文色**） |
| `--palette-gray-400` | `#AAAAAA` | 浅灰文字（亮色端不用，暗色端 secondary） |
| `--palette-gray-500` | `#6C6C6C` | 亮色端 secondary：元信息、摘要 |
| `--palette-gray-800` | `#333333` | 暗色边框 |
| `--palette-gray-900` | `#1F1F1F` | 06 §1.1 的 `--content`（与 `#1E1E1E` 无感知差异，`tokens.css` 不单独使用） |
| `--palette-gray-950` | `#1E1E1E` | 亮色端正文 / 标题（06 §1.1 的 `--primary`） |
| `--palette-ink-950` | `#1D1E20` | 暗色页面底 |
| `--palette-ink-900` | `#2E2E33` | 暗色卡片底 |
| `--palette-ink-800` | `#37383E` | 暗色 surface-2 |
| `--palette-ink-700` | `#414244` | 暗色 tertiary |
| `--palette-ink-400` | `#9B9C9D` | 06 的暗色 secondary —— **未采用**（在 `#37383E` 上仅 4.25:1，见 §2.5） |
| `--palette-ink-200` | `#C4C4C5` | 暗色正文备选（06 §1.1，未使用） |
| `--palette-ink-100` | `#DADADB` | 暗色正文 / 标题 |
| `--palette-code-block` | `#1C1D21` | 代码块底（PaperMod 原值，本文件用于暗色端） |
| `--palette-indigo-600` | `#3B4CE0` | 强调色（亮色） |
| `--palette-indigo-700` | `#2F3DC4` | 强调色 hover（亮色） |
| `--palette-indigo-300` | `#8E9CFF` | 强调色（暗色，提亮——借 Josh Comeau「同一品牌色两种底色要两个值」的实测策略） |
| `--palette-indigo-200` | `#A8B4FF` | 强调色 hover（暗色） |

**命名规则**（易记反，务必看清）：`white` 是唯一无级号值；`gray-*` 是**亮色**中性阶（数字越大越深）；`ink-*` 是**暗色**中性阶（数字越大**也**越深）；`indigo-*` 是强调色阶。

### 2.3 语义层 `--color-*`

**亮色（`:root`，默认主题）**

| 语义 Token | 值（引用原始层） | 解析值 | 用途 |
|---|---|---|---|
| `--color-bg` | `var(--palette-white)` | `#FFFFFF` | 文章页底 |
| `--color-bg-list` | `var(--palette-gray-50)` | `#F5F5F5` | **列表类页面底**（`body.list`：首页 / 文章列表 / 归档 / 标签 / 分类）。v1.1 新增 |
| `--color-surface` | `var(--palette-white)` | `#FFFFFF` | 卡片底 |
| `--color-surface-2` | `var(--palette-gray-50)` | `#F5F5F5` | 标签底 / hover 底 / 行内代码底 |
| `--color-text` | `var(--palette-gray-950)` | `#1E1E1E` | 正文 / 标题 |
| `--color-text-secondary` | `var(--palette-gray-500)` | `#6C6C6C` | 元信息 / 摘要 / 图注 / 占位符 |
| `--color-text-tertiary` | `var(--palette-gray-300)` | `#D6D6D6` | 分隔符 / 禁用态（1.45:1，**不可作正文色**） |
| `--color-border` | `var(--palette-gray-100)` | `#EEEEEE` | 边框 / 分隔线（纯装饰） |
| `--color-link-hover` | `var(--palette-gray-400)` | `#AAAAAA` | 06 §1.2 的链接 hover。**G-15 后链接 hover 改走强调色**，此 token 保留但当前无消费者 |
| `--color-code-bg` | `var(--palette-white)` | `#FFFFFF` | 代码块底（**与构建期 `CODE_BG` 耦合，见 §2.7 不变式**） |
| `--color-accent` | `var(--palette-indigo-600)` | `#3B4CE0` | 按钮底 / 当前项标记 |
| `--color-accent-hover` | `var(--palette-indigo-700)` | `#2F3DC4` | 强调 hover |
| `--color-accent-text` | `var(--palette-indigo-600)` | `#3B4CE0` | 正文尺寸的链接文字 |
| `--color-on-accent` | `var(--palette-white)` | `#FFFFFF` | 强调色块上的文字 |
| `--color-focus` | `var(--palette-indigo-600)` | `#3B4CE0` | 焦点环（交互控件状态，计入 §2.6 允许范围） |

**暗色（`:root.dark`）**

| 语义 Token | 值（引用原始层） | 解析值 | 备注 |
|---|---|---|---|
| `--color-bg` | `var(--palette-ink-950)` | `#1D1E20` | |
| `--color-bg-list` | `var(--palette-ink-950)` | `#1D1E20` | 暗色下列表页与文章页**同色**（06 §1.3） |
| `--color-surface` | `var(--palette-ink-900)` | `#2E2E33` | |
| `--color-surface-2` | `var(--palette-ink-800)` | `#37383E` | |
| `--color-text` | `var(--palette-ink-100)` | `#DADADB` | **永不用纯白** |
| `--color-text-secondary` | `var(--palette-gray-400)` | `#AAAAAA` | **刻意不用 06 的 `#9B9C9D`**：它在 `#37383E` 上只有 4.25:1，13px 标签文字不达 AA |
| `--color-text-tertiary` | `var(--palette-ink-700)` | `#414244` | |
| `--color-border` | `var(--palette-gray-800)` | `#333333` | |
| `--color-link-hover` | `var(--palette-gray-400)` | `#AAAAAA` | 亮暗同值（06 §1.3） |
| `--color-code-bg` | `var(--palette-code-block)` | `#1C1D21` | **刻意不用 06 的 `#2E2E33`**：只有 3.87:1 |
| `--color-accent` | `var(--palette-indigo-300)` | `#8E9CFF` | 提亮，保证暗底上的对比度 |
| `--color-accent-hover` | `var(--palette-indigo-200)` | `#A8B4FF` | |
| `--color-accent-text` | `var(--palette-indigo-300)` | `#8E9CFF` | |
| `--color-on-accent` | `var(--palette-ink-950)` | `#1D1E20` | 暗色下强调块是浅靛蓝，故其上的文字取深墨 |
| `--color-focus` | `var(--palette-indigo-300)` | `#8E9CFF` | |

**无 JS 回退（`@media (prefers-color-scheme: dark) { :root:not(.light) { … } }`）**：与暗色块**逐值相同**，写在 `tokens.css` 文件末尾（避免影响构建期解析）。

> **三处同步铁律**：亮色 `:root` / 暗色 `:root.dark` / 回退 `:root:not(.light)` —— **改颜色必须三处一起改**。只改一处 = 违规（回退块漏改会在「未手动选过主题 + 系统为暗色」的用户那里表现为掉色）。

**移动端收窄（`@media (max-width: 768px)`）**：只改两个布局 token，不动颜色 —— `--gap: 14px`、`--header-height: 56px`。


### 2.4 令牌实现 `src/styles/tokens.css`（结构与同步规则）

> **2026-09-30 变更（task-25）**：本节原为「完整令牌 CSS（可直接粘贴）」的**逐字副本**。v1.1 换肤后 **`src/styles/tokens.css` 已是唯一实现**，文档里再养一份副本等于制造第二个真相源（两边各改一半就是事故）—— 故本节改为**结构与规则说明，不再复制 CSS 全文**。任何色值以 `tokens.css` 为准（G-03：原始层以代码为准）。

**文件结构（7 个块，顺序不可乱）**

| # | 选择器 | 职责 | 关键内容 |
|---|---|---|---|
| ① | `:root` | 原始层：灰阶 + 强调色阶 | `--palette-white` / `--palette-gray-*`（亮色中性阶）/ `--palette-ink-*`（暗色中性阶）/ `--palette-indigo-*`（强调） |
| ② | `:root` | 字体 / 字号 / 行高 / 字重 | `--font-body`、`--font-mono`、`--font-size-*`、`--line-height-*`、`--font-weight-*` |
| ③ | `:root` | 间距 / 圆角 / 阴影 / 布局 / 动效 | `--space-1…12`、`--gap`、`--card-padding`、`--radius*`、`--shadow-card`、`--container-width` / `--column-width` / `--content-width`、`--header-height` / `--footer-height`、`--dur-press` |
| ④ | `:root` | **亮色**语义层 + `color-scheme: light` | 见 §2.3 亮色表 |
| ⑤ | `:root.dark` | **暗色**语义层 + `color-scheme: dark` | 见 §2.3 暗色表 |
| ⑥ | `@media (prefers-color-scheme: dark) { :root:not(.light) { … } }` | **无 JS 回退**（未手动选过主题时跟随系统） | 与 ⑤ **逐值相同** |
| ⑦ | `@media (max-width: 768px) { :root { … } }` | 移动端收窄 | `--gap: 14px`；`--header-height: 56px` |

**六条铁律**

1. **组件只引用语义层**：组件 CSS 里出现 `--palette-*` 或裸色值即为违规；`--palette-*` 只允许出现在 `tokens.css` 内。
2. **颜色三处同步**：亮色 `:root` / 暗色 `:root.dark` / 回退 `:root:not(.light)`。只改一处 = 违规。
3. **列宽三 token 不得互换**：`--content-width` 720px（正文列，被 8 个文件读取）/ `--column-width` 768px（内容列）/ `--container-width` 1024px（容器）。
4. **`--header-height` 是下限也是上限**：它同时是页头 `min-height`、skip-link 定位基准、TOC 锚点偏移基准。页头在**任何**断点都不得超过它（<768px 时 5 个导航项折进汉堡面板，页头因此稳定在 56px）。
5. **`--radius-sm` 与 `--radius-md` 当前同值**（都指向 `--radius: 8px`）。保留两个名字是为了将来「控件圆角 ≠ 容器圆角」时可分别调整 —— **不要因为同值就删掉其中一个**。
6. **`--shadow-card` 的值是 `none`**：变量名保留（06 §3 要求卡片无阴影，`.card` 仍在 `box-shadow: var(--shadow-card)` 引用它）。删名不会报错，只会静默失去声明。

**变更流程**：改 `tokens.css` → 同步本文档 §2.2 / §2.3 / §2.5 → 若涉及代码块底色，先读 §2.7 不变式 → 亮 / 暗两套截图对比复验。


### 2.5 对比度实测（按 v1.1 现行色板实算，非估计）

> 实算日期 **2026-09-30**；色值取自 `src/styles/tokens.css`（v1.1 换肤后）。方法：WCAG 2.1 相对亮度公式，本地脚本计算。

| 组合 | 亮色 | 暗色 | 门槛 | 结论 |
|---|---|---|---|---|
| 正文 / 文章页底 | **16.67:1** | **11.94:1** | ≥4.5（AA 文本） | ✅ |
| 正文 / 列表页底（`body.list`） | **15.29:1** | **11.94:1** | ≥4.5 | ✅ |
| 正文 / surface（卡片） | **16.67:1** | **9.67:1** | ≥4.5 | ✅ |
| 次文字 / 文章页底 | **5.25:1** | **7.18:1** | ≥4.5 | ✅ |
| 次文字 / 列表页底 | **4.82:1** | **7.18:1** | ≥4.5 | ✅ |
| 次文字 / surface（卡片） | **5.25:1** | **5.81:1** | ≥4.5 | ✅ |
| 次文字 / surface-2（标签、行内代码底） | **4.82:1** | **5.03:1** | ≥4.5 | ✅ |
| 强调（文字链接）/ 文章页底 | **6.37:1** | **6.63:1** | ≥4.5 | ✅ |
| 强调（文字链接）/ 列表页底 | **5.84:1** | **6.63:1** | ≥4.5 | ✅ |
| 强调（文字链接）/ surface-2 | **5.84:1** | **4.64:1** | ≥4.5 | ✅（余量最小的一格） |
| 按钮文字 / 靛蓝按钮底 | **6.37:1** | **6.63:1** | ≥4.5 | ✅ |
| 按钮文字 / 按钮 hover 底 | **8.12:1** | **8.45:1** | ≥4.5 | ✅ |
| `mark` 高亮底上的正文 | **15.29:1** | **8.36:1** | ≥4.5 | ✅ |
| 焦点环 / 页面底（非文本） | **6.37:1** | **6.63:1** | ≥3（非文本 UI） | ✅ |
| tertiary 分隔符 / 页面底 | 1.45:1 | 1.66:1 | 不适用 | ⚠️ **仅装饰，不承载信息**（见 §5.3） |
| 边框 / 页面底 | 1.16:1 | 1.32:1 | 不适用 | ⚠️ **仅装饰，不承载信息**（见 §5.3） |

**两条被实测否掉的 06 原值**（记录在案，防止有人「照 06 回改」）：

- `--color-text-secondary` 暗色：06 §1.3 的 `#9B9C9D` 在 `#37383E` 上只有 **4.25:1** → 改用 `#AAAAAA`（5.03:1）。
- `--color-code-bg` 暗色：06 §1.3 的 `#2E2E33` 只有 **3.87:1** → 改用 `#1C1D21`（4.82:1）。

**代码块内的 token 颜色不在本表断言**：它随 Shiki 主题与构建期兜底变化，由 `scripts/qa-contrast/check-code-tokens.mjs` 对**构建产物逐条实算（不抽样）**。本表只保证代码块**底色**本身，其不变式见 §2.7。

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

### 2.7 代码块底色不变式（构建期耦合 · 2026-09-30 · task-19）

**不变式（硬约束）**：`src/styles/tokens.css` 的 `--color-code-bg` **必须与 `astro.config.mjs` 的 `CODE_BG` 同值，或更保守** —— **亮色端更浅、暗色端更深**。

**为什么**：`astro.config.mjs` 的 Shiki transformer 以 `CODE_BG` 为基准，把**每一个**语法 token 颜色二分混合兜底到 ≥4.5:1（见该文件顶部注释与 `ensureContrast`）。若实际代码底色比 `CODE_BG` 更暗（亮色端）或更亮（暗色端），兜底就是按**错误的基准**算的 —— **对比度门禁被静默踩穿**：构建照常通过，只有 `scripts/qa-contrast/check-code-tokens.mjs` 对构建产物逐条实算才能发现。

**当前取值（2026-09-30 实测）**

| 主题 | `CODE_BG`（`astro.config.mjs`） | `--color-code-bg`（`tokens.css`） | 关系 | 实测对比度 |
|---|---|---|---|---|
| 亮色 | `#F7F8FA` | `#FFFFFF`（`--palette-white`） | **更浅** ✅ | 4.80:1 |
| 暗色 | `#1F232B` | `#1C1D21`（`--palette-code-block`） | **更深** ✅ | 4.82:1 |

> 这两条"更保守"的取值都是被实测逼出来的：亮色端 `#F5F5F5` 只有 4.40:1（不达标）；暗色端 `06-visual-spec` §1.3 的 `#2E2E33` 只有 3.87:1（不达标）。

**改代码块配色时的强制流程**：同时改 `astro.config.mjs` 的 `CODE_BG` 与 `tokens.css` 的 `--color-code-bg`（**三处**：`:root` / `:root.dark` / `@media (prefers-color-scheme: dark)` 回退块）→ 重跑 `node scripts/qa-contrast/check-code-tokens.mjs` → 全绿才算完成。**只改一处 = 违规。**

---

## 3. 排版规范

### 3.1 字号阶与用途（v1.1 · 以 `src/styles/tokens.css` 为准）

| Token | 值 | 用途 | 行高 | 字重 |
|---|---|---|---|---|
| `--font-size-page-title` | **40px** / 2.5rem | 列表 / 归档 / 标签 / 分类页 `h1` | `--line-height-tight` 1.3 | 700 |
| `--font-size-post-title` | **36px** / 2.25rem | 文章页标题 | 1.3 | 700 |
| `--font-size-h1` | **34px** / 2.125rem | 首页问候 `h1`；404 装饰数字（降级使用） | `--line-height-h1` 1.3 | 700 |
| `--font-size-brand` | **24px** / 1.5rem | 站名 / logo | — | 700 |
| `--font-size-h2` | **24px** / 1.5rem | 正文 `h2`、**卡片标题** | `--line-height-h2` 1.45（卡片标题用 `--line-height-tight` 1.3） | 700 |
| `--font-size-h3` | **19px** / 1.1875rem | 正文 `h3`、搜索结果标题、归档年份标签、评论区标题 | `--line-height-h3` 1.5 | 700 |
| `--font-size-body` | **16px** / 1rem | 正文（PRD G2 门槛 ≥16px）、导航项、profile 一句话 | `--line-height-body` 1.75 | 400 |
| `--font-size-sm` | **14px** / 0.875rem | 卡片摘要、页脚、空态、归档条目、按钮 | `--line-height-compact` 1.6 | 400 |
| `--font-size-xs` | **13px** / 0.8125rem | 元信息、标签、图注、TOC、面包屑 | 1.6 | 400 |

> **v1.1 变更（2026-09-30 · task-25）**：
> ① v1.0 的旧字号命名与「字号硬上限 30px」**全部作废**；现行 token 名为 `--font-size-*`，**最大字号 40px**（列表页 `h1`）。
> ② v1.0 的 `--fs-display` 44px **在代码中不存在** —— 404 装饰数字降级使用 `--font-size-h1`（34px），不再单设一档。
> ③ **没有 `--font-size-2xs`**：v1.0 的 12px「代码块语言标签」档已取消，代码块内部统一 `0.9em`（相对正文 ≈14.4px）。

### 3.2 行高与字重

- 行高只允许取 `--line-height-*` 五档（`tight` 1.3 / `h2` 1.45 / `h3` 1.5 / `compact` 1.6 / `body` 1.75），禁止行内写 `line-height: 1.6` 这类魔法数。
- **字重只有两档 token**：`--font-weight-body` **400**、`--font-weight-heading` **700**。标题统一 700（06 §2）。
- **v1.0 的「禁止 700+」已作废**；中文粗体在系统字体下的观感问题改由「字号 + 间距」承担，不靠降低字重。
- **唯一允许的字面量字重是 500**，且全站只有一处：导航当前项 `.nav a[aria-current="page"]`（`base.css`）。新增第三档字重前必须先加 token。
- 中文**一律不使用斜体**：`font-style: normal`。中文字体没有真斜体，浏览器合成倾斜会显著降低可读性；需要强调时用字重 700 + 语义标签（`<strong>` / `<em>` 视觉上都渲染为 700 字重，不倾斜）。
- **中文不使用负字距**：`letter-spacing: 0`。唯一的正字距例外是 mono 语言标签与全大写徽标。


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
  font-weight: var(--font-weight-body);
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
  max-width: var(--content-width);      /* 720px；v1.1 起 token 名与值均不变（**禁止改成 768px**：会让正文列变宽，违反 06 §3 与 PRD G2）；任何视口都不放宽（AC-4） */
  margin-inline: auto;
  font-family: var(--font-body);
  font-size: var(--font-size-body);            /* 16px */
  line-height: var(--line-height-body);          /* 1.75 */
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
/* v1.1（2026-09-30 · task-19；token 命名经 Lead 二轮修正，逐行对齐 src/styles/base.css）
   正文列 720px（--content-width，.prose）/ 内容列 768px（--column-width，.content 内层）/ 容器 1024px（--container-width）
   下面两条 calc 即实现写法：.content 实际 816px、.container 实际 1072px（--gap 24px） */
.container { width: 100%; max-width: calc(var(--container-width) + var(--gap) * 2); margin-inline: auto; padding-inline: var(--gap); }
.content   { width: 100%; max-width: calc(var(--column-width) + var(--gap) * 2); margin-inline: auto; padding-inline: var(--gap); }
.prose     { max-width: var(--content-width); }
```

| 断点 | 范围 | 变化 |
|---|---|---|
| **xs** | **< 768px** | 单列；`--gap` 收窄为 **14px**（页面左右留白 / 卡片 padding / 卡间距同步收窄）；`--header-height` 降为 **56px**；顶部导航折进**汉堡下拉面板**（见 §6.1）；TOC 为折叠块 |
| **md** | **768–899px** | `--gap` 回到 **24px**；容器左右留白 24px；卡片 padding 24px；h2 上边距 44px |
| **lg** | ≥ 900px | 顶部导航完整展开；页脚两栏；归档页启用「年份脊」（sticky）；作品页网格 ≥2 列 |
| **xl** | ≥ 1080px | 容器实际渲染 **1072px**（= `--container-width` 1024px + `--gap`×2，见 §4.2 上方代码块）；**正文仍锁 720px 居中**，不随视口变宽 |

> CSS 媒体查询条件里**必须写字面值**（`@media (min-width: 900px)`），CSS 变量不能用于媒体查询条件；`tokens.css` 中的断点注释仅供文档与 JS 引用。
>
> **v1.1 变更（2026-09-30 · task-25）**：v1.0 的「<640px 容器左右 16px / 卡片 padding 16px 20px / ≥640px 容器左右 24px」**已作废**。v1.1 起：**断点只有 768 / 900 / 1080 三个**，容器左右留白与卡片 padding 统一随 `--gap` 走（桌面 24px、≤768px 14px），`base.css` 中已无 640px 的 padding 媒体查询。


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
| `--radius` | **8px** | 全站基准圆角（**唯一字面量**，其余两个必须引用它） |
| `--radius-sm` | `var(--radius)` → **8px** | 控件：按钮、输入框、分页项、行内代码、焦点环、TOC、skip-link |
| `--radius-md` | `var(--radius)` → **8px** | 容器：卡片、代码块、图片、搜索结果项 |
| `--radius-full` | 999px | 标签胶囊 |

规则：卡片内部元素圆角 ≤ 卡片圆角；**全站圆角上限 8px**；同一元素不混用两种圆角。

> **v1.1 变更（2026-09-30 · task-25）**：v1.0 的「`--radius-sm` 4px + `--radius-md` 6px + 全站不超过 6px」**已作废**。v1.1 起 `--radius-sm` 与 `--radius-md` **同值**（都等于 `--radius` 8px）—— 保留两个名字是为将来「控件圆角 ≠ 容器圆角」时可分别调整，**不要因为同值就删掉其中一个**。

### 5.2 阴影（v1.1：全站无阴影）

| Token | 值 | 说明 |
|---|---|---|
| `--shadow-card` | **`none`** | 卡片无阴影（06 §3）。**变量名保留**，`.card` 仍写 `box-shadow: var(--shadow-card)` |

规则：全站**不存在任何可见阴影**。禁止：hover 抬升（`translateY(-2px)` + 阴影变大）、多层阴影、彩色阴影、`backdrop-filter` 毛玻璃、`box-shadow` 发光。
卡片边界一律由 `1px solid var(--color-border)` 表达，**暗色下也不再补描边**。

> **v1.1 变更（2026-09-30 · task-25）**：v1.0 的 `0 1px 2px rgba(16,18,22,.05)`（亮色）与 `0 0 0 1px var(--color-border)`（暗色兜底）**均已作废**，现行值是 `none`。保留变量名而非删名，是因为 `box-shadow: var(--shadow-card)` 在变量缺失时**不会报错、只会静默失去声明**。


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
  <div class="container site-header__inner">
    <a class="brand" href="/">ppy-Blog</a>

    <div class="site-header__nav">
      <!-- 桌面端平铺；<768px 时同一个元素变成汉堡下拉面板（不复制导航项，避免 DOM 与字节翻倍） -->
      <nav id="site-menu" class="site-menu" aria-label="主导航">
        <ul class="nav">
          <li><a href="/" aria-current="page">首页</a></li>
          <li><a href="/posts/">文章</a></li>
          <li><a href="/archives/">归档</a></li>
          <li><a href="/works/">作品</a></li>
          <li><a href="/about/">关于</a></li>
          <li class="nav__mobile-only"><a href="/search/">搜索</a></li>
        </ul>
      </nav>

      <div class="site-header__actions">
        <a class="icon-btn" href="/search/" aria-label="站内搜索" title="站内搜索"><svg …></svg></a>
        <button class="btn theme-toggle" type="button" data-theme-toggle aria-pressed="false" aria-label="切换深色模式">…</button>
        <!-- 汉堡按钮：<768px 显示；桌面端 display:none（行为与样式在桌面端完全不变） -->
        <button class="icon-btn menu-toggle" type="button" aria-expanded="false" aria-controls="site-menu" aria-label="导航菜单"><svg …></svg></button>
      </div>
    </div>
  </div>
</header>
<a class="skip-link" href="#main-content">跳到正文</a>
```

**尺寸**：`--header-height` **60px**（`min-height`，`<768px` 时降为 **56px**）；品牌名 `--font-size-brand` 24px / 700；导航项 `--font-size-body` 16px；`.icon-btn` 视觉 36×36（`pointer: coarse` 下 44×44）；汉堡按钮同 `.icon-btn`。

**间距**：`.site-header__inner` 即 `.container`（左右留白 = `--gap`，桌面 24px / `<768px` 14px）；品牌与导航之间 `--gap`；`.site-header__nav` 内 `--space-2`；导航项之间 `--space-1`；动作区间 `--space-1`。

**状态**

| 状态 | 表现 |
|---|---|
| 默认 | `position: sticky; top: 0; z-index: 10;` 背景 `--color-bg`；底边 `1px solid var(--color-border)`；**无阴影、无毛玻璃**。**⚠️ 此为对参考站的「故意偏离」（v1.1 · 2026-09-30 · task-19）**：参考站（Lil'Log / PaperMod）页头**既无 sticky 也无底线**，我们**保留 sticky + 1px 底线**——理由是长文里导航 / 搜索 / 返回的可用性，属功能决策而非风格决策（出处：`docs/06-visual-spec.md` §5 第 2 条「故意不抄」） |
| hover（导航项） | 色 `--color-text-secondary` → `--color-text` |
| focus-visible | 全局焦点环（§8.1） |
| active | 色保持 hover；不加位移 |
| 当前项 | `aria-current="page"` → 色 `--color-accent-text`、字重 **500**、底边 2px `currentColor`（颜色 + 字重 + 下划线**三通道**，不只靠颜色） |
| 移动端（**< 768px**） | `.menu-toggle` 与 `.nav__mobile-only` 显示；`.site-menu` 变为**绝对定位下拉面板**（`top: 100%` / `inset-inline: 0` / `max-height: calc(100dvh - var(--header-height))` / `z-index: 15`，关闭态 `display:none` 故**零高度、不产生 CLS**），开合由 JS 切 `.is-open`；导航项改整行可点（`min-height: 44px`）；面板背景 `--color-surface`、底边 1px |
| disabled | 不适用（导航项恒可用） |

**无障碍**：`<header>` + `<nav aria-label="主导航">`；当前项 `aria-current="page"`；图标按钮必须有 `aria-label`（描述动作，不是图标名）；SVG `aria-hidden="true"`；汉堡按钮用 `aria-expanded` + `aria-controls="site-menu"` 表达开合；页面第一个可聚焦元素是 `.skip-link`；Tab 顺序：skip-link → 品牌 → 导航项 → 搜索 → 主题 → 菜单。

**无 JS 降级**：`@media (scripting: none)` 下 `.site-menu` 恢复为**平铺导航**、汉堡按钮隐藏。菜单在无 JS（含脚本被拦截）时**依然完全可读**，不会出现「打不开的菜单」。

**为什么移动端菜单用 JS 按钮而不是原生 `<details>`（G-23 追认实现）**

v1.0 设计的是「原生 `<details>` 零 JS 展开」，实现改成了「JS 按钮 + 768px 断点」。**追认实现的理由**：`<details>` 给不了三条对**覆盖式下拉面板**必需的无障碍能力 ——

1. **Esc 关闭**：面板盖住正文，键盘用户必须能一键退出；
2. **焦点归还**：关闭后焦点要回到汉堡按钮，否则焦点会掉回文档开头（读屏用户直接迷失）；
3. **点击外部关闭**：鼠标/触屏用户点正文应自然收起，`<details>` 无内置行为，自己实现等于也要写 JS。

代价是需要 JS —— 用 `@media (scripting: none)` 退回平铺导航兜底（见上）。**注**：文章目录 TOC（§6.6）继续使用原生 `<details>`，因为它**不覆盖正文**、也不需要 Esc / 焦点归还，零 JS 更划算 —— 两处取舍不同，不是前后矛盾。

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

**尺寸**：宽 100%（列表容器内层 720px）；标题 **24px** / `--line-height-tight` / **700**；摘要 **14px** / `--line-height-compact`，**最多 2 行**；元信息 **`--font-size-xs` 13px**。**v1.1 修订（2026-09-30 · task-19，依 `06-visual-spec.md` §2）**：标题由 `--fs-h3` 18.4px / 600 改为 **24px / 700**；摘要由 `--font-size-sm` 15px 改为 **14px**；元信息 13px 不变。

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

**尺寸**：高 24px（padding 2px 10px）；`--font-size-xs`；圆角 `--radius-full`；计数与文字间 `--space-1`；coarse pointer 下高 44px 命中区（视觉仍 24px，用 `padding-block` 透明扩展）。

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

**尺寸**：控件高 36px（coarse pointer 44px），序号最小宽 36px，圆角 `--radius-sm`，`--font-size-sm`。

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
  font-size: var(--font-size-xs);
  line-height: var(--line-height-compact);
  text-decoration: none;
}
.toc__link::before {
  content: counter(toc, decimal-leading-zero);   /* 01 02 03 … */
  margin-right: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  opacity: .7;
}
@media (hover: hover) and (pointer: fine) {
  .toc__link:hover { border-left-color: var(--color-accent); color: var(--color-text); }
}
.toc__link:focus-visible { border-left-color: var(--color-accent); color: var(--color-text); }
.toc__item--h3 .toc__link { padding-left: calc(var(--space-3) + var(--space-4)); }  /* 层级缩进 16px */
```

**尺寸**：折叠条高 40px；展开后每项行高 32px；`--font-size-xs`；展开区最大高 `40vh` 且内部滚动（长文目录不占满屏）。

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

**尺寸**：圆角 `--radius-md`；1px `--color-border`；背景 `--color-code-bg`；头部高 32px；代码 `--font-mono` / `--font-size-sm`（14px）/ `--line-height-body`；语言标签 `--font-size-xs` + `letter-spacing: .08em` + 大写 + 500 字重；移动端代码字号不变（**允许横向滚动，不缩小字号**）。

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

**尺寸与间距**：边框左 2px `--color-border`（**不用强调色**）；padding-left `--space-4`；正文保持 `--font-size-body` / `--line-height-body`；`cite` `--font-size-xs` + `--color-text-secondary`；上下间距 `--space-6`；嵌套引用第二层左轨 1px。

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

**尺寸与间距**：宽 100%；`border-collapse: collapse`；单元格 padding 8px 12px；表头 `--font-size-sm` + 600 + 背景 `--color-surface-2`；单元格 `--font-size-sm` / `--line-height-compact`；行分隔为 `border-bottom: 1px solid var(--color-border)`（**不用竖线网格**）；与上下文 `--space-6`。

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

**尺寸与间距**：宽度 ≤ 720px（`max-width: 100%; height: auto`）；圆角 `--radius-md`；图注 `--font-size-xs` + `--color-text-secondary`，居中，上边距 `--space-2`；图片与上下文 `--space-6`。

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

**尺寸与间距**：顶部 1px `--color-border`；上下 padding `--space-8`；文字 `--font-size-xs` + `--color-text-secondary`（5.98:1 / 7.18:1 ✅）；两栏之间 `--space-6`；与正文区 `--space-11`。

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

**尺寸与间距**：`--font-size-xs`；项之间 `--space-2`；分隔符用 CSS 伪元素 `.breadcrumb__item + .breadcrumb__item::before { content: "/"; color: var(--color-border) }`（**不在 DOM 里写分隔符**，避免屏幕阅读器朗读"/"）；与 H1 `--space-4`。

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

### 6.14 按钮 Button `.btn` / `.icon-btn`（v1.1 · 依实现重写）

**用途**：动作触发（返回首页、浏览全部文章、主题切换等）。**注意：页面跳转用 `<a>`，动作才用 `<button>`**。

**结构**

```html
<a class="btn btn--accent" href="/">返回首页</a>          <!-- 跳转用 <a>；主按钮 -->
<a class="btn" href="/posts/">浏览全部文章</a>            <!-- 次级按钮（默认态） -->
<button class="btn theme-toggle" type="button" data-theme-toggle aria-pressed="false" aria-label="切换深色模式">…</button>
<button class="icon-btn menu-toggle" type="button" aria-expanded="false" aria-controls="site-menu" aria-label="导航菜单"><svg …></svg></button>
```

> **2026-09-30 修正（task-25）**：v1.0 写的 `.btn--primary` / `.btn--secondary` / `.btn--ghost` **在代码中并不存在**。现行只有两个变体：**`.btn`（默认，灰阶）** 与 **`.btn--accent`（主按钮，靛蓝）**。语义上「默认 = 次级、`--accent` = 主」，但**类名不叫 secondary / primary** —— 写新页面时不要凭直觉造类名。

**尺寸**

| 变体 | 规格 |
|---|---|
| `.btn` | `padding: var(--space-3) var(--space-4)`、`--font-size-sm`（14px）、`line-height: 1`、`--radius-sm`、`1px var(--color-border)`、底 `--color-surface`、字 `--color-text` |
| `.btn--accent` | 同 `.btn` + 底/边 `--color-accent`、字 `--color-on-accent`；hover 底/边 → `--color-accent-hover` |
| `.theme-toggle` | `.btn` + `padding: var(--space-2)`、36×36；图标 18×18 |
| `.icon-btn` | 36×36（图标 18×18）、`--radius-sm`、字 `--color-text-secondary`，无底无边；`pointer: coarse` 下 44×44 |

**间距**：相邻按钮 `--space-3`；按钮组与上下文 `--space-6`。

**状态**

| 状态 | `.btn` | `.btn--accent` | `.icon-btn` |
|---|---|---|---|
| 默认 | 底 `--color-surface` / 边 `--color-border` / 字 `--color-text` | 底 `--color-accent` / 字 `--color-on-accent` | 字 `--color-text-secondary` |
| hover（仅 `hover: hover` + `pointer: fine`） | 底 → `--color-surface-2` | 底/边 → `--color-accent-hover` | 字 → `--color-text`，底 → `--color-surface-2` |
| focus-visible | 全局焦点环（§8.1） | 同左 | 同左 |
| active | 保持 hover | 保持 hover | 底 → `--color-surface-2` |
| 不可用 | **不用 `disabled` 做「伪禁用」**：不可用即不渲染（`<a>` 没有 `disabled`，伪禁用会骗过辅助技术） | 同左 | 同左 |

**无障碍**：图标按钮必须 `aria-label`（描述**动作**而非图标名）；开合类按钮（汉堡菜单）必须 `aria-expanded` + `aria-controls`；`.btn` 是文字按钮，纯图标一律走 `.icon-btn`；触控目标 ≥44×44（coarse pointer）。

**DoD**：① 亮/暗两态底与字对比度 ≥4.5:1（§2.5 的「按钮文字 / 靛蓝按钮底」6.37 / 6.63 ✅）；② focus-visible 可见；③ 无 `disabled` 伪禁用；④ 组件内无裸色值、无 `--palette-*`。

---

### 6.15 404 区块 `.notfound`（v1.1 · 依实现补写）

**用途**：404 页主体（PRD §7.8 / F-13 / AC-10）。**只要 404 页有出路，用户就不会流失。**

**结构**

```html
<div class="notfound">
  <p class="notfound__code" aria-hidden="true">404</p>
  <h1 class="notfound__title">页面未找到</h1>
  <p class="notfound__desc">这个页面走丢了，可以返回首页或使用站内搜索。</p>
  <div class="notfound__actions"><a class="btn btn--accent" href="/">返回首页</a></div>
  <section class="notfound__recent">
    <h2 class="notfound__recent-title">最新文章</h2>
    <ul class="post-list">…最新 3 篇 PostCard…</ul>
  </section>
</div>
```

**尺寸**：`.notfound` 宽 = `--content-width`（720px）居中，`padding-block: var(--space-11)`；`.notfound__code` 用 `--font-size-h1`（34px）+ `--color-text-secondary`（**降级方案**：v1.0 计划中的 `--fs-display` 44px 在代码中不存在）；`.notfound__title` 上边距 `--space-3`；`.notfound__desc` 上边距 `--space-4`、`--color-text-secondary`、`max-width: 46ch`；`.notfound__actions` 上边距 `--space-6`、`display: flex`、`gap: var(--space-3)`；`.notfound__recent` 上边距 `--space-11`。

**状态**：静态页，无交互状态；按钮走 §6.14。

**无障碍**：装饰数字 `404` **必须 `aria-hidden="true"`**（含义由 `h1` 承载，否则读屏念两遍）；页面唯一 `h1` 是 `.notfound__title`；页面带 `noindex`。

**DoD**：① 有返回首页入口（`.btn--accent`）；② 有搜索入口；③ 有最新 3 篇；④ `404` 数字不进无障碍树。

---

### 6.16 搜索结果项 `.search-result`（v1.1 · 依实现补写）

**用途**：`/search/` 页结果条目（PRD §7.5 / F-05）。结果**由 Pagefind 在客户端渲染**，本节即其运行时模板。

**结构**

```html
<form class="search-form" role="search" action="/search/" method="get">
  <label class="visually-hidden" for="search-input">搜索关键词</label>
  <input class="search-input" id="search-input" type="search" name="q" placeholder="输入关键词…" autocomplete="off" autofocus />
</form>
<p class="search-status" id="search-status" role="status" aria-live="polite"></p>
<ul class="search-results" id="search-results" role="list">
  <li class="search-result">
    <h3 class="search-result__title"><a href="/posts/…/">文章标题</a></h3>
    <p class="search-result__excerpt">…含 <mark>命中词</mark> 的摘要…</p>
    <p class="search-result__meta"><time datetime="2026-09-30">2026-09-30</time></p>
  </li>
</ul>
```

**尺寸**：`.search-results` 宽 = `--content-width`（720px）；`.search-result` `padding: var(--space-4) 0`；相邻项 `border-top: 1px solid var(--color-border)`；标题 `--font-size-h3`（19px）/ `--line-height-h3`、下边距 `--space-2`；摘要 `--font-size-sm`（14px）/ `--line-height-body`、`--color-text-secondary`、下边距 `--space-2`；元信息 `--font-size-xs`（13px），`<time>` 用 `--font-mono` + `tabular-nums`。`.search-input`：`padding-inline: var(--space-3)`、`1px var(--color-border)`、`--radius-sm`、底 `--color-surface-2`、`--font-size-sm`、聚焦边框 → `--color-accent`。

**状态**

| 状态 | 表现 |
|---|---|
| 未输入 | `.search-empty`：「输入关键词开始搜索」+ 示例提示；`.search-empty__actions` **hidden**（不给无用出口） |
| 无结果 | 空态文案改为「没有找到」，`.search-empty__actions` **显示**两个出口：浏览全部文章 / 按标签找 |
| 有结果 | 隐藏空态、渲染结果列表；`role="status"` 播报条数 |
| `mark` 高亮 | 底 `--color-surface-2`、字 `--color-text`、`--radius-sm`、`padding: 0 2px`（**不用黄色**：与灰阶体系冲突且对比度不可控） |
| hover（标题链接） | 色 → `--color-accent-text` + 下划线（仅 `hover: hover`） |

**无障碍**：`<form role="search">` + `visually-hidden` 的 `<label for>`；`<input type="search">` + `autofocus`；状态区 `aria-live="polite"`；结果列表 `role="list"`；**搜不到时必须有出口链接**。

**DoD**：① 输入即出结果；② 「未输入」与「无结果」文案不同；③ 命中词有标记且保留上下文；④ `/search/` 自身 `data-pagefind-ignore` + `noindex`（不搜自己、不计入 SEO 门禁，见 G-09 / G-13）。

---

### 6.17 补充组件（v1.1 · 依实现补写）

> **补写说明（2026-09-30 · task-25）**：v1.0 的 §6.15–§6.17 在早期「占位符替换」事故中**整段丢失**——文档在 §6.14 的表格头处断掉。本节依 v1.1 现行实现补写，覆盖 v1.0 补充组件表的等价内容（原 `.profile-card` 已升级为独立的 §6.19）。

#### 6.17.1 元信息行 `.meta` / `.post-meta`

| 项 | 规格 |
|---|---|
| 用途 | 全站统一的「日期 ｜ 时长 ｜ 分类 ｜ 标签」行（记忆点之一） |
| 结构 | `<time datetime>` + `aria-hidden` 的 `<span class="meta__sep">\|</span>` + 分类链接 + 标签胶囊。**容器用 `<div>` 而非 `<p>`**：标签是 `<ul>`，`<ul>` 不能出现在 `<p>` 内（浏览器会强行截断） |
| 尺寸 | `--font-size-xs`（13px）、`--color-text-secondary`、`gap: var(--space-2)`；`<time>` 用 `--font-mono` + `tabular-nums` |
| 顺序 | 固定 **日期 ｜ 时长 ｜ 主分类 ｜ 标签**，不得调换 |
| 分隔符 | 06 §3 规定用 `\|`（v1.0 用 `·`）；分隔符与元信息**同色**（`inherit`）——v1.0 用 `--color-border`，几乎不可见 |
| 无障碍 | 分隔符 `aria-hidden="true"`（读屏不念「竖线」）；`<time datetime>` 必填；日期格式化固定 `Asia/Shanghai`（避免 CI 时区漂移） |
| DoD | ① 顺序固定；② `datetime` 为 ISO 8601；③ 分隔符不进无障碍树 |

#### 6.17.2 归档条目 `.archive-item` + 年份脊

| 项 | 规格 |
|---|---|
| 用途 | 归档页「年 → 月」分组条目（PRD §7.3，记忆点 M1） |
| 结构 | `<li class="archive-item"><a class="archive-item__link">` 内含 `<time>` / 标题 `<span>` / 时长 `<span>`；年份由左侧「年份脊」承载，月份由分组标题承载 |
| 尺寸 | 条目轨 `grid-template-columns: 56px 1fr auto`、`min-height: var(--space-10)`（40px）、`padding-inline: var(--space-3)`、`--font-size-sm`；日期与时长 `--font-size-xs`、`--color-text-secondary`；日期列只显示 `MM-DD`（年份已在脊上） |
| 年份脊 | ≥900px 时 `.archive__year` 变 `grid-template-columns: 88px 1fr`；年份标签 `position: sticky`（`top` = 页头高 + `--space-4`）；年份数字 `--font-mono` + `tabular-nums` |
| 计数 | 年 / 月标题后的计数用上标（`vertical-align: super`）+ `--font-size-xs` + `--color-text-secondary` |
| hover / active | hover：底 `--color-surface-2` + 左侧 2px `--color-accent` 滑块（`border-left` 预留透明位，避免文字位移）；active：底 `--color-surface-2` |
| 截断 | 标题单行省略号截断（`text-overflow: ellipsis`），**完整标题仍在 DOM 中**（禁止用 JS 截断字符串） |
| 无障碍 | 整行是 `<a>`；年份 `<h2>`、月份 `<h3>`，**层级不得跳级**；`pointer: coarse` 下 `min-height: var(--space-11)`（44px） |
| DoD | ① 年/月计数与实际文章数一致（AC-6）；② 320px 下自动换行不横向溢出；③ 年份脊仅在 ≥900px 启用 |

#### 6.17.3 空态 `.empty`

| 项 | 规格 |
|---|---|
| 用途 | 搜索无结果 / 分类无文章 / 标签为空（PRD §9） |
| 尺寸 | `padding: var(--space-8) 0`；居中；`.empty__title` 字色 `--color-text`、**字号 = 正文字号**（06 §3：主文案不再放大）、字重 400；说明文字 `--font-size-sm` + `--color-text-secondary` |
| 无障碍 | **必须给出一个出口链接**（如「浏览全部文章」）；不允许只有图或只有一句「没有内容」 |
| DoD | ① 有出口链接；② 文案区分「未输入」与「无结果」；③ **无虚线框**（06 §3 已去掉） |

#### 6.17.4 评论区容器 `.giscus-wrap`

| 项 | 规格 |
|---|---|
| 用途 | Giscus 评论（PRD F-08，**默认关闭、逐篇可开**） |
| 三重闸门 | `GISCUS.enabled` 为 false，**或** `repo` / `repoId` / `categoryId` 任一为空 → **不输出任何 DOM、不输出脚本、不留空白块、不打印开发者提示** |
| 懒加载 | 容器初始为空；`IntersectionObserver` 在距评论区 200px 时才注入 `giscus.app/client.js`。**没有评论的文章页零额外脚本**，有评论的页也不会有第三方脚本进首屏 |
| 主题同步 | 注入时按 `html[data-theme]` 取初始主题；`MutationObserver` 监听 `html` 变化后用 `postMessage` 通知 iframe 换肤 |
| 尺寸 | 宽 = `--content-width`（720px）；上边距 `--space-11`；顶部 1px `--color-border`；`padding-top: var(--space-8)`；标题 `--font-size-h3` |
| 无障碍 | `<section aria-labelledby="comments-title">`；**全站唯一第三方资源** |
| 未实测项 | 主题 `postMessage` 换肤**尚未实测**（§12 U6） |
| DoD | ① 未配置时零 DOM；② 首屏不加载第三方脚本；③ 主题切换后 iframe 跟随 |

#### 6.17.5 作品卡片 `.work-card`

| 项 | 规格 |
|---|---|
| 用途 | 作品页卡片（PRD §7.6） |
| 结构 | `<li class="card work-card">`：可选缩略图 + `h2` 名称（+「精选」徽标）+ 一句话 + 技术栈标签 + 链接（GitHub / Demo） |
| 网格 | `.work-grid` 单列；**≥900px 变两列**（`repeat(2, minmax(0, 1fr))`），间距 `--space-5` |
| 尺寸 | 卡片走 §6.3 的 `.card`（底 `--color-surface`、1px `--color-border`、`--radius` 8px、`padding: var(--card-padding)`、**无阴影**） |
| ⚠️ 已知偏离 | `WorkCard.astro` 的标题当前写死 `--font-size-h3`（19px）并注释「锁设计系统 §3.1 的卡片标题 = `--fs-h3` 档」—— **该口径已作废**，卡片标题应为 `--font-size-h2`（24px）。属代码侧待修项（task-25 报出，未在纯文档任务中改码） |
| 外链 | `target="_blank" rel="noopener"`（AC-12）+ 1em 外链图标；Demo 链接文字用**可读域名**，不写「点击这里」 |
| 无障碍 | 缩略图 `alt=""`（装饰性、紧邻标题）；「精选」徽标是纯视觉标记 |
| DoD | ① 外链带 `rel="noopener"`；② ≥900px 两列；③ 无封面图时不占位 |

#### 6.17.6 社交图标行 `.social-icons`

结构 `<ul class="social-icons">` + `li` + `a.social-icons__link`；图标 **26×26**、间距 `--space-3`（12px）、上下 `padding: var(--space-3) 0`、色 `--color-text-secondary`（hover → `--color-text`）；内联 SVG `fill="currentColor"` + `aria-hidden`；外链 `target="_blank" rel="noopener noreferrer me"` + `aria-label`（平台名）。**零图标库、零 CDN、零 Web Font**。文案与顺序来自 `consts.ts` 的 `SOCIAL`（单点配置），详见 §6.19。

#### 6.17.7 跳转正文 `.skip-link`

| 项 | 规格 |
|---|---|
| 用途 | 全站第一个可聚焦元素，键盘用户一键跳到正文（`#main-content`） |
| 未聚焦 | `position: fixed` + 1×1 盒 + `overflow: hidden` + `clip` / `clip-path: inset(50%)` + `translateY(-100%)` —— **视口内零像素、零布局占位** |
| 聚焦 | 完整出现在**视口左上、页头之下**：`top: calc(var(--header-height) + var(--space-3))`、宽高 `auto`、`padding: var(--space-3) var(--space-4)`、1px 边框、`--radius-sm` |
| 为什么不用 `visibility: hidden` | 会让元素**失去可聚焦性** —— 它是全站第一个 Tab 落点，必须能被 Tab 到 |
| 触控目标 | 聚焦态 `min-width/min-height: 24px`（Lighthouse `target-size` 门禁，G-12） |
| DoD | ① 未聚焦时与 `display:none` 的像素差异 = 0（G-20 实测）；② Tab 首个落点正确；③ 聚焦时不遮挡页头 |

### 6.18 分享图 OG Image（v1.1 新增 · 2026-09-30 · task-19）

**用途**：`og:image` / `twitter:image` 的唯一资产来源，社交平台链接预览大图。
**补本节的原因**：该资产此前**只有实现、没有规范依据**（`public/og-default.png` 已上线，但设计系统中无任何条目描述它），属"孤儿资产"。本节把它的尺寸、配色、版式、文案来源与复验方式一次落档。

**资产与生成**

| 项 | 值 | 出处（实测） |
|---|---|---|
| 产出文件 | `public/og-default.png` | 仓库存在 |
| 生成器 | `scripts/og-image/generate-og-image.py`（Pillow，4× 超采样后 LANCZOS 缩放） | 脚本 |
| 尺寸 | **1200 × 630**，PNG24 | 线上证据 `scripts/qa/evidence/og-image.json`：`contentType: image/png`、`bytes: 56952`、`dimensions { 1200, 630 }` |
| 体积上限 | **200 KB**（脚本 `--max-kb` 默认；超限打印 `[FAIL]` 并返回退出码 1） | 脚本 |
| 引用常量 | `BaseLayout.astro`：`DEFAULT_OG_IMAGE='/og-default.png'`、`DEFAULT_OG_IMAGE_WIDTH=1200`、`DEFAULT_OG_IMAGE_HEIGHT=630` | 代码 |
| 覆盖面 | 实测 14 条路由 **100%** 带 `og:image` 与 `twitter:image` | `check-og-image.mjs` 证据 |
| 自定义 | 文章可传 `image` 覆盖；一旦传了自定义图，就不再输出宽高与 `image/png` 类型 | `BaseLayout.astro` |

**配色（唯一来源：本文档 §2.2 原始层色板，禁止在脚本里另起一套颜色）**

| 用途 | 目标 token（v1.1 色板） | 目标值 | 生成器现状（`generate-og-image.py` 的 `TOKENS`） |
|---|---|---|---|
| 画布底 | `--palette-white` | `#FFFFFF` | ⚠️ 仍写 `#FCFCFD`（旧 paper-50） |
| logomark 底 | `--palette-indigo-600` | `#3B4CE0` | ✅ 一致 |
| logomark 字形 | `--palette-white` | `#FFFFFF` | ✅ 值一致（只是旧名 paper-0） |
| 站名 | `--palette-gray-950` | `#1E1E1E` | ⚠️ 仍写 `#16181D`（旧 ink-900） |
| 副标题 / 域名 | `--palette-gray-500` | `#6C6C6C` | ⚠️ 仍写 `#5B6270`（旧 ink-600） |
| 分隔线 / 描边 | `--palette-gray-100` | `#EEEEEE` | ⚠️ 仍写 `#E3E5EA`（旧 paper-200） |

> **只用亮色**：社交平台的预览卡片底色普遍是白的，暗色图在浅色卡片上会显脏 —— **不提供暗色版本**。
> **与 §2.6 的关系**：分享图里靛蓝**只出现一次**（72×72 的 logomark，与 `public/favicon.svg` 同构）。§2.6 的「限定四处」约束的是**站内 UI**；分享图是独立品牌物料，但遵守同样的「靛蓝只做点睛」精神，不得整幅铺底色。

> **⚠️ 待修：分享图色板与站点已不同步（2026-09-30 · task-25 核实）**：v1.1 换肤后站点色板已切到 `--palette-white / gray-* / ink-*`，而生成器的 `TOKENS` **仍是换肤前的墨蓝极简色值**（见上表「生成器现状」列）。**两者已不同色** —— 换肤收口时**必须**按新色板改生成器 `TOKENS` 并重跑 `python scripts/og-image/generate-og-image.py`。这是当前唯一已知的「资产与色板不同步」项。

**版式（1200 × 630 实测常量）**

| 元素 | 规格 |
|---|---|
| 左右安全边距 | 96px（内容宽 1008px） |
| 顶部品牌锁定 | logomark 72×72 / 圆角 16 / 字形 `p` 46px 白色；站名 **56px bold**，与 logomark 间距 24px |
| 右上装饰 | 72×72 / 圆角 16 的描边回声，`--palette-gray-100`、1.5px，**纯装饰** |
| 中部副标题 | **36px** / 行高 52px（1.45），按词贪心折行后在 196–462px 带内垂直居中 |
| 底部分隔线 | y = 510，1px，`--palette-gray-100` |
| 底部域名 | **26px**，y = 534，`--palette-gray-500` |
| 字体 | 系统栈 Segoe UI（缺失回落 Arial）—— **与站点「零 Web Font」策略一致，不下载任何字体** |

**文案（单一来源）**

- 站名 ← `SITE.title`、副标题 ← `SITE.description`，均由脚本从 `src/consts.ts` 读取，**禁止硬编码**。
- ⚠️ **已知偏离（待修）**：底部域名 `ppywww.github.io` 目前是生成器里的**字面量**，未从 `SITE.url` 派生 —— 换域名时该处不会自动跟随。
- 字号下限：在 1200×630 画布上站名 ≥ 56px、副标题 ≥ 36px；**图片内不出现正文小字**（缩略后必然不可读）。

**无障碍**

- `og:image:alt` = `${SITE.title} · ${SITE.description}`（`BaseLayout.astro` 实测实现）；自定义图可用 `imageAlt` 覆盖。
- 必须同时输出 `og:image:width` / `og:image:height`（1200 / 630），避免平台首抓时按错误比例裁切。
- 信息**全部由文字承载**，不靠色块；去色后仍可完整理解。

**变更纪律**：改文案 → 改 `consts.ts` → 重跑 `python scripts/og-image/generate-og-image.py` → `node scripts/qa/check-og-image.mjs` 复验。**不要手改 PNG。** 若 §2.2 原始层色板变更（v1.1 换肤），本图**必须同步重出**并重跑上述复验。

---

### 6.19 首页个人区块 `.profile`（v1.1 修订 · 2026-09-30 · task-19）

> **锚点说明**：`06-visual-spec.md` §7 引用的「§1065 `.profile-card`」出自本文档的**历史版本**（commit `b2d3236`，1082 行）的 §6.17 补充组件表；本文档现版本**已无该章节**，故按 v1.1 口径在此重新落档，避免 `ProfileCard` 组件无规范可依。

**用途**：首页首屏回答「这是谁」（PRD §7.1）。

**结构**

```html
<section class="profile" aria-labelledby="profile-greeting">
  <h1 class="profile__greeting" id="profile-greeting">👋 Welcome to ppy-Blog</h1>
  <p class="profile__intro">Hi, this is ppy. I’m documenting my learning notes in this blog since 2026.</p>
  <div class="profile__social"><!-- 社交图标行，见 06-visual-spec §4 --></div>
</section>
```

**尺寸（v1.1）**

| 项 | 值 | 备注 |
|---|---|---|
| 容器 | **无边框透明块**：无背景、无圆角、无边框、无 padding | v1.1 变更；旧版 `.profile-card` 是 `--color-surface` 卡片（依赖已废弃的 `--shadow-card`） |
| 头像 | **默认不放** | v1.1 变更，对齐参考站 welcome 区；PRD §7.1 已同步标注「本轮不做」，决策 **D5 不再阻塞** |
| 问候 `h1` | **34px** / 1.3 / **700** | 依 `06-visual-spec.md` §2；文案为该文档 §8 默认值 `👋 Welcome to ppy-Blog`，与 B-04 的英文一句话保持一致 |
| 一句话 | `--font-size-body` 16px / `--line-height-body` 1.75，**最多 2 行** | 文案取自 `SITE.description`（`consts.ts`，禁止硬编码） |
| 上留白 / 下留白 | 24px / 48px | 依 `06-visual-spec.md` §3 |
| 社交图标 | 3 个（GitHub · RSS · X），26×26、间距 12px、上下 `padding: 12px 0`、色 `--color-text-secondary`（hover → `--color-text`） | 依 06-visual-spec §4；**微信 / QQ / Facebook 不在列** |

**无障碍**：`<section>` 用 `aria-labelledby` 指向问候 `h1`（首页唯一 `h1`）；社交图标 `<a>` 必须有 `aria-label`（平台名）+ `target="_blank" rel="noopener noreferrer me"`；区块本身**不可点**（无 overlay 热区）。

**禁止**：不放头像占位灰块、不加卡片背景 / 阴影 / 毛玻璃、不写超过 2 行的自我介绍（会挤掉首屏的「最新文章」）。

---

## 7. 深色模式实现（零闪烁）

> 本章是 PRD F-06 / AC-3 的**唯一实现口径**，与 `BaseLayout.astro` / `tokens.css` 逐条对应。

### 7.1 策略

- **挂载点**：`.dark` 挂在 **`<html>`**（不是 `<body>`）—— 首帧前即可判定，且能让画布底色一并生效。
- **三态**：`stored`（localStorage 里的手动选择）→ 无值则 `prefers-color-scheme` → 两者都没有则 `light`。
- **同时写三个位置**：`classList` 的 `.dark` / `.light`、`dataset.theme`、`style.colorScheme`。`.light` 是给 CSS 回退块用的「手动选了亮色」标记（见 7.3）。
- **记忆键**：`localStorage['pref-theme']`，取值 `'dark' | 'light'`。

### 7.2 首帧内联脚本（`BaseLayout.astro` · `<head>` 最前面 · `is:inline`）

```js
(function () {
  try {
    var KEY = 'pref-theme';
    var stored = localStorage.getItem(KEY);
    var theme = stored === 'dark' || stored === 'light' ? stored
      : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  } catch (e) { /* localStorage 被禁用：静默回落，交由 CSS 的 prefers-color-scheme */ }
})();
```

**铁律**：① 必须是 `<head>` 里的**第一个脚本**（早于任何 `<link rel="stylesheet">` 与 `<body>`）；② 必须 `is:inline`，**不得**改成 Astro 会打包的形式（打包后变成 defer module，就会白闪）；③ 必须 `try/catch`（隐私模式下 `localStorage` 会抛异常，不能因此阻断渲染）。

### 7.3 CSS 侧声明

- `:root { color-scheme: light }` / `:root.dark { color-scheme: dark }`：让表单控件与滚动条跟随主题。
- 无 JS 回退：`@media (prefers-color-scheme: dark) { :root:not(.light) { … } }`，值与 `:root.dark` **逐值相同**（见 §2.3）。`:not(.light)` 保证「手动选了亮色」的用户不会被系统暗色覆盖。

### 7.4 切换与记忆逻辑（`BaseLayout.astro` 底部 · 事件委托 · 零框架）

- 在 `document` 上委托 `click`，命中 `[data-theme-toggle]` 才响应（未来多处置放切换按钮无需重复绑定）。
- 切换时翻转 `.dark` / `.light`、写 `dataset.theme`、`style.colorScheme`，并 `localStorage.setItem('pref-theme', next)`（写入失败不阻断切换）。
- `syncButtons()` 同步所有切换按钮的 `aria-pressed` 与 `aria-label` / `title`（文案在「切换到深色模式」/「切换到浅色模式」之间切换）——**只用图标不用文字，所以 aria 标签必须跟着状态变**。

### 7.5 零闪烁验收证据（G-10，历史记录）

| 证据 | 结果 |
|---|---|
| 主题脚本在 HTML 中的位置 | 第 **273 字节**（早于 CSS 2529 / body 2594） |
| rAF 首帧回调时 `<html>` | 已带 `.dark`，body 背景已是暗色 |
| 录屏首帧主色 | 为该版本暗色页面底；**近白像素占比 0.0000** |

> 注：G-10 记录于 v1.0，当时暗色页面底是 `#0F1115`；v1.1 换肤后为 `#1D1E20`（见 §2.2）。**判定方法不变**，换肤后需按同样的三重证据复验。

### 7.6 当前未实现（明确记录，避免被当成 bug）

- **不监听系统主题实时变化**：运行时不注册 `matchMedia(...).addEventListener('change')`。用户手动选过就以手动为准；没选过则刷新页面时才重新读系统值。**这是取舍，不是遗漏** —— 实时跟随会让「手动选过暗色」的用户在系统切换时被强行改掉。

---

## 8. 无障碍规则

### 8.1 焦点可见（全站统一，一处定义）

```css
:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; border-radius: var(--radius-sm); }
```

- **禁止 `outline: none`**（除非同一规则里给了等价的可见替代）。
- 焦点环取强调色（§2.6 允许的第四处使用）。亮色 6.37:1 / 暗色 6.63:1，远超非文本 3:1 门槛。
- 卡片等大热区：焦点环只画在**标题链接**上，卡片本身不加环（避免双环）。
- 跳转正文 `.skip-link` 见 §6.17.7。

### 8.2 对比度底线

见 §2.5（本机实算）。**文本 ≥4.5:1，非文本 UI ≥3:1**。新增任何颜色组合前必须重算；代码块内 token 颜色由 `scripts/qa-contrast/check-code-tokens.mjs` 对构建产物逐条实算（见 §2.7）。

### 8.3 语义化标签清单（必须使用）

| 位置 | 要求 |
|---|---|
| 文档根 | `<html lang="zh-CN">` |
| 页头 | `<header>` + `<nav aria-label="主导航">`；汉堡按钮 `aria-expanded` + `aria-controls` |
| 正文 | `<main id="main-content">`（skip-link 的目标）；文章页 `<article>` |
| 页脚 | `<footer>` |
| 标题层级 | 每页**唯一 `h1`**；卡片标题按页面层级选 `h2`/`h3`，**不得跳级** |
| 时间 | `<time datetime="ISO8601">` |
| 装饰元素 | 纯装饰一律 `aria-hidden="true"`（404 数字、SVG 图标、元信息分隔符） |
| 分页 | `<nav aria-label="分页导航">` + `<ol>`；当前页 `aria-current="page"` |
| 面包屑 | `<nav aria-label="面包屑">` + `<ol>`；末项 `aria-current="page"` |

### 8.4 键盘可达清单（对应 AC-11，验收逐条过）

1. Tab 顺序：`.skip-link` → 品牌 → 导航项 → 搜索 → 主题切换 → 菜单按钮。
2. 汉堡面板：`Enter`/`Space` 开合；**`Esc` 关闭**；关闭后**焦点归还**给菜单按钮；点击面板外部关闭。
3. 目录 TOC：原生 `<details>` / `<summary>`，`Enter`/`Space` 展开，无需 JS。
4. 卡片：整卡热区由标题链接的 `::after` 铺满，**键盘只停一次**（卡片内不得再放链接）。
5. 主题切换：`aria-pressed` 随状态翻转。
6. 搜索：输入即时出结果；结果可 Tab 到。

### 8.5 动效与其它

- `@media (prefers-reduced-motion: reduce)`：`scroll-behavior: auto`，动画/过渡时长统一压到 `0.01ms`。
- **触控目标**：全站可点元素 ≥24×24（WCAG 2.2 AA 2.5.8 / Lighthouse `target-size`，G-12）；`pointer: coarse` 下主要目标 ≥44×44。
- `scrollbar-gutter: stable`：滚动条出现/消失不再引起整页横向抖动。

---

## 9. 记忆点设计（对抗「辨识度最低」这一方向的最大风险）

> 灰阶体系最大的风险是**千人一面**（PRD §1.3 对参考站的批评）。以下三处是**刻意留下识别度**的地方，实现已落地，改动前请先想清楚代价。

### M1 · 归档页「年份脊 + 40px 条目轨」（PRD §7.3）

- 年份做成左侧**粘性脊**（≥900px、`grid-template-columns: 88px 1fr`），滚动时年份始终可见；
- 条目是统一 **40px 轨道**（`min-height: var(--space-10)`），日期列固定 **56px**、`--font-mono` + `tabular-nums`，三列对齐；
- 整行可点，hover 时左侧亮起 **2px 强调色滑块**（`border-left` 预留透明位，避免文字位移）；
- 扫读效率是这一页的全部意义：**无缩略图、无动画**。

### M2 · 代码块「常驻语言标签 + 32px 头部条」（PRD §7.2）

- `.code-block__header` 固定 `min-height: 32px`，内含大写语言名（`--font-mono` / `--font-size-xs` / `letter-spacing: 0.08em` / `--color-text-secondary`）；
- 头部条把「语言」变成**常驻信息**而不是 hover 才出现的按钮；
- 代码区 `padding: var(--space-4)`、`overflow-x: auto`（**移动端横向滚动，不缩小字号**）；
- 语法高亮走 G-04 双主题：Shiki 只输出 `--shiki-light` / `--shiki-dark` 变量，背景与文字色由 `prose.css` 接管。

### M3 · TOC「竖线轨道 + mono 序号 + 强调色滑块」（PRD §7.2 / F-12）

- 原生 `<details>` 默认折叠（零 JS、原生键盘可达）；
- 左侧 **1px 竖线轨道** + CSS 计数器生成的**两位 mono 序号**（`decimal-leading-zero`）；
- hover / focus 时左侧亮起 **2px 强调色滑块** + 文字转 `--color-text`；
- 展开区 `max-height: 40vh` 内滚动，长文也不撑破首屏。

---

## 10. 反模式清单（明确禁止）

### 10.1 颜色

- ❌ 组件 CSS 里出现裸色值（`#xxx` / `rgb()` / `hsl()`）或 `--palette-*`；
- ❌ 新增未实算对比度的颜色组合（§2.5）；
- ❌ 把强调色用在 §2.6 的四处之外（尤其是标签、卡片底、边框、标题、图标默认态）；
- ❌ 用颜色**单独**承载信息（当前项、错误、选中必须同时有字重/下划线/文字）；
- ❌ 颜色只改一处（亮色 / 暗色 / 回退块必须三处同步）。

### 10.2 排版

- ❌ 行内写魔法 `line-height` / `font-size`（只允许 `--line-height-*` / `--font-size-*`）；
- ❌ 中文斜体（`font-style: italic`）与中文负字距；
- ❌ `text-align: justify`（中文两端对齐会产生难看的字距）；
- ❌ `word-break: break-all`（中文会被逐字切断）；
- ❌ 用 JS 截断字符串（截断只能发生在 CSS 层，**完整文本必须留在 DOM 中**）；
- ❌ 正文列宽超过 `--content-width`（720px）。

### 10.3 布局与视觉

- ❌ 阴影（`--shadow-card` 已是 `none`）；hover 抬升、毛玻璃、发光一律禁止；
- ❌ 圆角 > 8px（标签胶囊除外）；同一元素混用两种圆角；
- ❌ 卡片内再放第二个链接（整卡热区冲突，键盘会停两次）；
- ❌ 空态只有一句话、没有出口链接；空态用虚线框；
- ❌ 大面积强调色填充（除 `.btn--accent` 与分享图的 72×72 logomark）。

### 10.4 工程与交互

- ❌ 把主题脚本改成 Astro 会打包的形式（会白闪，见 §7.2）；
- ❌ `outline: none` 且没有等价替代；
- ❌ 用 `disabled` 做「伪禁用」的链接（`<a>` 没有 `disabled`）；
- ❌ 删除 `--color-accent` / `--color-accent-text` / `--color-on-accent` / `--shadow-card` / `--radius-sm` 等**看似多余**的变量名 —— CSS 变量缺失**不报错**，只会静默掉色或失去声明（G-07 的历史教训：全仓 11 处引用在本文件之外）；
- ❌ 让第三方脚本进首屏（Giscus 是唯一第三方，且必须懒加载）。

---

## 11. 落地检查清单（新组件 / 新页面进场时逐条过）

> v1.0 的本节是「M3/M4 实现者分工表」，已完成使命。v1.1 起改为**进场检查清单**——新增任何组件或页面，提交前逐条自查。

| # | 检查项 | 通过标准 |
|---|---|---|
| 1 | Token | 只用语义层 `--color-*` / `--space-*` / `--font-size-*` / `--radius-*`；无裸色值、无 `--palette-*`、无魔法数字 |
| 2 | 对比度 | 新组合已按 WCAG 2.1 实算，文本 ≥4.5:1、非文本 ≥3:1（§2.5） |
| 3 | 双主题 | 亮 / 暗两态都看过；若改色，三处（`:root` / `:root.dark` / 回退块）同步 |
| 4 | 强调色 | 只出现在 §2.6 允许的四处；去色截图后仍只落在「可以点的地方」 |
| 5 | 键盘 | 全流程 Tab 可达；Esc 能退出覆盖层；焦点环可见 |
| 6 | 语义 | 标签语义正确；装饰元素 `aria-hidden`；标题层级不跳级；每页唯一 `h1` |
| 7 | 触控 | ≥24×24；`pointer: coarse` 下 ≥44×44 |
| 8 | 响应式 | 320px–2560px 无横向滚动；<768px 走汉堡菜单与 `--gap: 14px` |
| 9 | 性能 | 不新增首屏资源（G-17：文章页 LCP 距 1500ms 门禁仅剩 2ms 余量） |
| 10 | 组件四件套 | 用途 / 结构 / 状态 / 无障碍 + DoD 已写入本文档 |

---

## 12. 未验证项与待裁决（诚实清单）

> 本清单只记**确实没验证过**或**口径尚未统一**的事，避免后来者把「没写」当成「已验证」。

### 12.1 已闭环（保留记录，供追溯）

| ID | 事项 | 结论 |
|---|---|---|
| U1 | 正文行高 | **1.75**（06 §2 唯一保留的排版偏离，中文方块字需要更大行距） |
| U2 | 代码块 token 对比度 | **已闭环**（G-11）：`astro.config.mjs` 构建期逐 token 兜底到 4.5:1，`check-code-tokens.mjs` 对产物逐条实算 |

### 12.2 未验证（写代码时不要假设它们已经生效）

| ID | 事项 | 现状 |
|---|---|---|
| **U6** | Giscus 主题 `postMessage` 换肤 | **未实测**。代码按 giscus 官方推荐方案实现（`MutationObserver` 监听 `html` → `postMessage`），但评论区默认关闭、尚未真实跑通 |
| **U8** | 中英混排自动加空格 | **未实测**。`body { text-autospace: normal }` 已加（渐进增强，不支持的浏览器直接忽略）；MVP 不做构建期插件（决策 V6b）。**尚未在真实浏览器逐条验证效果** |

### 12.3 口径不一致（已知，待修）

| ID | 事项 | 详情 |
|---|---|---|
| **U9** | 分享图色板未同步 | `scripts/og-image/generate-og-image.py` 的 `TOKENS` 仍是换肤前的墨蓝极简色值，与现行色板不同色。详见 §6.18 |
| **U10** | `<meta name="theme-color">` 仍是旧色值 | `BaseLayout.astro` 写死 `#FCFCFD`（亮）/ `#0F1115`（暗），而现行 `--color-bg` 是 `#FFFFFF` / `#1D1E20`。影响**浏览器地址栏配色**，不影响可读性。`<meta>` 无法引用 CSS 变量，只能手改 |
| **U11** | `WorkCard` 卡片标题字号 | 代码用 `--font-size-h3`（19px）并注释「锁 §3.1 卡片标题 = `--fs-h3` 档」；**该口径已作废**，卡片标题应为 `--font-size-h2`（24px）。详见 §6.17.5 |
| **U12** | `--color-link-hover` 无消费者 | 06 §1.2 定义的链接 hover 在 G-15 后改走强调色，该 token 保留但当前无人引用。**不要删**，等后续用途 |

---

## 附：与其他文档的对应关系

| 本文档章节 | 上游 / 对应 | 说明 |
|---|---|---|
| §2 Token 体系 | `src/styles/tokens.css` | **代码是原始层与最终实现**；本文档解释结构与铁律 |
| §2.2 / §2.3 / §2.5 | `docs/06-visual-spec.md` §1 | 06 给色板与工程参数；实测不达标处（暗色 secondary、代码块底）本文档记录为**故意偏离** |
| §3 排版规范 | `docs/06-visual-spec.md` §2 | 字号阶与 700 字重取自 06；正文行高 1.75 是唯一保留的偏离 |
| §4 / §5 | `docs/06-visual-spec.md` §3 | 间距、圆角 8px、无阴影、整卡可点均来自 06 |
| §6.1 | `docs/00-decision-log.md` G-23 | 移动端菜单**追认 JS + 768px 实现**（不用 `<details>`） |
| §6.18 / §6.19 | `docs/06-visual-spec.md` §4 / §8 | 分享图与首页个人区块为 v1.1 新增资产 |
| §2.6 / §6.14 | `docs/00-decision-log.md` G-05 / G-07 / G-15 | 保留强调色、限定四处、不得删除三个变量名 |
| §7 | PRD F-06 / AC-3 | 深色模式零闪烁的唯一实现口径 |
| §8 | PRD §10 / AC-11 / G-12 | 无障碍门禁与键盘可达清单 |
| §12 | `docs/00-decision-log.md` | 未验证项与已知口径不一致，逐条可追溯 |

---

*本文档 v1.1（2026-09-30）。§2 / §3 / §4 / §5 / §6.1 已按 task-25 与实现对齐；§6.15–§6.17 为早期截断事故的补写。**任何与 `src/styles/*.css` 冲突之处，以代码为准**（G-03）。*


