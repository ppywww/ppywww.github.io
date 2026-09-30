/**
 * 站点级唯一配置源（Single Source of Truth）
 * 改站点名 / 描述 / 导航，只改这里。
 */

export const SITE = {
  /** 站点名（决策 B-02 已锁定） */
  title: 'ppy-Blog',
  /**
   * 首页问候语（v1.1-B 冻结接口）：首页 <h1> 用它，不再拿站名当 h1。
   * 站名仍然出现在页头品牌、页脚、<title>、RSS 标题里。
   */
  greeting: '👋 Welcome to ppy-Blog',
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

/**
 * Giscus 评论配置（PRD F-08 / 决策 D6：全局默认关闭、逐篇可开）
 *
 * 当前状态：**enabled: false**
 *   老板尚未在仓库开启 Discussions、也未安装 giscus App，因此还拿不到 categoryId。
 *   category 与 categoryId 已留空占位。
 *
 * 老板补齐后的启用步骤（只改这一个文件）：
 *   1) 仓库 Settings → General → Features 勾选 Discussions，并新建一个 Announcements 分类；
 *   2) 安装 giscus App（https://github.com/apps/giscus）并授权 ppywww.github.io 仓库；
 *   3) 打开 https://giscus.app/zh-CN，填入仓库，页面会给出 category 名称与 categoryId；
 *   4) 把下面的 category / categoryId 填上，并把 enabled 改成 true —— 构建后即生效。
 *
 * 行为约定：enabled 为 false **或** categoryId 为空时，页面不输出任何评论 DOM、不加载任何脚本。
 */
export const GISCUS = {
  /** 总开关：false 时全站一行评论 DOM 都不渲染 */
  enabled: false,
  /** GitHub 仓库（owner/repo） */
  repo: 'ppywww/ppywww.github.io',
  /** 仓库 node_id（老板已提供，公开信息） */
  repoId: 'R_kgDOU0nLtg',
  /** Discussions 分类名（老板开 Discussions 后填入） */
  category: '',
  /** Discussions 分类 ID（giscus.app 会直接给出，如 DIC_kwDOU0nLtg4C...） */
  categoryId: '',
  /** 文章与 Discussion 的映射方式：本站 URL 稳定，用 pathname */
  mapping: 'pathname',
  /** '1' 开启表情回应 */
  reactionsEnabled: '1',
  /** 评论输入框在评论列表上方 */
  inputPosition: 'top',
  /** 界面语言 */
  lang: 'zh-CN',
};

/** 社交 / 订阅入口（D5 定稿前先占位，不写真实邮箱） */
export const SOCIAL = [
  { label: 'GitHub', href: 'https://github.com/ppywww', icon: 'github' },
  { label: 'RSS', href: '/rss.xml', icon: 'rss' },
] as const;
