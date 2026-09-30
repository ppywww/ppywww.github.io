/**
 * Content Collections —— PRD §6.2 冻结的 Front-Matter 契约的**唯一真相源**。
 * 任何字段约束的改动都必须先改这里，非法值会在 `astro build` 阶段直接报错（AC-7）。
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIES } from './consts';

/* ---------------------------------------------------------------------------
   Post · 文章（PRD §6.2，字段顺序与冻结契约一致）
   --------------------------------------------------------------------------- */
const postSchema = z.object({
  /** 必填 */
  title: z.string().min(1, 'title 必填'),
  /** 必填，带时区（如 2026-09-30T14:00:00+08:00）。写法是约定，此处不强制校验时区偏移 */
  date: z.coerce.date(),
  /** 选填，有值则页面显示「更新于」 */
  lastmod: z.coerce.date().optional(),
  /** 默认 false；draft: true 的文章不进生产构建 */
  draft: z.boolean().default(false),
  /** 必填，一句话摘要，用于列表卡片与 SEO（建议 40–80 字） */
  description: z.string().min(1, 'description 必填'),
  /**
   * 必填。枚举**仅允许** 技术 / 生活 / 读书 / 作品 —— 非法分类构建期报错。
   * PRD §6.4 约定「一篇文章有且仅有 1 个主分类」（取数组首项为主分类），
   * 故这里只校验「非空 + 取值合法」，不锁死长度，给系列文章留余地。
   */
  categories: z
    .array(z.enum(CATEGORIES))
    .min(1, `categories 必填，且只能是：${CATEGORIES.join(' / ')}`),
  /** 选填，自由生长 */
  tags: z.array(z.string()).default([]),
  /** 选填，系列名 */
  series: z.string().optional(),
  /** 选填，列表缩略图路径 */
  cover: z.string().optional(),
  /** 选填，默认 true */
  toc: z.boolean().default(true),
  /** 选填，默认 false（Giscus 全局默认关闭、逐篇可开） */
  comments: z.boolean().default(false),
  /** 选填，默认 false（P1 才接 KaTeX，MVP 不做） */
  math: z.boolean().default(false),
});

const posts = defineCollection({
  // 支持 content/posts/YYYY-MM-DD-slug.md 与 Page Bundle content/posts/YYYY-MM-DD-slug/index.md
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: postSchema,
});

/* ---------------------------------------------------------------------------
   Work · 作品（PRD §6.1：结构化字段）
   --------------------------------------------------------------------------- */
const workSchema = z.object({
  title: z.string().min(1, 'title 必填'),
  /** 一句话简介，用于作品卡片 */
  summary: z.string().min(1, 'summary 必填'),
  date: z.coerce.date().optional(),
  /** 技术栈标签，如 ["Astro", "TypeScript"] */
  stack: z.array(z.string()).default([]),
  cover: z.string().optional(),
  /** 源码地址 */
  repo: z.url('repo 需为完整 URL').optional(),
  /** 在线 Demo 地址 */
  demo: z.url('demo 需为完整 URL').optional(),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
  /** 手动排序，越小越靠前 */
  order: z.number().default(999),
});

const works = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/works' }),
  schema: workSchema,
});

/* ---------------------------------------------------------------------------
   Page · 独立页（关于我等）
   --------------------------------------------------------------------------- */
const pageSchema = z.object({
  title: z.string().min(1, 'title 必填'),
  description: z.string().optional(),
  lastmod: z.coerce.date().optional(),
  draft: z.boolean().default(false),
  toc: z.boolean().default(true),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: pageSchema,
});

export const collections = { posts, works, pages };

/* 供页面复用的推导类型 */
export type PostData = z.infer<typeof postSchema>;
export type WorkData = z.infer<typeof workSchema>;
export type PageData = z.infer<typeof pageSchema>;
