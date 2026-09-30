// scripts/qa/lib/home-align.js
// 读取首页的对齐几何：profile 左边缘 vs 第一张卡片左边缘；副标题是否单行。
(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { left: +b.left.toFixed(2), right: +b.right.toFixed(2), width: +b.width.toFixed(2), top: +b.top.toFixed(2), height: +b.height.toFixed(2) }; };
  const profile = document.querySelector('section.profile');
  const card = document.querySelector('.post-card');
  const title = document.querySelector('.section-title');
  const lead = document.querySelector('.profile__lead');
  const content = document.querySelector('.content');
  const container = document.querySelector('.container');
  let leadLines = null;
  let leadLineBoxes = null;
  if (lead) {
    const range = document.createRange();
    range.selectNodeContents(lead);
    leadLineBoxes = [...range.getClientRects()].filter((b) => b.width > 0 && b.height > 0).map((b) => ({ top: +b.top.toFixed(1), width: +b.width.toFixed(1) }));
    const tops = new Set(leadLineBoxes.map((b) => Math.round(b.top)));
    leadLines = tops.size;
  }
  const cs = lead ? getComputedStyle(lead) : null;
  return {
    viewport: window.innerWidth,
    content: r(content),
    container: r(container),
    profile: r(profile),
    profileTitle: r(document.querySelector('.profile__title')),
    firstCard: r(card),
    sectionTitle: r(title),
    lead: r(lead),
    leadLines: leadLines,
    leadLineBoxes: leadLineBoxes,
    leadFontSize: cs ? cs.fontSize : null,
    leadLineHeight: cs ? cs.lineHeight : null,
    leadWhiteSpace: cs ? cs.whiteSpace : null,
    leadMaxWidth: cs ? cs.maxWidth : null,
    leadTextLength: lead ? (lead.textContent || '').trim().length : null,
    alignDelta: profile && card ? +(card.getBoundingClientRect().left - profile.getBoundingClientRect().left).toFixed(2) : null,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  };
})()
