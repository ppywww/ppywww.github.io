/**
 * 站点地图 —— /sitemap.xml（PRD F-10）
 *
 * 手写实现，**不引入 @astrojs/sitemap**（任务约束，也避免多一个依赖）。
 * 列出全部已发布路由：首页 / 文章列表 / 全部文章详情 / 归档 / 分类 / 标签 / 作品 / 关于。
 *
 * 约定：
 * · loc 用绝对地址 + 目录式尾斜杠；中文分类名与标签名一律 encodeURIComponent（sitemap 规范要求百分号编码）
 * · 文章 lastmod 优先取 front-matter 的 lastmod，缺省用 date（与页面「更新于」口径一致）
 * · **不含 /search/**：搜索页是工具页且已 noindex，把它提交给搜索引擎会触发
 *   Search Console 的「已提交但标记为 noindex」告警。若老板要求列全，删掉那一行即可。
 * · 不含 tag/category 的 0 文章页面（本就不产出页面）
 */
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { CATEGORIES, SITE } from '../consts';
import { formatDate } from '../lib/date';

/** XML 文本转义（loc 里可能带 & 等字符） */
const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (ch) => {
    switch (ch) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      default:
        return '&quot;';
    }
  });

interface SitemapEntry {
  /** 站内路径，含首尾斜杠 */
  loc: string;
  lastmod?: string;
  changefreq?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority?: string;
}

export async function GET(context: APIContext) {
  const origin = (context.site ?? new URL(SITE.url)).href.replace(/\/+$/, '');
  const abs = (path: string) => `${origin}${path}`;

  // 生产构建过滤草稿；本地 dev 保留草稿便于预览
  const posts = (
    await getCollection('posts', ({ data }) => (import.meta.env.PROD ? !data.draft : true))
  ).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  // 标签从已发布文章聚合，与 /tags/ 页面口径一致
  const tags = [...new Set(posts.flatMap((post) => post.data.tags))].sort((a, b) => a.localeCompare(b));

  const entries: SitemapEntry[] = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/posts/', changefreq: 'daily', priority: '0.9' },
    ...posts.map<SitemapEntry>((post) => ({
      loc: `/posts/${post.id}/`,
      lastmod: formatDate(post.data.lastmod ?? post.data.date),
      changefreq: 'monthly',
      priority: '0.8',
    })),
    { loc: '/archives/', changefreq: 'weekly', priority: '0.7' },
    { loc: '/categories/', changefreq: 'weekly', priority: '0.6' },
    ...CATEGORIES.map<SitemapEntry>((category) => ({
      loc: `/categories/${encodeURIComponent(category)}/`,
      changefreq: 'weekly',
      priority: '0.6',
    })),
    { loc: '/tags/', changefreq: 'weekly', priority: '0.5' },
    ...tags.map<SitemapEntry>((tag) => ({
      loc: `/tags/${encodeURIComponent(tag)}/`,
      changefreq: 'weekly',
      priority: '0.5',
    })),
    { loc: '/works/', changefreq: 'monthly', priority: '0.6' },
    { loc: '/about/', changefreq: 'monthly', priority: '0.5' },
  ];

  const body = entries
    .map((entry) => {
      const lines = [`    <loc>${escapeXml(abs(entry.loc))}</loc>`];
      if (entry.lastmod) lines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
      if (entry.changefreq) lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
      if (entry.priority) lines.push(`    <priority>${entry.priority}</priority>`);
      return `  <url>\n${lines.join('\n')}\n  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
