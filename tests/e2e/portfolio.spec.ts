import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { visualAnalysisResponse, visualCatalogResponse } from "./visual-fixtures";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("br-observatory-intro-v3", "complete"));
});

test("renders truthful V3 content without overflow or broken resume actions", async ({ page }) => {
  await page.goto("/?experience=static");
  await expect(page.getByRole("heading", { name: "Turning Data Into Cinematic Stories." })).toBeVisible();
  await page.getByRole("heading", { name: "Choose a briefing directly." }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { name: "Loan Default Prediction" })).toHaveCount(1);
  await expect(page.getByText("In development", { exact: true }).last()).toBeVisible();
  await expect(page.getByRole("link", { name: /resume/i })).toHaveCount(0);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("loads the integrated dataset endpoint and synchronizes terminal analysis", async ({ page }) => {
  const responsePromise = page.waitForResponse((response) => response.url().includes("/api/v1/playground/datasets"));
  await page.goto("/?experience=static");
  await page.locator("#laboratory").scrollIntoViewIfNeeded();
  expect((await responsePromise).ok()).toBe(true);
  await expect(page.getByRole("button", { name: /Tourism Recovery Outlook/ })).toBeVisible();

  await page.getByRole("textbox", { name: "Command" }).fill("analyze loan-risk distribution");
  await page.getByRole("textbox", { name: "Command" }).press("Enter");
  await expect(page.getByText("Routing loan-risk to the distribution analytical view…")).toBeVisible();
  await expect(page.getByRole("button", { name: /Loan Risk Signal Demo/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("tab", { name: "Distribution" })).toHaveAttribute("data-state", "active");

  await page.getByRole("tab", { name: "Comparison" }).click();
  await expect(page.getByRole("tab", { name: "Comparison" })).toHaveAttribute("data-state", "active");
});

test("supports direct hash navigation and reverse-scrolling hero choreography", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Pinned macro choreography is a desktop and tablet experience.");
  await page.goto("/?experience=full#laboratory");
  await expect(page.locator("#laboratory")).toBeInViewport();

  await page.goto("/?experience=full");
  await expect(page.locator(".v3-site")).toHaveClass(/experience-full/);
  await page.waitForTimeout(1400);
  const hero = page.locator("#home");
  const height = await hero.evaluate((element) => element.getBoundingClientRect().height);
  await page.evaluate((offset) => window.scrollTo(0, offset), height * 0.72);
  await expect(page.locator(".v3-hero-mask")).toHaveCSS("opacity", "1");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator(".v3-hero-editorial")).toHaveCSS("opacity", "1");
});

test("mounts the dataset globe only on request and retains a semantic fallback", async ({ page }) => {
  await page.route("**/api/v1/playground/datasets", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(visualCatalogResponse) })
  );
  await page.route("**/api/v1/playground/analyze", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(visualAnalysisResponse) })
  );
  await page.route("**/api/v1/analytics/event", (route) =>
    route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ ok: true }) })
  );
  await page.goto("/?experience=full");
  await page.locator("#laboratory").scrollIntoViewIfNeeded();
  const control = page.locator(".v3-control-sequence");
  await expect(control).toBeVisible();
  const controlPosition = await control.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { top: bounds.top + window.scrollY, height: bounds.height };
  });
  await page.evaluate(({ top, height }) => window.scrollTo(0, top + height * 0.72), controlPosition);
  await expect(page.locator(".v3-analysis-panel")).toHaveCSS("opacity", "1");
  await expect(page.locator(".v3-globe-canvas canvas")).toHaveCount(0);
  await page.getByRole("tab", { name: "Globe" }).click();
  const canvas = page.locator(".v3-globe-canvas canvas");
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box?.width).toBeGreaterThan(100);
  expect(box?.height).toBeGreaterThan(100);
  await expect(page.getByText("Selected signal", { exact: true })).toBeVisible();
});

test("supports a protected contact success state with the published payload contract", async ({ page }) => {
  await page.route("https://challenges.cloudflare.com/**", (route) => route.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
  await page.addInitScript(() => {
    window.turnstile = {
      render: (_container: HTMLElement, options: Record<string, unknown>) => {
        setTimeout(() => (options.callback as (token: string) => void)("test-turnstile-token"), 0);
        return "test-widget";
      },
      reset: () => undefined,
      remove: () => undefined
    };
  });
  await page.route("**/api/v1/contact", async (route) => {
    const body = route.request().postDataJSON();
    expect(body.version).toBe(1);
    expect(body.turnstileToken).toBe("test-turnstile-token");
    expect(body.payload.website).toBe("");
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, message: "Signal received. I'll be in touch soon.", autoReplySent: true }) });
  });
  await page.goto("/?experience=static");
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await page.getByLabel("Name").fill("Test Observer");
  await page.getByLabel("Email").fill("observer@example.com");
  await page.getByLabel("Message").fill("This is a complete integration test message.");
  await page.getByRole("button", { name: "Join the Dataverse" }).click();
  await expect(page.getByText("Signal received. I'll be in touch soon.")).toBeVisible();
});

test("has no serious automated accessibility violations", async ({ page }) => {
  await page.route("**/api/v1/playground/datasets", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(visualCatalogResponse) })
  );
  await page.route("**/api/v1/playground/analyze", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(visualAnalysisResponse) })
  );
  await page.route("**/api/v1/analytics/event", (route) =>
    route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ ok: true }) })
  );
  await page.goto("/?experience=static");
  await page.locator("#laboratory").scrollIntoViewIfNeeded();
  await expect(page.locator(".v3-analysis-panel")).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact || ""));
  expect(serious).toEqual([]);
});

test.describe("reduced motion", () => {
  test("uses cinematic posters and does not mount WebGL", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".v3-site")).toHaveClass(/experience-static/);
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.locator("#home picture img").first()).toBeVisible();
  });
});
