const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://fresh15-main.onrender.com";

export class ApiError extends Error {
  constructor(message: string, public readonly status = 0, public readonly details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiEnvelope<T> { success: boolean; message?: string; data: T; }

const NO_STORE = [
  "/api/cart", "/api/checkout", "/api/orders", "/api/payments", "/api/refunds",
  "/api/deliveries", "/api/notifications", "/api/partner/queue", "/api/partner/cash",
];

const shouldNoStore = (path: string, method: string) => method !== "GET" || NO_STORE.some((prefix) => path.startsWith(prefix));

export async function apiRequest<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<ApiEnvelope<T>> {
  if (!token) throw new ApiError("Your session has expired. Please sign in again.", 401);
  const method = String(init.method || "GET").toUpperCase();
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, cache: shouldNoStore(path, method) ? "no-store" : undefined, headers });
  } catch (error) {
    throw new ApiError("Unable to reach the server. Please check your connection and try again.", 0, error);
  }

  let json: Partial<ApiEnvelope<T>> | null = null;
  try { json = (await response.json()) as Partial<ApiEnvelope<T>>; } catch { json = null; }

  if (!response.ok || json?.success === false) {
    if (response.status === 401 && typeof window !== "undefined") window.dispatchEvent(new Event("f15-auth-expired"));
    throw new ApiError(json?.message || `Request failed (${response.status})`, response.status, json);
  }
  return (json ?? { success: true, data: undefined }) as ApiEnvelope<T>;
}

export async function request<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  return (await apiRequest<T>(path, init, token)).data;
}

export { API_BASE };
