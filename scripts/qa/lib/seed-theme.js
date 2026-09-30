// scripts/qa/lib/seed-theme.js
// 在文档开始前写入 localStorage 主题偏好（占位符 __THEME__ 由调用方替换）。
try { localStorage.setItem('pref-theme', __THEME__); } catch (e) {}
