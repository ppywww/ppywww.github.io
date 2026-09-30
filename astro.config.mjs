// @ts-check
import { defineConfig } from 'astro/config';

// ppy-Blog · 个人综合博客
// 托管：GitHub Pages 用户站点（仓库 ppywww.github.io）→ 站点走**根路径**
// 因此这里 **不设 base**（设了会导致所有资源路径变成 /ppywww.github.io/... 而 404）
// ADR-001：Astro v7 + 纯静态输出 + 原生 CSS（零 CSS 框架、零 Web Font）
export default defineConfig({
  site: 'https://ppywww.github.io',
  output: 'static',

  // 目录式 URL：/posts/xxx/ → /posts/xxx/index.html
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },

  // 开发工具条会在页面上注入额外 JS，与「首屏 JS < 30KB」门禁无关但徒增噪音，关掉
  devToolbar: { enabled: false },
});
