/**
 * 站点元数据读取（只读）：consts.ts 的单点配置 + dist 实际产出的路由清单。
 * 只读解析源码，不 import TS（避免额外依赖与副作用）。
 */
import fs from 'node:fs';
import path from 'node:path';

/** 从 src/consts.ts 里取出 SITE 的字面量字段（验证「RSS 引用而非硬编码」的唯一真相源） */
export function readSiteConsts(projectRoot) {
  const src = fs.readFileSync(path.join(projectRoot, 'src', 'consts.ts'), 'utf8');
  const pick = (key) => {
    const m = new RegExp(key + ":\\s*'((?:[^'\\\\]|\\\\.)*)'").exec(src);
    return m ? m[1].replace(/\\\\'/g, "'") : null;
  };
  return { raw: src, title: pick('title'), description: pick('description'), author: pick('author'), lang: pick('lang'), url: pick('url') };
}

/** 递归列出 dist 下的文件（相对路径，POSIX 分隔符） */
export function listDistFiles(distDir) {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push(path.relative(distDir, full).split(path.sep).join('/'));
    }
  };
  if (fs.existsSync(distDir)) walk(distDir);
  return out.sort();
}

/** dist 里可作为站内路由访问的 HTML（index.html → 目录式 URL；404.html 单列） */
export function listRoutes(distDir) {
  const files = listDistFiles(distDir);
  const routes = [];
  for (const f of files) {
    if (!f.endsWith('.html')) continue;
    if (f === '404.html') {
      routes.push({ url: '/404.html', file: f, kind: '404' });
    } else if (f === 'index.html') {
      routes.push({ url: '/', file: f, kind: 'page' });
    } else if (f.endsWith('/index.html')) {
      routes.push({ url: '/' + f.slice(0, -'index.html'.length), file: f, kind: 'page' });
    } else {
      routes.push({ url: '/' + f, file: f, kind: 'page' });
    }
  }
  return routes;
}

/** 已发布文章（dist 产物口径：/posts/<slug>/index.html） */
export function listPostRoutes(distDir) {
  return listRoutes(distDir).filter(
    (r) => /^\/posts\/[^/]+\/$/.test(r.url),
  );
}

/** 路由 URL → dist 相对文件路径（用于「sitemap 里的 loc 是否真实存在」） */
export function routeToFile(urlPath) {
  let p = decodeURIComponent(urlPath);
  if (p.endsWith('/')) p += 'index.html';
  return p.replace(/^\//, '');
}
