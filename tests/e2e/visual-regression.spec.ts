import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });
test.setTimeout(90_000);

const viewports = [
  { name: "desktop", width: 1440, height: 1024 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 }
];

const checkpoints = ["home", "work", "process", "about", "contact"] as const;

for (const viewport of viewports) {
  test(`V5 reduced-motion visual baseline — ${viewport.name}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Capture each viewport once in Chromium.");
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => localStorage.removeItem("brishav-theme-v1"));
    await page.route("https://challenges.cloudflare.com/**", (route) => route.abort());
    await page.goto("/");
    await page.evaluate(async () => {
      await document.fonts.ready;
      document.documentElement.style.scrollBehavior = "auto";
    });

    for (const checkpoint of checkpoints) {
      const section = page.locator(`#${checkpoint}`);
      await section.evaluate((element) => element.scrollIntoView({ block: "start" }));
      await expect(section).toBeVisible();
      if (checkpoint === "work") await expect(page.getByRole("button", { name: "Read the proof" })).toBeVisible();
      if (checkpoint === "contact") await expect(page.locator(".contact-form-shell")).toBeVisible();
      await expect(page).toHaveScreenshot(`v5-${viewport.name}-${checkpoint}.png`, {
        animations: "disabled",
        maxDiffPixelRatio: 0.015
      });
    }
  });
}
