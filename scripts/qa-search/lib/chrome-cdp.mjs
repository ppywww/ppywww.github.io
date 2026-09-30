/**
 * 零依赖无头 Chrome 驱动（CDP over WebSocket，Node 22+ 内置 WebSocket）。
 *
 * 为什么不用 --dump-dom：dump-dom 依赖 load 事件与虚拟时间预算，Pagefind 要等
 * wasm 编译 + Worker + 异步索引加载，dump 时机不可控；CDP 可以轮询真实条件。
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const DEFAULT_CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** 等待 Chrome 写出 DevToolsActivePort（内含实际调试端口） */
async function waitForPort(userDataDir, timeoutMs) {
  const file = path.join(userDataDir, 'DevToolsActivePort');
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (fs.existsSync(file)) {
      const [port] = fs.readFileSync(file, 'utf8').split('\n');
      if (port && Number(port) > 0) return Number(port);
    }
    await sleep(120);
  }
  throw new Error('等待 DevToolsActivePort 超时：' + file);
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener('message', (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      }
    });
  }

  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('CDP 调用超时：' + method));
        }
      }, 30000);
    });
  }
}

/**
 * 启动无头 Chrome 并返回会话句柄。
 * @param {{chromePath?: string, width?: number, height?: number}} opts
 */
export async function launchChrome({ chromePath = DEFAULT_CHROME, width = 1280, height = 900 } = {}) {
  if (!fs.existsSync(chromePath)) throw new Error('找不到 Chrome：' + chromePath);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-chrome-'));
  const child = spawn(
    chromePath,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-sync',
      '--hide-scrollbars',
      '--mute-audio',
      '--remote-debugging-port=0',
      '--user-data-dir=' + userDataDir,
      '--window-size=' + width + ',' + height,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  const port = await waitForPort(userDataDir, 20000);
  const version = await (await fetch('http://127.0.0.1:' + port + '/json/version')).json();
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', () => reject(new Error('WebSocket 连接失败')), { once: true });
  });
  const cdp = new Cdp(ws);
  await cdp.send('Target.setDiscoverTargets', { discover: true });

  async function openPage(url) {
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Page.navigate', { url }, sessionId);
    return {
      sessionId,
      targetId,
      /** 在页面里求值（支持 awaitPromise） */
      async evaluate(expression, { awaitPromise = true } = {}) {
        const res = await cdp.send(
          'Runtime.evaluate',
          { expression, returnByValue: true, awaitPromise },
          sessionId,
        );
        if (res.exceptionDetails) {
          throw new Error('页面内求值异常：' + JSON.stringify(res.exceptionDetails.exception?.description ?? res.exceptionDetails));
        }
        return res.result.value;
      },
      async close() {
        try {
          await cdp.send('Target.closeTarget', { targetId });
        } catch {
          /* 忽略 */
        }
      },
    };
  }

  return {
    openPage,
    async close() {
      try {
        ws.close();
      } catch {
        /* 忽略 */
      }
      child.kill();
      await sleep(200);
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      } catch {
        /* Windows 上偶发占用，忽略 */
      }
    },
  };
}

/**
 * 轮询页面内条件表达式，直到返回真值或超时。
 * @returns {Promise<{ok: boolean, value: unknown, waitedMs: number}>}
 */
export async function waitFor(page, expression, { timeoutMs = 20000, intervalMs = 250 } = {}) {
  const started = Date.now();
  let value;
  while (Date.now() - started < timeoutMs) {
    try {
      value = await page.evaluate(expression);
      if (value) return { ok: true, value, waitedMs: Date.now() - started };
    } catch {
      /* 页面尚未就绪，继续轮询 */
    }
    await sleep(intervalMs);
  }
  return { ok: false, value, waitedMs: Date.now() - started };
}
