/**
 * XML 合法性校验：交给 Chrome 的 DOMParser（真解析器，不是正则糊弄）。
 * 返回 { ok, error, rootName }。
 */
import { launchChrome, DEFAULT_CHROME } from './chrome-cdp.mjs';

export async function assertWellFormedXml(xmlText, { chromePath = process.env.CHROME_PATH || DEFAULT_CHROME } = {}) {
  const chrome = await launchChrome({ chromePath });
  try {
    const page = await chrome.openPage('about:blank');
    const payload = JSON.stringify(xmlText);
    const result = await page.evaluate(
      '(() => { const doc = new DOMParser().parseFromString(' + payload + ", 'application/xml');" +
        " const err = doc.querySelector('parsererror');" +
        ' return { ok: !err, error: err ? err.textContent.slice(0, 400) : null, rootName: doc.documentElement ? doc.documentElement.tagName : null }; })()',
    );
    await page.close();
    return result;
  } finally {
    await chrome.close();
  }
}
