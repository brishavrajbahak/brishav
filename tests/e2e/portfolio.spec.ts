import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("hydrates the V5 client without errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(errors).toEqual([]);
});

test("renders the five proof-first sections without overflow or WebGL", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "I want the work to look good. I need the numbers to hold up." })).toBeVisible();
  for (const id of ["home", "work", "process", "about", "contact"]) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /resume/i })).toHaveCount(0);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("keeps every project claim truthful and shows the denominator", async ({ page }) => {
  await page.goto("/#work");
  const work = page.locator("#work");
  await expect(work.getByRole("heading", { name: "Loan Default Prediction" })).toBeVisible();
  await expect(work).toContainText("No public deliverable yet.");
  await expect(work).not.toContainText(/accuracy|precision|recall/i);

  const process = page.locator("#process");
  await process.scrollIntoViewIfNeeded();
  await expect(process).toContainText("912,569 loans were still current, late or in a grace period");
  await expect(process).toContainText("19.98%");
  await expect(process).toContainText("269,360 ÷ 1,348,099");
});

test("changes Process phases with arrows without moving the page", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const process = page.locator("#process");
  const processObject = process.locator(".v5-process-object");
  await processObject.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const before = await page.evaluate(() => window.scrollY);
  await process.getByRole("button", { name: "Next process phase" }).click();
  await expect(process.locator(".v5-process-readout h3")).toHaveText("Clean columns");
  await page.waitForTimeout(350);
  const after = await page.evaluate(() => window.scrollY);

  expect(Math.abs(after - before)).toBeLessThanOrEqual(1);
});

test("supports the complete mandala keyboard and focus-return workflow", async ({ page }) => {
  await page.goto("/#work");
  const first = page.getByRole("button", { name: "01 Loan Default Analysis" });
  await first.waitFor();
  await first.focus();
  await first.press("ArrowRight");
  const second = page.getByRole("button", { name: "02 Financial Inclusion Gap Analysis" });
  await expect(second).toBeFocused();
  await second.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Financial Inclusion Gap Analysis" })).toBeVisible();
  await expect(dialog).toContainText("Not established yet.");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(second).toBeFocused();
});

test("loads the dashboard iframe only after an explicit request", async ({ page }) => {
  await page.goto("/#work");
  await page.getByRole("button", { name: "Load interactive dashboard" }).scrollIntoViewIfNeeded();
  await expect(page.locator("iframe[title='Interactive Loan Default Analysis dashboard']")).toHaveCount(0);
  await page.getByRole("button", { name: "Load interactive dashboard" }).click();
  const frame = page.locator("iframe[title='Interactive Loan Default Analysis dashboard']");
  await expect(frame).toHaveAttribute("src", "/dashboard/loan-default/");
  await expect(frame).toBeVisible();
});

test("persists an explicit theme selection", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
});

test("shows specific validation copy without discarding the form", async ({ page }) => {
  await page.goto("/#contact");
  const form = page.locator(".contact-form-shell");
  await expect(form).toBeVisible();
  await form.getByRole("button", { name: "Send message" }).click();
  await expect(form).toContainText("What should I call you?");
  await expect(form).toContainText("That email address does not look complete.");
  await expect(form).toContainText("Give me a little more detail so I can reply properly.");
});

test("serves the themed 404 with recovery actions", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "I checked the path. There is nothing here." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go home" })).toBeVisible();
  await expect(page.getByRole("link", { name: "See the work" })).toBeVisible();
});

test("has no serious automated accessibility violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact || ""));
  expect(serious).toEqual([]);
});

test.describe("reduced motion", () => {
  test("removes sticky choreography and path drawing", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#work");
    const treatment = await page.locator(".v5-work-sticky").evaluate((element) => ({
      minHeight: getComputedStyle(element).minHeight,
      position: getComputedStyle(element).position
    }));
    expect(treatment.position).not.toBe("sticky");
    await expect(page.locator("canvas")).toHaveCount(0);
  });
});
