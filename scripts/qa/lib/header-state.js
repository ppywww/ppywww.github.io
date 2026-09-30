// scripts/qa/lib/header-state.js
// 读取页头/汉堡菜单的几何与可访问性状态（移动端页头验收用）。
(() => {
  const box = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { w: Math.round(b.width), h: Math.round(b.height), top: Math.round(b.top), left: Math.round(b.left), display: cs.display, visibility: cs.visibility, opacity: cs.opacity, position: cs.position };
  };
  const header = document.querySelector('.site-header');
  const nav = document.querySelector('#site-menu');
  const btn = document.querySelector('.menu-toggle');
  const inner = document.querySelector('.site-header__inner');
  const items = nav ? [...nav.querySelectorAll('a')].filter((a) => a.getBoundingClientRect().height > 1).map((a) => a.textContent.trim()) : [];
  const ae = document.activeElement;
  return {
    viewport: window.innerWidth + 'x' + window.innerHeight,
    header: box(header),
    headerInner: box(inner),
    nav: box(nav),
    toggle: box(btn),
    toggleAriaExpanded: btn ? btn.getAttribute('aria-expanded') : null,
    toggleAriaControls: btn ? btn.getAttribute('aria-controls') : null,
    toggleAriaLabel: btn ? btn.getAttribute('aria-label') : null,
    visibleNavItems: items,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    active: ae ? ae.tagName.toLowerCase() + (ae.getAttribute('aria-label') ? '[' + ae.getAttribute('aria-label') + ']' : '') + ':' + (ae.textContent || '').trim().slice(0, 14) : null,
  };
})()
