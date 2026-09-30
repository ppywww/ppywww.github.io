/**
 * 日期格式化 —— 固定按 Asia/Shanghai 输出，避免 CI（UTC）与本机（+08:00）
 * 因时区差异把 09-30 渲染成 09-29。
 */
const DATE_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** → "2026-09-30"（en-CA 恰好是 ISO 形态） */
export function formatDate(date: Date): string {
  return DATE_FMT.format(date);
}

/** → "2026 年 9 月 30 日" */
export function formatDateCN(date: Date): string {
  const [y, m, d] = formatDate(date).split('-');
  return `${y} 年 ${Number(m)} 月 ${Number(d)} 日`;
}

/** → "2026-09"（归档分组用） */
export function monthKey(date: Date): string {
  return formatDate(date).slice(0, 7);
}
