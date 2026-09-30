/**
 * 亮/暗对比截图（task-20 的辅助证据）
 *
 * 为什么要真截图：强调色变量若被换肤改坏，CSS 不会报错——只有肉眼看图或量化对比度才能发现。
 * 本脚本用同一个页面渲染两次（默认亮色 / 手动加 .dark 类，等价于站点主题切换后的 DOM 状态），
 * 输出两张 PNG 供人工复核；客观可辨识度由 check-theme-tokens.mjs 的对比度断言给出。
 *
 * 用法：node scripts/qa-search/snap-theme.mjs [--base URL] [--page /posts/xxx/]
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { launchChrome } from './lib/chrome-cdp.mjs';
import { serveDist } from './lib/serve-dist.mjs';

const PROJECT_ROOT = new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const OUT_DIR = PROJECT_ROOT + 'scripts/qa-search/evidence';

function parseArgs(argv) {
  const opts = { base: 'https://ppywww.github.io', page: '/posts/2026-09-30-build-this-blog/', out: OUT_DIR, width: 1264, height: 771 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--base') opts.base = argv[++i];
    else if (argv[i] === '--page') opts.page = argv[++i];
    else if (argv[i] === '--out') opts.out = argv[++i];
    else if (argv[i] === '--width') opts.width = Number(argv[++i]);
    else if (argv[i] === '--height') opts.height = Number(argv[++i]);
  }
  return opts;
}

export async function run(opts = {}) {
  const o = Object.assign(parseArgs([]), opts);
  fs.mkdirSync(o.out, { recursive: true });
  let server = null;
  let origin = o.base.replace(/\/+$/, '');
  if (origin === 'local') {
    server = await serveDist({ distDir: PROJECT_ROOT + 'dist', port: 0 });
    origin = server.origin;
  }
  const chrome = await launchChrome({ width: o.width, height: o.height });
  const written = [];
  try {
    const page = await chrome.openPage(origin + o.page);
    // Chrome 在 Windows 上有约 500px 的**最小窗口宽度**：只靠 --window-size 拿到的是被撑大的视口，
    // 截图会与标称宽度不符。用 Emulation 强制设备度量，才能保证「标称 320 就真是 320」。
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: o.width,
      height: o.height,
      deviceScaleFactor: 1,
      mobile: o.width <= 768,
    });
    await new Promise((r) => setTimeout(r, 1200));
    for (const mode of ['light', 'dark']) {
      await page.evaluate(
        "(function (mode) {" +
          "  var root = document.documentElement;" +
          "  root.classList.toggle('dark', mode === 'dark');" +
          "  root.classList.toggle('light', mode === 'light');" +
          "  root.dataset.theme = mode;" +
          "  root.style.colorScheme = mode;" +
          '  return mode; })(' + JSON.stringify(mode) + ')',
      );
      await new Promise((r) => setTimeout(r, 250));
      const shot = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      const suffix = o.width === 1264 ? '' : '-w' + o.width;
      const file = path.join(o.out, 'theme-' + mode + suffix + '.png');
      fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
      written.push(file);
    }
    await page.close();
  } finally {
    await chrome.close();
    if (server) await server.close();
  }
  return { origin: origin, page: o.page, files: written };
}

const invokedDirectly = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/qa-search/snap-theme.mjs');
if (invokedDirectly) {
  const out = await run(parseArgs(process.argv.slice(2)));
  console.log('截图完成：' + out.origin + out.page);
  for (const f of out.files) console.log('  ' + f + '（' + fs.statSync(f).size + ' 字节）');
}
