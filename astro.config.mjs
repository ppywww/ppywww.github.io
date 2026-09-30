// @ts-check
import { defineConfig } from 'astro/config';
/*
  Astro 7 的默认 Markdown 处理器是 Sätteri（@astrojs/markdown-satteri）。
  扩展它的唯一零依赖方式是 markdown.processor = satteri({ hastPlugins })；
  markdown.rehypePlugins / remarkPlugins 在本版本已废弃，且需要额外安装
  @astrojs/markdown-remark（本项目未安装，一旦写入会直接构建失败）。
*/
import { satteri } from '@astrojs/markdown-satteri';

/** 站点源（与 consts.ts 的 SITE.url 一致）：site 与「站外链接」判定共用，避免两处硬编码打架 */
const SITE_ORIGIN = 'https://ppywww.github.io';

/* ===========================================================================
   代码块 token 对比度兜底（task-14 第 1 项 / 设计系统 §12 U2）
   ---------------------------------------------------------------------------
   问题：Shiki 主题自带的高亮色不保证在**我们的**代码底色上达到 WCAG AA 4.5:1。
   实测 github-light 有 3 个颜色不达标（#E36209 3.28、#D73A49 4.30、#22863A 4.35，底 #F7F8FA），
   github-dark 有 1 个（#6A737D 3.27，底 #1F232B）。
   做法：不改主题，而是在构建期对**每一个 token 颜色**逐个兜底 —— 不达标就把颜色朝黑（亮色主题）
   或朝白（暗色主题）二分混合，取「刚好达标」的最小改动量，尽量保留原始色相。
   这样以后无论换主题、加语言、加新 token，门禁都自动成立。
   验证：scripts/qa-contrast/check-code-tokens.mjs 对构建产物逐条实算（不抽样）。
   注意：CODE_BG 必须与 tokens.css 的 --color-code-bg 亮/暗取值保持一致。
   =========================================================================== */
const CODE_BG = { light: '#F7F8FA', dark: '#1F232B' };
const MIN_CONTRAST = 4.5;

function relativeLuminance(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** 线性 RGB 混合：t=0 原色，t=1 目标色 */
function mixColor(hex, target, t) {
  const toRgb = (h) => {
    const s = h.replace('#', '');
    return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
  };
  const [a, b] = [toRgb(hex), toRgb(target)];
  return (
    '#' +
    a
      .map((v, i) => Math.max(0, Math.min(255, Math.round(v + (b[i] - v) * t))))
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

/** 不达标就二分找「刚好达标」的最小混合量；已达标原样返回 */
function ensureContrast(hex, bg, toward) {
  if (contrastRatio(hex, bg) >= MIN_CONTRAST) return hex;
  let lo = 0;
  let hi = 1;
  let best = hex;
  for (let i = 0; i < 24; i++) {
    const t = (lo + hi) / 2;
    const candidate = mixColor(hex, toward, t);
    if (contrastRatio(candidate, bg) >= MIN_CONTRAST + 0.01) {
      best = candidate;
      hi = t;
    } else {
      lo = t;
    }
  }
  return best;
}

/** Shiki transformer：重写每个 token 上的 --shiki-light / --shiki-dark 变量 */
const shikiContrast = {
  name: 'ppy-shiki-contrast',
  span(node) {
    const style = node.properties && node.properties.style;
    if (typeof style !== 'string' || !style.includes('--shiki-')) return;
    node.properties.style = style
      .replace(/--shiki-light:(#[0-9a-fA-F]{3,8})/g, (_, c) =>
        '--shiki-light:' + ensureContrast(c.toUpperCase(), CODE_BG.light, '#000000'),
      )
      .replace(/--shiki-dark:(#[0-9a-fA-F]{3,8})/g, (_, c) =>
        '--shiki-dark:' + ensureContrast(c.toUpperCase(), CODE_BG.dark, '#FFFFFF'),
      );
  },
};

/** 语言名白名单：fence 信息串来自文章作者，进 HTML 属性前必须过滤，避免属性注入 */
function safeLang(value) {
  const raw = String(value ?? '').trim();
  return /^[A-Za-z0-9_+#.-]+$/.test(raw) ? raw : 'plaintext';
}

/** 无语言代码块显示成 TEXT，比 PLAINTEXT 可读 */
const LABEL_ALIAS = { plaintext: 'TEXT', text: 'TEXT' };

/**
 * hast 插件 ①：把 Shiki 的 <pre data-language="ts"> 包成
 *   <figure class="code-block" data-lang="ts">
 *     <figcaption class="code-block__header"><span class="code-block__lang">ts</span></figcaption>
 *     <pre …>…</pre>
 *   </figure>
 * —— 设计系统 §6.7「记忆点 2：代码块常驻语言标签」的落地。
 *
 * 为什么用 raw 节点拼装而不是 ctx.wrapNode()：wrapNode 把被包裹的节点放在**第一个**
 * 子位置、声明的内容排在其后，会让 <figcaption> 掉到代码后面；raw 节点按顺序原样输出，
 * 因此能精确控制「标签在前、代码在后」，且得到与设计系统一致的 DOM 顺序。
 *
 * ⚠️ 语言名取自 data-language（hast 里被规范化成驼峰 dataLanguage），不是 language-* class。
 */
const rehypeCodeBlockFigure = {
  name: 'ppy-code-block-figure',
  element: {
    filter: ['pre'],
    visit(node, ctx) {
      const lang = safeLang(node.properties && node.properties.dataLanguage);
      const label = LABEL_ALIAS[lang] || lang;
      ctx.replaceNode(node, [
        {
          type: 'raw',
          value:
            `<figure class="code-block" data-lang="${lang}">` +
            `<figcaption class="code-block__header"><span class="code-block__lang">${label}</span></figcaption>`,
        },
        node,
        { type: 'raw', value: '</figure>' },
      ]);
    },
  },
};

/**
 * hast 插件 ②：给可聚焦的 <pre> 补 aria-label（键盘用户 Tab 到代码块时能听到「ts 代码示例」，
 * 而不是把整段代码念一遍 —— 设计系统 §6.7）。
 * 必须与插件 ① 分开注册：同一个插件里 replaceNode 会丢掉对同一节点挂起的 setProperty。
 */
const rehypeCodeBlockLabel = {
  name: 'ppy-code-block-label',
  element: {
    filter: ['pre'],
    visit(node, ctx) {
      const lang = safeLang(node.properties && node.properties.dataLanguage);
      ctx.setProperty(node, 'aria-label', `${lang} 代码示例`);
    },
  },
};

/**
 * hast 插件 ③：markdown 表格的 <th> 补 scope="col"。
 * Astro 7 的 satteri 管线默认不输出 scope（设计系统 §12 U4 的待验证项，实测确认为「缺」），
 * 缺了它屏幕阅读器无法把表头与单元格关联起来。
 */
const rehypeTableScope = {
  name: 'ppy-table-scope',
  element: {
    filter: ['th'],
    visit(node, ctx) {
      if (!node.properties || node.properties.scope === undefined) {
        ctx.setProperty(node, 'scope', 'col');
      }
    },
  },
};

/**
 * hast 插件 ④：站外链接自动补 target="_blank" + rel="noopener noreferrer"
 * （PRD §9 外链策略 / AC-12 / 决策日志 V9）。
 * 只处理 http(s) 绝对链接，且排除本站自己的域名；站内相对链接与 #锚点 一律不碰。
 */
const rehypeExternalLinks = {
  name: 'ppy-external-links',
  element: {
    filter: ['a'],
    visit(node, ctx) {
      const href = node.properties && node.properties.href;
      if (typeof href !== 'string' || !/^https?:\/\//i.test(href)) return;
      let host;
      try {
        host = new URL(href).host;
      } catch {
        return; // 解析不了的链接不动它
      }
      if (host === new URL(SITE_ORIGIN).host) return;
      ctx.setProperty(node, 'target', '_blank');
      ctx.setProperty(node, 'rel', 'noopener noreferrer');
    },
  },
};

// ppy-Blog · 个人综合博客
// 托管：GitHub Pages 用户站点（仓库 ppywww.github.io）→ 站点走**根路径**
// 因此这里 **不设 base**（设了会导致所有资源路径变成 /ppywww.github.io/... 而 404）
// ADR-001：Astro v7 + 纯静态输出 + 原生 CSS（零 CSS 框架、零 Web Font）
export default defineConfig({
  site: SITE_ORIGIN,
  output: 'static',

  // 目录式 URL：/posts/xxx/ → /posts/xxx/index.html
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },

  markdown: {
    /*
      双主题：Shiki 会输出 --shiki-light / --shiki-dark 系列 CSS 变量，
      不再把背景色写死成行内 style（原来单主题 github-dark 会导致亮色模式下也是深色代码块）。
      defaultColor: false 表示连亮色的 color/background-color 也不写进行内 style，
      配色全部交给 src/styles/prose.css 用设计令牌 + shiki 变量接管。
    */
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      // 逐 token 兜底到 WCAG AA 4.5:1（见文件上方 shikiContrast 说明）
      transformers: [shikiContrast],
    },
    processor: satteri({
      hastPlugins: [
        rehypeCodeBlockFigure,
        rehypeCodeBlockLabel,
        rehypeTableScope,
        rehypeExternalLinks,
      ],
    }),
  },

  // 开发工具条会在页面上注入额外 JS，与「首屏 JS < 30KB」门禁无关但徒增噪音，关掉
  devToolbar: { enabled: false },
});
