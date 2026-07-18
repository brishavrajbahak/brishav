import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { access, readdir, readFile, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const outputDir = join(process.cwd(), "out");
const indexPath = join(outputDir, "index.html");
await access(indexPath);

const html = await readFile(indexPath, "utf8");
const headers = await readFile(join(outputDir, "_headers"), "utf8");
const requiredText = [
  "Turning Data Into Cinematic Stories.",
  "Loan Default Prediction",
  "In development",
  "Data control room",
  "Have a question worth exploring?",
  "19.98%"
];

for (const text of requiredText) {
  assert(html.includes(text), `Static HTML is missing required content: ${text}`);
}

assert(!/[âÂ�]/u.test(html), "Mojibake was found in exported HTML.");
assert(!/href=["']#["']/i.test(html), "An empty hash link remains in exported HTML.");
assert(!/hello@brishav\.dev|linkedin\.com\/$|github\.com\/$/i.test(html), "A placeholder contact or social URL remains.");
assert(!/script-src[^\n;]*'unsafe-inline'/i.test(headers), "script-src must not contain unsafe-inline.");
assert(headers.includes("/_next/static/*\n  Cache-Control: public, max-age=31536000, immutable"), "Fingerprint cache rule is missing.");
assert(headers.includes("/assets/*\n  Cache-Control: public, max-age=0, must-revalidate"), "Public assets must revalidate.");

const headerLines = headers.split(/\r?\n/);
for (const line of headerLines) {
  assert(line.length <= 2000, `Cloudflare header line exceeds 2,000 characters (${line.length}).`);
}

const declaredHashes = new Set([...headers.matchAll(/'sha256-([^']+)'/g)].map((match) => match[1]));
for (const path of (await walk(outputDir)).filter((item) => item.endsWith(".html"))) {
  const page = await readFile(path, "utf8");
  for (const match of page.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (!match[1]) continue;
    const digest = createHash("sha256").update(match[1], "utf8").digest("base64");
    assert(declaredHashes.has(digest), `CSP is missing an inline script hash for ${path}.`);
  }
}

const scriptPaths = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)]
  .map((match) => match[1].split("?")[0])
  .filter((src) => src.startsWith("/_next/static/") && src.endsWith(".js"));
const uniqueInitialScripts = [...new Set(scriptPaths)];
const buildManifest = JSON.parse(await readFile(join(process.cwd(), ".next", "build-manifest.json"), "utf8"));
const frameworkFiles = new Set(
  [...(buildManifest.rootMainFiles || []), ...(buildManifest.polyfillFiles || [])].map((path) => `/_next/${path}`)
);
const initialApplicationScripts = uniqueInitialScripts.filter((src) => !frameworkFiles.has(src));
const initialGzip = initialApplicationScripts.reduce((total, src) => {
  const content = readFileSyncSafe(join(outputDir, src.replace(/^\//, "")));
  console.log(` - initial ${src}: ${kb(gzipSync(content).length)}KB gzipped`);
  return total + gzipSync(content).length;
}, 0);
const initialBudget = 180 * 1024;
console.log(`Initial application JS: ${kb(initialGzip)}KB / 180KB gzipped across ${initialApplicationScripts.length} scripts.`);
assert(initialGzip <= initialBudget, `Initial application JS budget exceeded: ${kb(initialGzip)}KB > 180KB gzipped.`);

const allJs = (await walk(join(outputDir, "_next", "static"))).filter((path) => path.endsWith(".js"));
const optionalBudget = 400 * 1024;
for (const path of allJs) {
  const size = gzipSync(readFileSyncSafe(path)).length;
  assert(size <= optionalBudget, `Optional JS chunk budget exceeded: ${path} is ${kb(size)}KB gzipped.`);
}

const sourceFiles = (await Promise.all(["app", "components", "lib", "functions", "workers"].map(walkFromRoot))).flat();
for (const path of sourceFiles.filter((item) => /\.(?:ts|tsx|js|css|json|md)$/i.test(item))) {
  const source = await readFile(path, "utf8");
  assert(!/[âÂ�]/u.test(source), `Mojibake was found in source: ${path}`);
}

console.log(`Framework/runtime scripts tracked separately: ${frameworkFiles.size}.`);
console.log(`Validated ${allJs.length} JavaScript chunks, CSP hashes, cache policy, content, links, and UTF-8 source.`);

function readFileSyncSafe(path) {
  return readFileSync(path);
}

async function walkFromRoot(directory) {
  return walk(join(process.cwd(), directory));
}

async function walk(directory) {
  const directoryStat = await stat(directory).catch(() => null);
  if (!directoryStat) return [];
  if (!directoryStat.isDirectory()) return [directory];
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(entries.map((entry) => walk(join(directory, entry.name))));
  return paths.flat();
}

function kb(bytes) {
  return (bytes / 1024).toFixed(1);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
