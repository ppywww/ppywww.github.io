// scripts/qa/lib/probe.js
// 在页面上下文里执行的探测表达式（由 check-site.mjs 通过 Runtime.evaluate 注入）。
// 注意：本文件不含反引号，便于作为纯文本注入。
(() => {
  const abs = (h) => { try { return new URL(h, location.href).href; } catch (e) { return h; } };
  const clsOf = (el) => { const c = el.getAttribute && el.getAttribute('class'); return c ? '.' + c.trim().split(/\s+/).join('.') : ''; };
  const anchors = [...document.querySelectorAll('a[href]')].map((a) => ({
    href: abs(a.getAttribute('href')),
    target: a.getAttribute('target'),
    rel: a.getAttribute('rel'),
    text: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40),
  }));
  const resources = performance.getEntriesByType('resource').map((r) => ({
    name: r.name.replace(location.origin, ''),
    type: r.initiatorType,
    transfer: r.transferSize,
    encoded: r.encodedBodySize,
    decoded: r.decodedBodySize,
    start: Math.round(r.startTime),
    end: Math.round(r.responseEnd),
  }));
  const nav = performance.getEntriesByType('navigation')[0] || {};
  const qa = window.__qa || {};
  const rootCss = getComputedStyle(document.documentElement);
  const bodyCss = getComputedStyle(document.body);
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((e) => +e.tagName[1]);
  return {
    url: location.href,
    title: document.title,
    lang: document.documentElement.lang,
    htmlClass: document.documentElement.className,
    dataTheme: document.documentElement.dataset.theme || null,
    inlineColorScheme: document.documentElement.style.colorScheme || null,
    htmlBg: rootCss.backgroundColor,
    bodyBg: bodyCss.backgroundColor,
    bodyColor: bodyCss.color,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    innerWidth: window.innerWidth,
    overflowEls: [...document.querySelectorAll('body *')].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.right > window.innerWidth + 1;
    }).slice(0, 10).map((el) => el.tagName.toLowerCase() + clsOf(el) + ' right=' + Math.round(el.getBoundingClientRect().right)),
    anchors: anchors,
    resources: resources,
    navTiming: { ttfb: nav.responseStart, dcl: nav.domContentLoadedEventEnd, load: nav.loadEventEnd, transfer: nav.transferSize, encoded: nav.encodedBodySize },
    lcp: qa.lcp === undefined ? null : qa.lcp,
    cls: qa.cls === undefined ? null : qa.cls,
    paints: qa.paints || [],
    headingLevels: headings,
    h1Count: document.querySelectorAll('h1').length,
    imgCount: document.images.length,
    imgsNoAlt: [...document.images].filter((i) => i.getAttribute('alt') === null).length,
    landmarks: {
      main: !!document.querySelector('main'),
      header: !!document.querySelector('header'),
      footer: !!document.querySelector('footer'),
      nav: document.querySelectorAll('nav').length,
    },
    detailsCount: document.querySelectorAll('details').length,
    summaryCount: document.querySelectorAll('summary').length,
    skipLink: (() => {
      const a = document.querySelector('a[href^="#"]');
      return a ? { text: a.textContent.trim(), href: a.getAttribute('href'), cls: a.getAttribute('class') } : null;
    })(),
    metaDescription: (document.querySelector('meta[name=description]') || {}).content || null,
    canonical: (document.querySelector('link[rel=canonical]') || {}).href || null,
    ogTitle: (document.querySelector('meta[property="og:title"]') || {}).content || null,
    ogImage: (document.querySelector('meta[property="og:image"]') || {}).content || null,
    twitterCard: (document.querySelector('meta[name="twitter:card"]') || {}).content || null,
    jsonLdTypes: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => {
      try { const j = JSON.parse(s.textContent); return Array.isArray(j) ? j.map((x) => x['@type']).join(',') : (j['@type'] || '?'); } catch (e) { return 'parse-error'; }
    }),
    robots: (document.querySelector('meta[name=robots]') || {}).content || null,
    viewport: (document.querySelector('meta[name=viewport]') || {}).content || null,
    searchInputs: document.querySelectorAll('form[role=search], form.search-form, input[type=search]').length,
    bodyTextHead: document.body.innerText.replace(/\s+/g, ' ').slice(0, 200),
  };
})()
