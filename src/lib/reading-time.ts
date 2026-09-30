/**
 * 阅读时长估算 —— ADR-001 代价 C2：Astro 无内置 CJK 词数统计，自写。
 * 口径：中日韩字符按「字」计，拉丁文按「词」计，两者速度不同故分别折算。
 */

/** CJK 统一表意文字 + 扩展 A + 兼容表意 + 日文假名 */
const CJK_RE = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/g;
/** 拉丁单词（含内部连字符/撇号） */
const WORD_RE = /[A-Za-z0-9_]+(?:['\u2019-][A-Za-z0-9_]+)*/g;

/** 去掉围栏代码块、行内代码、图片、链接语法、HTML 标签后再计数，避免代码把时长撑爆 */
function stripNoise(markdown: string): string {
  return markdown
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '') // front-matter
    .replace(/```[\s\S]*?```/g, ' ')                    // 围栏代码块
    .replace(/`[^`]*`/g, ' ')                              // 行内代码
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')                 // 图片
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')                // 链接保留文字
    .replace(/<[^>]+>/g, ' ');                              // HTML 标签
}

export function countUnits(text: string): { cjk: number; words: number; total: number } {
  const clean = stripNoise(text);
  const cjk = (clean.match(CJK_RE) ?? []).length;
  const words = (clean.match(WORD_RE) ?? []).length;
  return { cjk, words, total: cjk + words };
}

/**
 * @returns 分钟数，至少 1
 */
export function readingTime(text: string, cjkPerMinute = 350, wordsPerMinute = 220): number {
  const { cjk, words } = countUnits(text);
  const minutes = cjk / cjkPerMinute + words / wordsPerMinute;
  return Math.max(1, Math.round(minutes));
}
