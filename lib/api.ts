export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "BOT_FAILED"
  | "ORIGIN_NOT_ALLOWED"
  | "METHOD_NOT_ALLOWED"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export class PortfolioApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status = 0,
    public readonly errors: string[] = [],
    public readonly retryAfter?: number
  ) {
    super(message);
    this.name = "PortfolioApiError";
  }
}

export type DatasetSummary = {
  id: string;
  label: string;
  theme: string;
  description: string;
};

export type AnalysisMode = "overview" | "distribution" | "trend";
export type ChartItem = { label: string; value: number };
export type ChartSpec = {
  kind: "bar" | "line";
  eyebrow: string;
  title: string;
  items: ChartItem[];
};
export type ChartPresentation = ChartSpec;
export type AnalysisMetric = { label: string; value: string; note: string };
export type AnalysisResult = {
  dataset: Pick<DatasetSummary, "id" | "label" | "theme">;
  summary: string;
  surpriseInsight: string;
  metrics: AnalysisMetric[];
  charts: { comparison: ChartSpec; trend: ChartSpec };
  mandalaFocus: string[];
  records: Array<Record<string, unknown>>;
};

export type ContactPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string;
};

type ErrorBody = { ok?: false; code?: ApiErrorCode; errors?: string[] };
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

export async function getDatasets(signal?: AbortSignal): Promise<DatasetSummary[]> {
  const body = await requestJson<{ ok: true; datasets: DatasetSummary[] }>("/api/v1/playground/datasets", {
    signal
  });
  return body.datasets;
}

export async function analyzeDataset(datasetId: string, analysisType: AnalysisMode, signal?: AbortSignal) {
  const body = await requestJson<{ ok: true; result: AnalysisResult }>("/api/v1/playground/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ version: 1, datasetId, analysisType }),
    signal
  });
  return body.result;
}

export async function submitContact(payload: ContactPayload, turnstileToken: string) {
  return requestJson<{ ok: true; message: string; autoReplySent: boolean }>("/api/v1/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ version: 1, turnstileToken, payload })
  });
}

export type AllowedAnalyticsEvent = "terminal_command" | "mandala_view" | "playground_open" | "analyze_run";

export async function sendAnalyticsEvent(name: AllowedAnalyticsEvent, detail: Record<string, string> = {}) {
  try {
    await requestJson<{ ok: true }>("/api/v1/analytics/event", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, detail, path: window.location.pathname, timestamp: new Date().toISOString() })
    });
  } catch {
    // Analytics must never interrupt the portfolio experience.
  }
}

export async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: "same-origin",
      ...init,
      headers: { Accept: "application/json", ...init.headers }
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new PortfolioApiError("NETWORK_ERROR", "The observatory could not reach the service. Please retry.");
  }

  const body = (await response.json().catch(() => ({}))) as T & ErrorBody;
  if (!response.ok || body.ok === false) {
    const code = normalizeCode(body.code);
    const errors = Array.isArray(body.errors) ? body.errors : [];
    const retryAfter = Number(response.headers.get("Retry-After") || 0) || undefined;
    throw new PortfolioApiError(code, errorMessage(code, errors), response.status, errors, retryAfter);
  }

  return body;
}

function normalizeCode(code?: string): ApiErrorCode {
  const allowed: ApiErrorCode[] = [
    "VALIDATION_ERROR",
    "RATE_LIMITED",
    "SERVER_ERROR",
    "BOT_FAILED",
    "ORIGIN_NOT_ALLOWED",
    "METHOD_NOT_ALLOWED",
    "NETWORK_ERROR",
    "UNKNOWN_ERROR"
  ];
  return allowed.includes(code as ApiErrorCode) ? (code as ApiErrorCode) : "UNKNOWN_ERROR";
}

function errorMessage(code: ApiErrorCode, errors: string[]) {
  if (errors.length) return errors.join(" ");
  if (code === "RATE_LIMITED") return "Too many requests. Please wait a moment and retry.";
  if (code === "BOT_FAILED") return "Human verification expired or failed. Please verify again.";
  if (code === "VALIDATION_ERROR") return "Please review the highlighted information and retry.";
  if (code === "NETWORK_ERROR") return "The service could not be reached. Please check your connection.";
  return "The service could not complete the request. Please retry shortly.";
}
