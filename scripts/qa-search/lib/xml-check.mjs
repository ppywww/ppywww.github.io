/**
 * XML 校验与字段抽取：交给 Chrome 的真 DOMParser（不是正则糊弄）。
 * 一次启动同时拿到「是否合法」与「结构化字段」。
 */
import { launchChrome, DEFAULT_CHROME } from './chrome-cdp.mjs';

/**
 * @param {string} xmlText 原始 XML 文本
 * @param {string} extractorExpr 形如 "(doc) => ({...})" 的表达式，在页面里执行，可访问 doc
 * @returns {Promise<{wellFormed: boolean, parseError: string|null, rootName: string|null, data: unknown}>}
 */
export async function inspectXml(xmlText, extractorExpr, { chromePath = process.env.CHROME_PATH || DEFAULT_CHROME } = {}) {
  const chrome = await launchChrome({ chromePath });
  try {
    const page = await chrome.openPage('about:blank');
    const payload = JSON.stringify(xmlText);
    const expr =
      '(() => { const doc = new DOMParser().parseFromString(' + payload + ", 'application/xml');" +
      " const err = doc.querySelector('parsererror');" +
      ' const wellFormed = !err;' +
      ' const data = wellFormed ? (' + extractorExpr + ')(doc) : null;' +
      ' return { wellFormed: wellFormed, parseError: err ? err.textContent.slice(0, 400) : null,' +
      '          rootName: doc.documentElement ? doc.documentElement.tagName : null, data: data }; })()';
    const result = await page.evaluate(expr);
    await page.close();
    return result;
  } finally {
    await chrome.close();
  }
}

/** 仅做合法性校验 */
export async function assertWellFormedXml(xmlText, opts) {
  return inspectXml(xmlText, '() => null', opts);
}
