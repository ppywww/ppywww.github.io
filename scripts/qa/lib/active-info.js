// scripts/qa/lib/active-info.js
// 读取当前焦点元素信息 + skip-link 的呈现状态（键盘可达性验收用）。
(() => {
  const el = document.activeElement;
  if (!el) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const s = document.querySelector('.skip-link');
  let skip = null;
  if (s) {
    const sc = getComputedStyle(s);
    const sr = s.getBoundingClientRect();
    skip = { top: Math.round(sr.top), left: Math.round(sr.left), w: Math.round(sr.width), h: Math.round(sr.height), clip: sc.clip, transform: sc.transform, opacity: sc.opacity, position: sc.position };
  }
  return {
    tag: el.tagName.toLowerCase(),
    text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30),
    href: el.getAttribute ? el.getAttribute('href') : null,
    cls: el.getAttribute ? el.getAttribute('class') : null,
    aria: el.getAttribute ? el.getAttribute('aria-label') : null,
    outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor,
    boxShadow: cs.boxShadow === 'none' ? 'none' : 'set',
    rect: Math.round(r.width) + 'x' + Math.round(r.height),
    visible: r.width > 1 && r.height > 1 && cs.visibility !== 'hidden' && cs.opacity !== '0',
    skipLink: skip,
  };
})()
