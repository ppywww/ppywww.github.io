// scripts/qa/check-og-image.mjs
// 用法: node scripts/qa/check-og-image.mjs [--out scripts/qa/evidence]
// 复验：og:image 是否全站存在、目标图是否真实存在且为 1200x630；robots.txt 是否 200。
import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const getArg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const OUT = resolve(getArg("--out", join(HERE, "evidence")));
const ORIGIN = "https://ppywww.github.io";
mkdirSync(OUT, { recursive: true });

const PAGES = ["/", "/posts/", "/archives/", "/categories/", "/tags/", "/works/", "/about/", "/search/", "/posts/2026-09-30-build-this-blog/", "/posts/2026-09-28-why-i-blog/", "/posts/2026-09-25-reading-note-template/", "/categories/技术/", "/tags/Astro/", "/404.html"];

function pngSize(buf) {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

async function main() {
  const out = { generatedAt: new Date().toISOString(), pages: [], ogImage: null, robots: null };
  for (const p of PAGES) {
    try {
      const r = await fetch(ORIGIN + encodeURI(p), { redirect: "follow" });
      const html = await r.text();
      const m = html.match(/<meta property="og:image" content="([^"]+)"/);
      const tw = html.match(/<meta name="twitter:image" content="([^"]+)"/);
      out.pages.push({ path: p, status: r.status, hasOgImage: !!m, ogImage: m ? m[1] : null, hasTwitterImage: !!tw });
    } catch (e) { out.pages.push({ path: p, error: String(e).slice(0, 120) }); }
  }
  try {
    const r = await fetch(ORIGIN + "/og-default.png");
    const buf = Buffer.from(await r.arrayBuffer());
    out.ogImage = { status: r.status, contentType: r.headers.get("content-type"), bytes: buf.length, dimensions: pngSize(buf) };
    writeFileSync(join(OUT, "og-default.png"), buf);
  } catch (e) { out.ogImage = { error: String(e).slice(0, 200) }; }
  try {
    const r = await fetch(ORIGIN + "/robots.txt");
    const t = await r.text();
    out.robots = { status: r.status, body: t.slice(0, 400) };
  } catch (e) { out.robots = { error: String(e).slice(0, 200) }; }
  writeFileSync(join(OUT, "og-image.json"), JSON.stringify(out, null, 2));
  const missing = out.pages.filter((p) => !p.hasOgImage);
  console.log("页面数 = " + out.pages.length + " | 缺 og:image = " + missing.length + (missing.length ? " -> " + missing.map((m) => m.path).join(", ") : ""));
  console.log("og:image URL 取值集合 = " + JSON.stringify([...new Set(out.pages.map((p) => p.ogImage))]));
  console.log("og-default.png = " + JSON.stringify(out.ogImage));
  console.log("robots.txt = " + JSON.stringify(out.robots));
  console.log("out=" + join(OUT, "og-image.json"));
}
main().catch((e) => { console.error("FATAL", e); process.exit(1); });
