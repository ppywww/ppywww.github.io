// scripts/qa/lib/seed-theme.js
// 在文档开始前写入 localStorage 主题偏好（主题值由调用方注入）。
try { localStorage.setItem('pref-theme', __THEME_VALUE__); } catch (e) {}
