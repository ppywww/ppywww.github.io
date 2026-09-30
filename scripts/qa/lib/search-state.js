// scripts/qa/lib/search-state.js
// 读取搜索页当前状态（结果条数、状态文案、焦点位置、空态可见性）。
(() => {
  const input = document.querySelector('#search-input') || document.querySelector('input[type=search]');
  const list = document.querySelector('#search-results');
  const status = document.querySelector('#search-status') || document.querySelector('[role=status]');
  const empty = document.querySelector('#search-empty');
  const emptyTitle = document.querySelector('#search-empty-title');
  const emptyActions = document.querySelector('#search-empty-actions');
  const items = list ? [...list.querySelectorAll('li')] : [];
  const active = document.activeElement;
  const vis = (el) => { if (!el) return null; const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { hidden: el.hasAttribute('hidden'), display: cs.display, opacity: cs.opacity, h: Math.round(r.height) }; };
  return {
    inputValue: input ? input.value : null,
    resultsCount: items.length,
    resultTitles: items.slice(0, 5).map((li) => (li.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70)),
    resultHrefs: items.slice(0, 5).map((li) => { const a = li.querySelector('a'); return a ? a.getAttribute('href') : null; }),
    statusText: status ? (status.textContent || '').trim() : null,
    statusRole: status ? (status.getAttribute('role') || '') + '/' + (status.getAttribute('aria-live') || '') : null,
    emptyTitle: emptyTitle ? (emptyTitle.textContent || '').trim() : null,
    emptyVisible: vis(empty),
    emptyActionsVisible: vis(emptyActions),
    activeTag: active ? active.tagName.toLowerCase() : null,
    activeId: active && active.id ? active.id : null,
    activeHref: active && active.getAttribute ? active.getAttribute('href') : null,
    activeText: active ? (active.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50) : null,
    scriptSrcs: [...document.querySelectorAll('script[src]')].map((s) => s.getAttribute('src')),
    bodyHead: document.body.innerText.replace(/\s+/g, ' ').slice(0, 160),
  };
})()
