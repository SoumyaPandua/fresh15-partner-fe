export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://fresh15-main.onrender.com").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message: string, public readonly status = 0, public readonly details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, token?: string): Promise<ApiEnvelope<T>> {
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers, cache: "no-store" });
  } catch (error) {
    throw new ApiError("Network error. Please check your connection and try again.", 0, error);
  }

  let payload: ApiEnvelope<T> | null = null;
  const contentType = response.headers.get("content-type") ?? "";
  try {
    payload = contentType.includes("application/json") ? await response.json() as ApiEnvelope<T> : null;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success) {
    const message = payload?.message || (response.status === 401 ? "Your session has expired. Please sign in again." : response.status === 403 ? "You do not have permission to perform this action." : response.status === 404 ? "The requested resource was not found." : "Something went wrong. Please try again.");
    throw new ApiError(message, response.status, payload);
  }
  return payload;
}

export function apiHeaders(extra?: HeadersInit) {
  const headers = new Headers(extra);
  headers.set("Accept", "application/json");
  return headers;
}
