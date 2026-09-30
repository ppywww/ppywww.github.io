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
