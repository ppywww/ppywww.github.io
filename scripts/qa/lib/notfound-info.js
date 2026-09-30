// scripts/qa/lib/notfound-info.js
// 读取自定义 404 页的关键信息（标题/状态提示/出路入口/最新文章）。
(() => {
  const txt = document.body.innerText.replace(/\s+/g, ' ');
  return {
    title: document.title,
    pathname: location.pathname,
    hasBackHome: txt.indexOf('返回首页') >= 0,
    hasSearchEntry: !!document.querySelector('input[type=search], form'),
    hasRecentPosts: document.querySelectorAll('a[href^="/posts/"]').length,
    robots: (document.querySelector('meta[name=robots]') || {}).content || null,
    h1: (document.querySelector('h1') || {}).textContent || null,
    textHead: txt.slice(0, 220),
  };
})()
