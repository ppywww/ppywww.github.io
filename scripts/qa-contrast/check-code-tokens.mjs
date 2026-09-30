/**
 * 代码块 token 对比度门禁（task-14 第 1 项）
 *
 * 做什么：把构建产物里（dist 下全部 html）出现过的每一条 Shiki token 颜色全部抠出来，
 * 对代码块的实际底色逐条实算 WCAG 2.1 对比度，任何一条 < 4.5:1 即失败（exit 1）。
 * 为什么这么写：抽样或估算都可能漏掉只在某个语言/某个 token 上出现的低对比度颜色；
 * 这里不做抽样 —— 颜色集合直接来自产物本身，颜色多了会自动跟着变多。
 *
 * 底色来源：src/styles/tokens.css 的 --color-code-bg（亮色取 :root，暗色取 :root.dark），
 * 按 var() 链一路解析到真实 hex；若该 token 缺失则回落到 --color-surface-2（与 prose.css 的
 * background: var(--color-code-bg, var(--color-surface-2)) 口径一致）。
 *
 * 用法：node scripts/qa-contrast/check-code-tokens.mjs [--dist dist] [--json]
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const jsonOut = args.includes('--json');
const distArg = args.indexOf('--dist');
const DIST = path.resolve(distArg !== -1 ? args[distArg + 1] : 'dist');
const TOKENS = path.resolve('src/styles/tokens.css');

/* ---------- WCAG 2.1 相对亮度 / 对比度 ---------- */
function luminance(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/* ---------- 从 tokens.css 解析出真实的代码块底色 ---------- */
function parseBlocks(css) {
  const blocks = [];
  const re = /([^{}]+)\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const decls = {};
    for (const d of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) decls[d[1]] = d[2].trim();
    blocks.push({ selector: m[1].trim(), decls });
  }
  return blocks;
}
function resolveVar(name, scope) {
  let value = scope[name];
  for (let i = 0; i < 10 && typeof value === 'string'; i++) {
    const v = value.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)$/);
    if (!v) break;
    value = scope[v[1]] ?? v[2];
    if (value === undefined) return undefined;
  }
  return typeof value === 'string' ? value.trim() : undefined;
}
function codeBackgrounds() {
  // 先剥掉注释：注释里可能含花括号，且会让选择器字符串带上注释文本导致 ":root" 匹配失败
  const css = fs.readFileSync(TOKENS, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks = parseBlocks(css);
  const lightScope = {};
  for (const b of blocks) if (/^:root$/.test(b.selector)) Object.assign(lightScope, b.decls);
  const darkScope = { ...lightScope };
  for (const b of blocks) if (/:root\.dark/.test(b.selector)) Object.assign(darkScope, b.decls);
  const pick = (scope, name) => resolveVar(name, scope) ?? resolveVar('--color-surface-2', scope);
  return { light: pick(lightScope, '--color-code-bg'), dark: pick(darkScope, '--color-code-bg') };
}

/* ---------- 扫描产物 ---------- */
function htmlFiles(dir) {
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) out.push(p);
    }
  })(dir);
  return out;
}

const bg = codeBackgrounds();
const light = new Map();
const dark = new Map();
let codeBlocks = 0;
for (const file of htmlFiles(DIST)) {
  const html = fs.readFileSync(file, 'utf8');
  codeBlocks += (html.match(/class="code-block"/g) ?? []).length;
  for (const m of html.matchAll(/--shiki-light:(#[0-9a-fA-F]{3,8})/g)) {
    const c = m[1].toUpperCase();
    light.set(c, (light.get(c) ?? 0) + 1);
  }
  for (const m of html.matchAll(/--shiki-dark:(#[0-9a-fA-F]{3,8})/g)) {
    const c = m[1].toUpperCase();
    dark.set(c, (dark.get(c) ?? 0) + 1);
  }
}

const rows = [];
for (const [theme, map, bgColor] of [
  ['light', light, bg.light],
  ['dark', dark, bg.dark],
]) {
  for (const [color, count] of [...map.entries()].sort()) {
    const ratio = contrast(color, bgColor);
    rows.push({ theme, color, bg: bgColor, ratio, count, pass: ratio >= 4.5 });
  }
}

const failed = rows.filter((r) => !r.pass);
if (jsonOut) {
  console.log(JSON.stringify({ backgrounds: bg, codeBlocks, rows, failed: failed.length }, null, 2));
} else {
  console.log('代码块 token 对比度门禁（WCAG 2.1 AA 文本 ≥4.5:1）');
  console.log('代码块数：' + codeBlocks + ' · 出现过的 token 颜色：亮色 ' + light.size + ' 个 / 暗色 ' + dark.size + ' 个');
  console.log('代码底：light=' + bg.light + '  dark=' + bg.dark + '（来自 tokens.css --color-code-bg）\n');
  for (const theme of ['light', 'dark']) {
    const list = rows.filter((r) => r.theme === theme).sort((a, b) => a.ratio - b.ratio);
    console.log('【' + theme + '】底 ' + (theme === 'light' ? bg.light : bg.dark));
    for (const r of list) {
      console.log('  ' + r.color + '  ' + r.ratio.toFixed(2) + ':1  ' + (r.pass ? 'PASS' : 'FAIL') + '  （出现 ' + r.count + ' 次）');
    }
    console.log('');
  }
  console.log(failed.length === 0
    ? '结论：全部 ' + rows.length + ' 条 token 颜色达标 ✅'
    : '结论：' + failed.length + ' 条不达标 ❌ → ' + failed.map((r) => r.theme + ' ' + r.color + ' ' + r.ratio.toFixed(2)).join('; '));
}
process.exit(failed.length === 0 ? 0 : 1);
