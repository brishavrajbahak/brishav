import { chromium } from "@playwright/test";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 412, height: 823 },
  deviceScaleFactor: 2.625,
  isMobile: true,
  hasTouch: true
});

await page.addInitScript(() => {
  window.__observatoryLayoutShifts = [];
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.hadRecentInput) continue;
      window.__observatoryLayoutShifts.push({
        value: entry.value,
        startTime: entry.startTime,
        sources: entry.sources.map((source) => ({
          selector: source.node instanceof Element
            ? `${source.node.tagName.toLowerCase()}.${source.node.className}`
            : "unknown",
          previousRect: source.previousRect.toJSON(),
          currentRect: source.currentRect.toJSON()
        }))
      });
    }
  }).observe({ type: "layout-shift", buffered: true });
});

await page.goto("http://127.0.0.1:8788/", { waitUntil: "networkidle" });
await page.waitForTimeout(3200);
const report = await page.evaluate(() => ({
  shifts: window.__observatoryLayoutShifts,
  hero: document.querySelector(".v3-hero-stage")?.getBoundingClientRect().toJSON(),
  image: document.querySelector(".v3-hero-landscape img")?.getBoundingClientRect().toJSON(),
  classes: document.querySelector(".v3-site")?.className,
  intro: Boolean(document.querySelector(".v3-intro"))
}));

console.log(JSON.stringify(report, null, 2));
await browser.close();
