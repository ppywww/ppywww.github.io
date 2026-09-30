/**
 * 站点级唯一配置源（Single Source of Truth）
 * 改站点名 / 描述 / 导航，只改这里。
 */

export const SITE = {
  /** 站点名（决策 B-02 已锁定） */
  title: 'ppy-Blog',
  /**
   * 站点副标题 —— 老板 2026-09-30 定稿（含弯引号 ’，请勿改成直引号）。
   * 单点配置：<meta description> / OG / Twitter Card / RSS description / 首页欢迎卡
   * 全部引用本字段，禁止在任何页面硬编码这段文案。
   */
  description: 'Hi, this is ppy. I’m documenting my learning notes in this blog since 2026.',
  /** 作者署名 —— 占位（决策 D5 待拍板：昵称 + 头像，不公开真名） */
  author: 'ppy',
  /** 内容语言（PRD §10：<html lang="zh-CN">，不实现 i18n） */
  lang: 'zh-CN',
  /** 线上站点根 URL（决策 B-03）；与 astro.config.mjs 的 site 保持一致 */
  url: 'https://ppywww.github.io',
} as const;

/** 顶部导航（PRD §5：首页 · 文章 · 归档 · 作品 · 关于） */
export const NAV = [
  { label: '首页', href: '/' },
  { label: '文章', href: '/posts/' },
  { label: '归档', href: '/archives/' },
  { label: '作品', href: '/works/' },
  { label: '关于', href: '/about/' },
] as const;

/**
 * 分类枚举 —— 唯一真相源。
 * PRD §6.2 冻结：categories 仅允许这 4 个值；content.config.ts 的 Zod schema 直接引用本常量，
 * 非法分类会在**构建期**报错（AC-7）。
 */
export const CATEGORIES = ['技术', '生活', '读书', '作品'] as const;
export type Category = (typeof CATEGORIES)[number];

/** 社交 / 订阅入口（D5 定稿前先占位，不写真实邮箱） */
export const SOCIAL = [
  { label: 'GitHub', href: 'https://github.com/ppywww', icon: 'github' },
  { label: 'RSS', href: '/rss.xml', icon: 'rss' },
] as const;
