// scripts/qa/lib/first-paint.js
// 在 document_start 注入：用 requestAnimationFrame 采样"首帧前"的 DOM/CSS 状态。
// rAF 回调在浏览器执行首次绘制之前运行，因此在 firstRaf 时刻若 <html> 已带 .dark
// 且 body 背景已是暗色，即可证明首帧不会是白底。
window.__fp = {};
(function () {
  function snap(label) {
    try {
      window.__fp[label] = {
        t: Math.round(performance.now()),
        readyState: document.readyState,
        htmlClass: document.documentElement.className,
        dataTheme: document.documentElement.dataset.theme || null,
        htmlBg: getComputedStyle(document.documentElement).backgroundColor,
        bodyExists: !!document.body,
        bodyBg: document.body ? getComputedStyle(document.body).backgroundColor : null,
        stored: (function () { try { return localStorage.getItem('pref-theme'); } catch (e) { return 'ERR'; } })(),
        styleSheetCount: document.styleSheets.length,
      };
    } catch (e) { window.__fp[label] = { error: String(e) }; }
  }
  requestAnimationFrame(function () { snap('firstRaf'); });
  requestAnimationFrame(function () { requestAnimationFrame(function () { snap('secondRaf'); }); });
  document.addEventListener('DOMContentLoaded', function () { snap('dcl'); });
  window.addEventListener('load', function () { snap('load'); });
})();
