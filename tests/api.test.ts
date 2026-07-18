import { afterEach, describe, expect, it, vi } from "vitest";
import { getDatasets, requestJson } from "@/lib/api";

afterEach(() => vi.unstubAllGlobals());

describe("frontend API normalization", () => {
  it("returns a typed dataset catalog", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, datasets: [{ id: "tourism", label: "Tourism", theme: "Tourism", description: "Demo" }] }), { status: 200 })));
    await expect(getDatasets()).resolves.toEqual([{ id: "tourism", label: "Tourism", theme: "Tourism", description: "Demo" }]);
  });

  it("normalizes validation errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: false, code: "VALIDATION_ERROR", errors: ["datasetId is required."] }), { status: 400 })));
    await expect(requestJson("/api/v1/playground/analyze")).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      status: 400,
      message: "datasetId is required."
    });
  });

  it("normalizes rate limits and retry timing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: false, code: "RATE_LIMITED" }), { status: 429, headers: { "Retry-After": "45" } })));
    await expect(requestJson("/api/v1/contact")).rejects.toMatchObject({ code: "RATE_LIMITED", retryAfter: 45 });
  });

  it("converts network failures into a stable code", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(requestJson("/api/v1/playground/datasets")).rejects.toMatchObject({ code: "NETWORK_ERROR" });
  });
});
