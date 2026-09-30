// scripts/qa/check-schema-enum.mjs
// 用法: node scripts/qa/check-schema-enum.mjs
// AC-7 后半的**独立**schema 级复核（注意：这不是 astro build，只是用项目自带的 zod
// 与项目自己的 CATEGORIES 常量复现 content.config.ts 中那条枚举约束，并校验现有文章内容）。
// 构建期是否真的 exit 1，仍以构建方实测 + 本脚本结果共同佐证。
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");

let zSrc = "astro/zod";
let z;
try { z = (await import(zSrc)).z; } catch (e) { zSrc = "zod"; z = (await import(zSrc)).z; }
console.log("zod 来源 = " + zSrc + " (版本 " + JSON.parse(readFileSync(join(ROOT, "node_modules", zSrc.split("/")[0], "package.json"), "utf8")).version + ")");

const CATEGORIES = (await import("file:///" + join(ROOT, "src", "consts.ts").replace(/\\/g, "/"))).CATEGORIES;
console.log("CATEGORIES = " + JSON.stringify(CATEGORIES));

const schema = z.array(z.enum(CATEGORIES)).min(1, "categories 必填，且只能是：" + CATEGORIES.join(" / "));

const cases = [
  { name: "合法单值 ['技术']", value: ["技术"], expect: "pass" },
  { name: "非法值 ['科技']", value: ["科技"], expect: "fail" },
  { name: "空数组 []", value: [], expect: "fail" },
  { name: "两值 ['技术','生活']", value: ["技术", "生活"], expect: "pass" },
  { name: "英文值 ['Tech']", value: ["Tech"], expect: "fail" },
];
const results = [];
for (const c of cases) {
  const r = schema.safeParse(c.value);
  const got = r.success ? "pass" : "fail";
  results.push({ case: c.name, expect: c.expect, got: got, ok: got === c.expect, error: r.success ? null : r.error.issues.map((i) => i.path.join(".") + ": " + i.message).join(" | ") });
}
console.log("--- schema 判定 ---");
for (const r of results) console.log((r.ok ? "  PASS " : "  FAIL ") + r.case + " -> " + r.got + (r.error ? " | " + r.error : ""));

// 校验仓库内现有文章 front-matter 的分类取值
const postsDir = join(ROOT, "src", "content", "posts");
const content = [];
for (const f of readdirSync(postsDir).filter((f) => f.endsWith(".md"))) {
  const raw = readFileSync(join(postsDir, f), "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm = m ? m[1] : "";
  const cm = fm.match(/^categories:\s*\[(.*?)\]/m);
  const cats = cm ? cm[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean) : null;
  const r = cats ? schema.safeParse(cats) : { success: false };
  content.push({ file: f, categories: cats, valid: !!r.success });
}
console.log("--- 现有文章分类合规性 ---");
for (const c of content) console.log("  " + (c.valid ? "PASS " : "FAIL ") + c.file + " -> " + JSON.stringify(c.categories));
console.log("结论: schema 用例 " + results.filter((r) => r.ok).length + "/" + results.length + " 符合预期；文章 " + content.filter((c) => c.valid).length + "/" + content.length + " 合规");
