import { expect, test } from "@playwright/test";
import { visualAnalysisResponse, visualCatalogResponse } from "./visual-fixtures";

test.describe.configure({ mode: "serial" });
test.setTimeout(60_000);

const viewports = [
  { name: "desktop", width: 1440, height: 1024 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 }
];

const checkpoints = [
  { name: "hero", selector: "#home" },
  { name: "method", selector: "#method" },
  { name: "projects", selector: "#projects" },
  { name: "laboratory", selector: "#laboratory" },
  { name: "journey", selector: "#journey" },
  { name: "insights", selector: "#insights" },
  { name: "contact", selector: "#contact" }
];

for (const viewport of viewports) {
  test(`light observatory visual baseline — ${viewport.name}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Visual baselines run once in desktop Chromium.");
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function getContext(this: HTMLCanvasElement, type: string, ...args: unknown[]) {
        if (type === "webgl" || type === "webgl2") return null;
        return Reflect.apply(originalGetContext, this, [type, ...args]);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });
    await page.route("**/api/v1/playground/datasets", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(visualCatalogResponse) })
    );
    await page.route("**/api/v1/playground/analyze", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(visualAnalysisResponse) })
    );
    await page.route("**/api/v1/analytics/event", (route) =>
      route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ ok: true }) })
    );
    await page.goto("/");
    await page.evaluate(async () => {
      await Promise.all([
        document.fonts.load('400 16px "Manrope"'),
        document.fonts.load('500 96px "Cormorant Garamond"')
      ]);
      await document.fonts.ready;
    });
    await expect(page.locator(".site-shell")).toHaveClass(/quality-poster/);
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
    });

    for (const checkpoint of checkpoints) {
      const section = page.locator(checkpoint.selector);
      await section.evaluate((element) => element.scrollIntoView({ block: "start" }));
      if (checkpoint.name === "projects") await page.locator('[data-project-card="loan-default-analysis"]').waitFor({ state: "visible" });
      if (checkpoint.name === "laboratory") await page.locator(".metric-grid").waitFor({ state: "visible" });
      await expect(section).toBeVisible();
      await expect(page).toHaveScreenshot(`observatory-${viewport.name}-${checkpoint.name}.png`, {
        maxDiffPixelRatio: 0.015
      });
    }
  });
}
