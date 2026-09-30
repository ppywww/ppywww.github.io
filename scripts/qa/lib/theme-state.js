// scripts/qa/lib/theme-state.js
// 读取当前主题状态（html class / data-theme / 背景色 / localStorage / 按钮 aria）。
(() => {
  const btn = document.querySelector('[data-theme-toggle]');
  return {
    cls: document.documentElement.className,
    theme: document.documentElement.dataset.theme,
    bg: getComputedStyle(document.documentElement).backgroundColor,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    inlineColorScheme: document.documentElement.style.colorScheme,
    stored: localStorage.getItem('pref-theme'),
    aria: btn ? btn.getAttribute('aria-pressed') : null,
    label: btn ? btn.getAttribute('aria-label') : null,
  };
})()
