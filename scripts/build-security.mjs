import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const outputDir = join(root, "out");
const htmlFiles = (await walk(outputDir)).filter((path) => path.endsWith(".html"));
const hashes = new Set();
const heroStabilityCss = `<style data-v5-stability>.v5-hero h1{max-width:56rem;margin:1rem 0 1.6rem;font-family:Georgia,serif;font-size:clamp(3.7rem,7.2vw,7.4rem);font-weight:500;line-height:.9;letter-spacing:-.052em;text-wrap:balance}@media(min-width:721px){.v5-hero h1{font-family:var(--font-cormorant),Georgia,serif}}@media(max-width:720px){.v5-brand>span:first-child,.v5-brand strong{font-family:Georgia,serif}.v5-hero h1{font-size:clamp(3.4rem,15vw,5.3rem)}}</style>`;

for (const htmlPath of htmlFiles) {
  const sourceHtml = await readFile(htmlPath, "utf8");
  const desktopFontPreloads = await createDesktopFontPreloads(sourceHtml);
  const html = sourceHtml
    .replace(/<script([^>]+\bsrc="[^"]+"[^>]*)\sasync><\/script>/gi, "<script$1 defer></script>")
    .replace("</head>", `${heroStabilityCss}${desktopFontPreloads}</head>`);
  const pageHashes = new Set();
  for (const match of html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    const source = match[1];
    if (!source) continue;
    const digest = createHash("sha256").update(source, "utf8").digest("base64");
    const value = `'sha256-${digest}'`;
    hashes.add(value);
    pageHashes.add(value);
  }
  const csp = buildCsp([...pageHashes].sort());
  const securedHtml = html.replace("</head>", `<meta http-equiv="Content-Security-Policy" content="${csp}"></head>`);
  await writeFile(htmlPath, securedHtml, "utf8");
}

const noindex = process.env.NEXT_PUBLIC_PREVIEW_DEPLOYMENT !== "0" ? "\n  X-Robots-Tag: noindex, nofollow" : "";
const headers = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()
  X-Frame-Options: SAMEORIGIN
  Cross-Origin-Opener-Policy: same-origin
  Cache-Control: no-cache${noindex}

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/assets/*
  Cache-Control: public, max-age=0, must-revalidate

/Brishav.jpg
  Cache-Control: public, max-age=0, must-revalidate

/favicon.ico
  Cache-Control: public, max-age=0, must-revalidate

/og-v5.png
  Cache-Control: public, max-age=0, must-revalidate

/icon-*.png
  Cache-Control: public, max-age=0, must-revalidate

/apple-touch-icon.png
  Cache-Control: public, max-age=0, must-revalidate

/api/*
  Cache-Control: no-store
`;

const routes = {
  version: 1,
  include: ["/api/*"],
  exclude: ["/_next/static/*", "/assets/*", "/Brishav.jpg", "/favicon.ico", "/og-v5.png", "/icon-*.png", "/apple-touch-icon.png"]
};

await writeFile(join(outputDir, "_headers"), headers, "utf8");
await writeFile(join(outputDir, "_routes.json"), `${JSON.stringify(routes, null, 2)}\n`, "utf8");

console.log(`Generated CSP with ${hashes.size} inline script hashes across ${htmlFiles.length} HTML files.`);
console.log("Kept the full stylesheet render-blocking to prevent late mobile layout shifts.");
console.log(`Wrote ${relative(root, join(outputDir, "_headers"))} and ${relative(root, join(outputDir, "_routes.json"))}.`);

function buildCsp(pageHashes) {
  const scriptSources = [
    "'self'",
    ...pageHashes,
    "https://challenges.cloudflare.com",
    "https://static.cloudflareinsights.com"
  ];
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob:",
    "connect-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
    "frame-src 'self' https://challenges.cloudflare.com",
    "worker-src 'self' blob:",
    "media-src 'self'",
    "upgrade-insecure-requests"
  ].join("; ");
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? walk(path) : [path];
    })
  );
  return paths.flat();
}

async function createDesktopFontPreloads(html) {
  const stylesheetHref = html.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+\.css)"/i)?.[1];
  if (!stylesheetHref?.startsWith("/")) return "";
  const stylesheet = await readFile(join(outputDir, stylesheetHref.slice(1)), "utf8");
  const latinFontUrls = new Set();
  for (const match of stylesheet.matchAll(/@font-face\{([^}]+)\}/g)) {
    const rule = match[1];
    if (!/font-family:Manrope(?:;|$)/.test(rule)) continue;
    if (!/unicode-range:[^;}]*u\+00\?\?/i.test(rule)) continue;
    const url = rule.match(/src:url\(([^)]+\.woff2)\)/i)?.[1];
    if (url) latinFontUrls.add(url);
  }
  return [...latinFontUrls]
    .map((url) => `<link rel="preload" as="font" type="font/woff2" crossorigin="anonymous" media="(min-width: 761px)" href="${url}">`)
    .join("");
}
