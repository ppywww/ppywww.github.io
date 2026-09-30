// scripts/qa/lib/form-info.js
// 读取页面上的搜索表单入口信息（404 页 / 搜索页验收用）。
(() => {
  const f = document.querySelector('form');
  const i = document.querySelector('input[type=search], input[name=q], input[name=query]');
  return {
    hasForm: !!f,
    action: f ? f.getAttribute('action') : null,
    method: f ? (f.getAttribute('method') || 'get') : null,
    inputName: i ? i.getAttribute('name') : null,
    inputPlaceholder: i ? i.getAttribute('placeholder') : null,
    scriptSrcs: [...document.querySelectorAll('script[src]')].map((s) => s.getAttribute('src')),
    pagefindUiPresent: typeof window.PagefindUI !== 'undefined' || !!document.querySelector('[data-pagefind-ui]'),
  };
})()
