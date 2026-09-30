// scripts/qa/lib/cdp.mjs
// 零依赖 CDP 客户端：驱动本机 Chrome 无头模式做真机验收。
// 不安装任何 npm 包，不依赖 puppeteer。
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import zlib from "node:zlib";

export const CHROME =
  process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launchChrome({ port = 9333, extraArgs = [] } = {}) {
  const profile = mkdtempSync(join(tmpdir(), "qa-chrome-"));
  const args = [
    "--headless=new",
    "--remote-debugging-port=" + port,
    "--user-data-dir=" + profile,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-sync",
    "--metrics-recording-only",
    "--hide-scrollbars",
    "--window-size=1280,900",
    ...extraArgs,
    "about:blank",
  ];
  const proc = spawn(CHROME, args, { stdio: "ignore" });
  const deadline = Date.now() + 30000;
  let version = null;
  while (Date.now() < deadline) {
    try {
      const r = await fetch("http://127.0.0.1:" + port + "/json/version");
      if (r.ok) {
        version = await r.json();
        break;
      }
    } catch {}
    await sleep(200);
  }
  if (!version) {
    try { proc.kill(); } catch {}
    throw new Error("Chrome 未在 30s 内暴露 DevTools 端点");
  }
  return {
    proc, port, profile, version,
    async close() {
      try { spawn("taskkill", ["/PID", String(proc.pid), "/T", "/F"], { stdio: "ignore" }); } catch {}
      await sleep(400);
      try { rmSync(profile, { recursive: true, force: true }); } catch {}
    },
  };
}

export class CDP {
  constructor(ws) {
    this.ws = ws;
    this.seq = 0;
    this.pending = new Map();
    this.handlers = new Map();
    this.closed = false;
  }
  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", (e) => reject(new Error("WS 连接失败: " + (e.message || "unknown"))), { once: true });
    });
    const c = new CDP(ws);
    ws.addEventListener("message", (ev) => c._onMessage(JSON.parse(ev.data)));
    ws.addEventListener("close", () => { c.closed = true; });
    return c;
  }
  _onMessage(msg) {
    if (msg.id !== undefined) {
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      if (msg.error) p.reject(new Error(msg.method ? msg.method : "" + msg.error.message));
      else p.resolve(msg.result);
      return;
    }
    if (msg.method) {
      const list = this.handlers.get(msg.method) || [];
      for (const h of list) { try { h(msg.params || {}, msg.sessionId); } catch {} }
    }
  }
  send(method, params = {}, sessionId) {
    const id = ++this.seq;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) { this.pending.delete(id); reject(new Error("CDP 超时: " + method)); }
      }, 180000);
    });
  }
  on(method, fn) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(fn);
    return () => {
      const l = this.handlers.get(method) || [];
      const i = l.indexOf(fn);
      if (i >= 0) l.splice(i, 1);
    };
  }
  waitFor(method, timeout = 30000, sessionId) {
    return new Promise((resolve, reject) => {
      const off = this.on(method, (params, sid) => {
        if (sessionId && sid !== sessionId) return;
        off(); clearTimeout(t); resolve(params);
      });
      const t = setTimeout(() => { off(); reject(new Error("等待事件超时: " + method)); }, timeout);
    });
  }
  close() { try { this.ws.close(); } catch {} }
}

export async function attachNewPage(cdp, url = "about:blank") {
  const { targetId } = await cdp.send("Target.createTarget", { url });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  return { targetId, sessionId };
}

// ---------- 极简 PNG 解码（仅 8bit 非交错 RGB/RGBA）----------
export function decodePNG(buf) {
  if (buf.length < 8 || buf.readUInt32BE(0) !== 0x89504e47) throw new Error("不是 PNG");
  let off = 8;
  let ihdr = null;
  const idat = [];
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      ihdr = {
        width: data.readUInt32BE(0), height: data.readUInt32BE(4),
        bitDepth: data[8], colorType: data[9], interlace: data[12],
      };
    } else if (type === "IDAT") idat.push(Buffer.from(data));
    else if (type === "IEND") break;
    off += 12 + len;
  }
  if (!ihdr) throw new Error("缺 IHDR");
  if (ihdr.bitDepth !== 8 || ihdr.interlace !== 0) {
    throw new Error("不支持: depth=" + ihdr.bitDepth + " interlace=" + ihdr.interlace);
  }
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[ihdr.colorType];
  if (!channels) throw new Error("不支持 colorType=" + ihdr.colorType);
  const stride = ihdr.width * channels;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(ihdr.height * stride);
  let pos = 0;
  for (let y = 0; y < ihdr.height; y++) {
    const filter = raw[pos++];
    const line = raw.subarray(pos, pos + stride);
    pos += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= channels ? prev[x - channels] : 0;
      let v = line[x];
      if (filter === 1) v = (v + a) & 0xff;
      else if (filter === 2) v = (v + b) & 0xff;
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        v = (v + pr) & 0xff;
      } else if (filter !== 0) throw new Error("未知 filter " + filter);
      cur[x] = v;
    }
  }
  return { width: ihdr.width, height: ihdr.height, channels, data: out };
}

export function pixelAt(img, x, y) {
  const i = (y * img.width + x) * img.channels;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
}

// 网格采样：返回主色 + 近白像素占比（用于判定"是否出现白闪"）
export function gridStats(img, step = 16, whiteThreshold = 245) {
  const counts = new Map();
  let total = 0, nearWhite = 0;
  for (let y = 2; y < img.height; y += step) {
    for (let x = 2; x < img.width; x += step) {
      const [r, g, b] = pixelAt(img, x, y);
      const key = r + "," + g + "," + b;
      counts.set(key, (counts.get(key) || 0) + 1);
      total++;
      if (r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold) nearWhite++;
    }
  }
  let mode = null, modeN = -1;
  for (const [k, n] of counts) if (n > modeN) { modeN = n; mode = k; }
  return { samples: total, nearWhiteRatio: total ? +(nearWhite / total).toFixed(4) : null, mode: mode, modeRatio: total ? +(modeN / total).toFixed(4) : null };
}

export function hex(rgb) {
  return "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
}
