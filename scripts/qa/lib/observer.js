// scripts/qa/lib/observer.js
// 在文档开始前注入的性能观察器（LCP / CLS / paint 时间）。
window.__qa = { lcp: null, cls: 0, paints: [] };
try {
  new PerformanceObserver(function (l) {
    var es = l.getEntries();
    for (var i = 0; i < es.length; i++) { window.__qa.lcp = Math.round(es[i].startTime); }
  }).observe({ type: 'largest-contentful-paint', buffered: true });
} catch (e) {}
try {
  new PerformanceObserver(function (l) {
    var es = l.getEntries();
    for (var i = 0; i < es.length; i++) { if (!es[i].hadRecentInput) { window.__qa.cls = +(window.__qa.cls + es[i].value).toFixed(4); } }
  }).observe({ type: 'layout-shift', buffered: true });
} catch (e) {}
try {
  new PerformanceObserver(function (l) {
    var es = l.getEntries();
    for (var i = 0; i < es.length; i++) { window.__qa.paints.push({ name: es[i].name, t: Math.round(es[i].startTime) }); }
  }).observe({ type: 'paint', buffered: true });
} catch (e) {}
