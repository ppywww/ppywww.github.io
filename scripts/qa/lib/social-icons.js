// scripts/qa/lib/social-icons.js
// 读取首页社交图标区每个图标的渲染尺寸（用于判断 RSS 图标是否塌缩成一个小点）。
(() => {
  const ul = document.querySelector('ul.social-icons') || document.querySelector('.social-icons');
  if (!ul) return { found: false };
  const items = [...ul.querySelectorAll('a')].map((a) => {
    const svg = a.querySelector('svg');
    const ab = a.getBoundingClientRect();
    const sb = svg ? svg.getBoundingClientRect() : null;
    const cs = svg ? getComputedStyle(svg) : null;
    return {
      href: a.getAttribute('href'),
      ariaLabel: a.getAttribute('aria-label'),
      linkBox: Math.round(ab.width) + 'x' + Math.round(ab.height),
      svgBox: sb ? Math.round(sb.width) + 'x' + Math.round(sb.height) : null,
      cssWidth: cs ? cs.width : null,
      cssHeight: cs ? cs.height : null,
      viewBox: svg ? svg.getAttribute('viewBox') : null,
      shapes: svg ? svg.querySelectorAll('path,circle,rect,line,polyline').length : null,
      visiblePixels: sb ? Math.round(sb.width * sb.height) : 0,
    };
  });
  const wb = ul.getBoundingClientRect();
  return { found: true, count: items.length, listBox: Math.round(wb.width) + 'x' + Math.round(wb.height), items: items };
})()
