/**
 * 零依赖静态服务器：把 dist/ 按 HTTP 提供给无头 Chrome。
 * 为什么必须走 HTTP：Pagefind 的 wasm / Web Worker / fetch 在 file:// 下会被浏览器拦截，
 * 只有真实 HTTP 源才能复现线上行为。
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

/** 无扩展名的 Pagefind 数据文件（.pf_fragment / .pf_meta / .pf_index）走二进制 */
function contentType(file) {
  const ext = path.extname(file).toLowerCase();
  if (MIME[ext]) return MIME[ext];
  if (/\.pf_(fragment|meta|index)$/.test(file)) return 'application/octet-stream';
  return 'application/octet-stream';
}

/**
 * @param {{distDir: string, port?: number, extraRoutes?: Record<string, string>}} opts
 *   extraRoutes：虚拟路由（如 { '/__qa_probe.html': '<html>…' }），用于在不污染 dist 的前提下
 *   注入探针页面；命中虚拟路由时不读磁盘。
 * @returns {Promise<{origin: string, port: number, close: () => Promise<void>, requests: string[]}>}
 */
export async function serveDist({ distDir, port = 0, extraRoutes = {} }) {
  const root = path.resolve(distDir);
  if (!fs.existsSync(root)) throw new Error('dist 目录不存在：' + root);
  const requests = [];

  const server = http.createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    } catch {
      res.writeHead(400).end('bad url');
      return;
    }
    requests.push(pathname);

    if (Object.prototype.hasOwnProperty.call(extraRoutes, pathname)) {
      const body = Buffer.from(extraRoutes[pathname], 'utf8');
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-length': body.length });
      res.end(body);
      return;
    }

    let file = path.join(root, pathname);
    // 防目录穿越
    if (!path.resolve(file).startsWith(root)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    if (pathname.endsWith('/')) file = path.join(file, 'index.html');
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    // 目录式 URL 兜底：/posts/xxx -> /posts/xxx/index.html
    if (!fs.existsSync(file) && fs.existsSync(file + path.sep + 'index.html')) {
      file = file + path.sep + 'index.html';
    }

    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('404 ' + pathname);
      return;
    }
    const body = fs.readFileSync(file);
    res.writeHead(200, { 'content-type': contentType(file), 'content-length': body.length });
    res.end(body);
  });

  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
  const actualPort = server.address().port;
  return {
    origin: 'http://127.0.0.1:' + actualPort,
    port: actualPort,
    requests,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}
