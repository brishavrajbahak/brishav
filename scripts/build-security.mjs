import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import Critters from "critters";

const root = process.cwd();
const outputDir = join(root, "out");
const htmlFiles = (await walk(outputDir)).filter((path) => path.endsWith(".html"));
const hashes = new Set();
const critters = new Critters({
  path: outputDir,
  publicPath: "/",
  inlineThreshold: 0,
  pruneSource: false,
  fonts: false,
  logLevel: "silent",
  includeSelectors: [
    /^:root$/,
    /^\*$/,
    /^html/,
    /^body/,
    /^button/,
    /^a/,
    /^\.site-/,
    /^\.brand-/,
    /^\.desktop-navigation/,
    /^\.header-status/,
    /^\.mobile-menu-trigger/,
    /^\.skip-link/,
    /^\.paper-grain/,
    /^\.pointer-spotlight/,
    /^\.v3-site/,
    /^\.v3-header/,
    /^\.v3-brand/,
    /^\.v3-desktop-nav/,
    /^\.v3-header-status/,
    /^\.v3-mobile-menu/,
    /^\.v3-pointer-light/,
    /^\.v3-pipeline-sequence/,
    /^\.v3-project-sequence/,
    /^\.v3-control-anchor/,
    /^\.v4-journey-sequence/,
    /^\.v4-insights-sequence/,
    /^\.v3-contact/
  ]
});

for (const htmlPath of htmlFiles) {
  const sourceHtml = await readFile(htmlPath, "utf8");
  const header = sourceHtml.match(/<header class="[^"]*(?:site-header|v3-header)[^"]*"[\s\S]*?<\/header>/i)?.[0];
  const preparedHtml = header && sourceHtml.includes("data-critters-container")
    ? sourceHtml.replace(
        /(<section id="home"[^>]*data-critters-container[^>]*>)/i,
        `$1<!--critters-manifest:start--><div class="site-shell v3-site"><a class="skip-link"></a><div class="pointer-spotlight v3-pointer-light"></div><div class="paper-grain"></div>${header}</div><!--critters-manifest:end-->`
      )
    : sourceHtml;
  const desktopFontPreloads = await createDesktopFontPreloads(sourceHtml);
  const processedHtml = await critters.process(preparedHtml);
  const html = processedHtml
    .replace(/<!--critters-manifest:start-->[\s\S]*?<!--critters-manifest:end-->/i, "")
    .replace("</head>", `${desktopFontPreloads}</head>`);
  await writeFile(htmlPath, html, "utf8");
  for (const match of html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    const source = match[1];
    if (!source) continue;
    const digest = createHash("sha256").update(source, "utf8").digest("base64");
    hashes.add(`'sha256-${digest}'`);
  }
}

const scriptSources = [
  "'self'",
  ...[...hashes].sort(),
  "https://challenges.cloudflare.com",
  "https://static.cloudflareinsights.com"
];

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src ${scriptSources.join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
  "frame-src https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "media-src 'self'",
  "upgrade-insecure-requests"
].join("; ");

const noindex = process.env.NEXT_PUBLIC_PREVIEW_DEPLOYMENT === "1" ? "\n  X-Robots-Tag: noindex, nofollow" : "";
const headers = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()
  X-Frame-Options: DENY
  Cross-Origin-Opener-Policy: same-origin
  Content-Security-Policy: ${csp}
  Cache-Control: no-cache${noindex}

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/assets/*
  Cache-Control: public, max-age=0, must-revalidate

/Brishav.jpg
  Cache-Control: public, max-age=0, must-revalidate

/favicon.ico
  Cache-Control: public, max-age=0, must-revalidate

/api/*
  Cache-Control: no-store
`;

const routes = {
  version: 1,
  include: ["/api/*"],
  exclude: ["/_next/static/*", "/assets/*", "/Brishav.jpg", "/favicon.ico"]
};

await writeFile(join(outputDir, "_headers"), headers, "utf8");
await writeFile(join(outputDir, "_routes.json"), `${JSON.stringify(routes, null, 2)}\n`, "utf8");

console.log(`Generated CSP with ${hashes.size} inline script hashes across ${htmlFiles.length} HTML files.`);
console.log("Inlined critical light-theme CSS and deferred the remaining stylesheet.");
console.log(`Wrote ${relative(root, join(outputDir, "_headers"))} and ${relative(root, join(outputDir, "_routes.json"))}.`);

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
    if (!/font-family:(?:Manrope|Cormorant Garamond)(?:;|$)/.test(rule)) continue;
    if (!/unicode-range:[^;}]*u\+00\?\?/i.test(rule)) continue;
    const url = rule.match(/src:url\(([^)]+\.woff2)\)/i)?.[1];
    if (url) latinFontUrls.add(url);
  }
  return [...latinFontUrls]
    .map((url) => `<link rel="preload" as="font" type="font/woff2" crossorigin="anonymous" media="(min-width: 761px)" href="${url}">`)
    .join("");
}
