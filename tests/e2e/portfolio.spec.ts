import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { visualAnalysisResponse, visualCatalogResponse } from "./visual-fixtures";

test("renders truthful content without overflow or broken resume actions", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Turning Data Into Cinematic Stories." })).toBeVisible();
  await expect(page.getByText("In development—no results claimed.", { exact: false })).toHaveCount(0);
  await page.getByRole("heading", { name: /Published work, clearly separated/ }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { name: "Loan Default Prediction" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: /resume/i })).toHaveCount(0);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("loads the integrated dataset endpoint and switches analysis modes", async ({ page }) => {
  const responsePromise = page.waitForResponse((response) => response.url().includes("/api/v1/playground/datasets"));
  await page.goto("/");
  await page.getByRole("heading", { name: /Explore the same evidence/ }).scrollIntoViewIfNeeded();
  expect((await responsePromise).ok()).toBe(true);
  await expect(page.getByRole("button", { name: /Tourism Recovery Outlook/ })).toBeVisible();
  await page.getByRole("tab", { name: "Distribution" }).click();
  await expect(page.getByText("Distribution", { exact: true }).last()).toBeVisible();
  await page.getByRole("tab", { name: "Trend / comparison" }).click();
  await expect(page.getByRole("tab", { name: "Trend / comparison" })).toHaveAttribute("data-state", "active");
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
  await page.goto("/");
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
  await page.goto("/");
  await page.getByRole("heading", { name: /Published work, clearly separated/ }).scrollIntoViewIfNeeded();
  await expect(page.locator('[data-project-card="loan-default-analysis"]')).toBeVisible();
  await page.getByRole("heading", { name: /Explore the same evidence/ }).scrollIntoViewIfNeeded();
  await expect(page.locator(".metric-grid")).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact || ""));
  expect(serious).toEqual([]);
});

test.describe("reduced motion", () => {
  test("uses posters and does not mount WebGL", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".site-shell")).toHaveClass(/quality-poster/);
    await expect(page.locator(".shared-webgl-canvas")).toHaveCount(0);
    await expect(page.getByRole("img", { name: /Static reduced-motion view/ }).first()).toBeVisible();
  });
});
