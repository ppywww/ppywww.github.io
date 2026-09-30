/**
 * RSS 2.0 订阅源 —— /rss.xml（PRD F-09 / §5 站点地图 / 决策 F-09）
 *
 * · 一次性订阅全站（不做分栏目 feed）
 * · description 必须引用 consts.ts 的 SITE.description，禁止硬编码（单点配置）
 * · 只含已发布文章：生产构建过滤 draft:true，本地 dev 保留便于预览
 * · 摘要用文章自己的 description（PRD §11：每篇必写 40–80 字摘要）
 */
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../consts';
import { CATEGORIES } from '../consts';

/** 分类白名单用于过滤 categories 字段里的非法值（schema 已保证，这里只是防御） */
const categorySet = new Set<string>(CATEGORIES);

export async function GET(context: APIContext) {
  // 生产构建过滤草稿；本地 dev 保留草稿便于预览（与页面口径一致）
  const posts = (
    await getCollection('posts', ({ data }) => (import.meta.env.PROD ? !data.draft : true))
  ).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/posts/${post.id}/`,
      // 分类 + 标签都作为 RSS category 输出；分类只保留 4 个合法栏目
      categories: [
        ...post.data.categories.filter((c) => categorySet.has(c)),
        ...post.data.tags,
      ],
    })),
    // 频道语言（RSS 2.0 <language>）；与 <html lang> 同源
    customData: `<language>${SITE.lang}</language>`,
  });
}
