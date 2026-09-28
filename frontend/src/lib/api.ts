const DEFAULT_API_URL = "http://localhost:8000";
const API_REQUEST_TIMEOUT_MS = 90_000;

function getApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function getErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as { detail?: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item) => (item && typeof item === "object" && "msg" in item ? String(item.msg) : String(item)))
        .join(", ");
    }
  }

  return `Request failed with status ${status}`;
}

export async function fetchApi<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const body = options.body;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const isUrlEncoded = typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams;

  if (body != null && !isFormData && !headers.has("Content-Type")) {
    headers.set(
      "Content-Type",
      isUrlEncoded ? "application/x-www-form-urlencoded;charset=UTF-8" : "application/json",
    );
  }

  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("token");
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const controller = new AbortController();
  const externalSignal = options.signal;
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, API_REQUEST_TIMEOUT_MS);
  const abortWithExternalSignal = () => controller.abort();

  if (externalSignal?.aborted) {
    abortWithExternalSignal();
  } else {
    externalSignal?.addEventListener("abort", abortWithExternalSignal, { once: true });
  }

  try {
    const response = await fetch(getApiUrl(path), {
      ...options,
      headers,
      signal: controller.signal,
    });
    const contentType = response.headers.get("content-type") || "";
    let payload: unknown = null;

    if (response.status !== 204) {
      if (contentType.includes("application/json")) {
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }
      } else {
        payload = await response.text();
      }
    }

    if (!response.ok) {
      if (response.status >= 500) {
        throw new Error(
          `The Study Assistant API is temporarily unavailable (HTTP ${response.status}). Please try again shortly.`,
        );
      }
      throw new Error(getErrorMessage(payload, response.status));
    }

    return payload as T;
  } catch (error) {
    if (timedOut) {
      throw new Error("The Study Assistant API did not respond in time. It may be waking up or temporarily unavailable. Please try again.");
    }
    if (externalSignal?.aborted) throw error;
    if (error instanceof TypeError) {
      throw new Error("Could not reach the Study Assistant API. Check your connection and try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", abortWithExternalSignal);
  }
}
