import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { visualAnalysisResponse, visualCatalogResponse } from "./visual-fixtures";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("br-observatory-intro-v3", "complete"));
});

test("boots the client runtime without uncaught errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}\n${error.stack || ""}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });

  await page.goto("/?experience=full");
  await page.waitForTimeout(1_500);

  expect(errors).toEqual([]);
  await expect(page.locator(".v3-site")).toHaveClass(/experience-full/);
});

test("renders truthful V4 content without overflow or broken resume actions", async ({ page }) => {
  await page.goto("/?experience=static");
  await expect(page.getByRole("heading", { name: "Turning Data Into Cinematic Stories." })).toBeVisible();
  const projectText = await page.locator("#projects").textContent();
  expect(projectText).toContain("Loan Default Prediction");
  expect(projectText).toContain("In development");
  expect(projectText).not.toMatch(/accuracy|precision|recall/i);
  await expect(page.getByRole("link", { name: /resume/i })).toHaveCount(0);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("loads the integrated dataset endpoint and synchronizes terminal analysis", async ({ page }) => {
  const responsePromise = page.waitForResponse((response) => response.url().includes("/api/v1/playground/datasets"));
  await page.goto("/?experience=static");
  await page.locator("#laboratory").scrollIntoViewIfNeeded();
  expect((await responsePromise).ok()).toBe(true);

  await page.getByRole("textbox", { name: "Command" }).fill("analyze loan-risk distribution");
  await page.getByRole("textbox", { name: "Command" }).press("Enter");
  await expect(page.locator(".v4-control-system-status")).toHaveText("Routing loan-risk to the distribution analytical view…");
  await expect(page.getByRole("tab", { name: "Analytics", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("button", { name: /Loan Risk Signal Demo/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("tab", { name: "Distribution" })).toHaveAttribute("data-state", "active");

  await page.getByRole("tab", { name: "Comparison" }).click();
  await expect(page.getByRole("tab", { name: "Comparison" })).toHaveAttribute("data-state", "active");
});

test("supports direct hash navigation and reverse-scrolling hero choreography", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Pinned macro choreography is a desktop and tablet experience.");
  await page.goto("/?experience=full#laboratory");
  await expect(page.locator("#laboratory")).toBeInViewport();
  await expect(page.locator("#laboratory .v3-control-header h2")).toBeVisible();
  const headerBox = await page.locator(".v3-header").boundingBox();
  const chapterTitleBox = await page.locator("#laboratory .v3-control-header h2").boundingBox();
  expect((chapterTitleBox?.y || 0) + 1).toBeGreaterThanOrEqual((headerBox?.y || 0) + (headerBox?.height || 0));

  await page.goto("/?experience=full");
  await expect(page.locator(".v3-site")).toHaveClass(/experience-full/);
  await expect(page.locator(".v3-site")).toHaveAttribute("data-director-ready", "true");
  const hero = page.locator("#home");
  const position = await hero.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { top: bounds.top + window.scrollY, distance: bounds.height - window.innerHeight };
  });
  await page.evaluate(async ({ top, distance }) => {
    window.scrollTo(0, top + distance * 0.72);
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())));
  }, position);
  await expect.poll(() => page.locator(".v3-hero-mask").evaluate((element) => Number.parseFloat(getComputedStyle(element).opacity)))
    .toBeGreaterThan(0.99);
  await page.evaluate(async () => {
    window.scrollTo(0, 0);
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())));
  });
  await expect.poll(() => page.locator(".v3-hero-editorial").evaluate((element) => Number.parseFloat(getComputedStyle(element).opacity)))
    .toBeGreaterThan(0.99);
});

test("advances all project missions smoothly in both scroll directions", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "The mobile edition uses the direct accordion index.");
  await page.goto("/?experience=full");
  await expect(page.locator(".v3-site")).toHaveAttribute("data-director-ready", "true");
  const sequence = page.locator(".v3-project-sequence");
  const position = await sequence.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { top: bounds.top + window.scrollY, distance: bounds.height - window.innerHeight };
  });

  const checkpoints = [
    { progress: 0.04, title: "Loan Default Analysis" },
    { progress: 0.3, title: "Financial Inclusion Gap Analysis" },
    { progress: 0.55, title: "Loan Default Prediction" },
    { progress: 0.82, title: "Himalayan Data Observatory" }
  ];

  for (const checkpoint of checkpoints) {
    await page.evaluate(async ({ top, distance, progress }) => {
      window.scrollTo(0, top + distance * progress);
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())));
    }, { ...position, progress: checkpoint.progress });
    await expect(page.locator(".v4-project-chapter:not([aria-hidden='true']) h2")).toHaveText(checkpoint.title);
  }

  await page.evaluate(async ({ top, distance }) => {
    window.scrollTo(0, top + distance * 0.28);
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())));
  }, position);
  await expect(page.locator(".v4-project-chapter:not([aria-hidden='true']) h2")).toHaveText("Financial Inclusion Gap Analysis");
  await expect(page.locator(".v3-desktop-nav button[aria-current='location']")).toContainText("Projects");
});

test("preserves control-room geometry when the lazy runtime mounts", async ({ page }) => {
  await page.goto("/?experience=full");
  const anchor = page.locator("#laboratory");
  const before = await anchor.evaluate((element) => element.getBoundingClientRect().height);
  await anchor.scrollIntoViewIfNeeded();
  await expect(page.locator('[data-control-ready="true"]')).toBeVisible();
  const after = await anchor.evaluate((element) => element.getBoundingClientRect().height);
  expect(Math.abs(after - before)).toBeLessThanOrEqual(1);
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
  await page.getByRole("tab", { name: "Analytics", exact: true }).click();
  await expect(page.locator(".v3-analysis-panel")).not.toHaveAttribute("inert", "");
  await expect(page.locator(".v3-globe-canvas canvas")).toHaveCount(0);
  await page.getByRole("tab", { name: "Globe" }).click();
  const canvas = page.locator(".v3-globe-canvas canvas");
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box?.width).toBeGreaterThan(100);
  expect(box?.height).toBeGreaterThan(100);
  await expect(page.getByText("Selected signal", { exact: true })).toBeVisible();
});

test("uses semantic posters when WebGL is unavailable", async ({ page }) => {
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

  await page.goto("/?experience=full");
  await page.locator("#laboratory").scrollIntoViewIfNeeded();
  await page.getByRole("tab", { name: "Analytics", exact: true }).click();
  await page.getByRole("tab", { name: "Globe" }).click();

  await expect(page.getByRole("img", { name: "Static dataset map fallback" })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
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
  await page.getByRole("tab", { name: "Analytics", exact: true }).click();
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
