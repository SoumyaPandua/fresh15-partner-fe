import { API_BASE_URL } from "./auth";

const NO_STORE = [
  "/api/cart",
  "/api/checkout",
  "/api/orders",
  "/api/payments",
  "/api/refunds",
  "/api/deliveries",
  "/api/notifications",
  "/api/partner/queue",
  "/api/partner/cash",
];

const shouldNoStore = (path: string, method: string) =>
  method !== "GET" || NO_STORE.some((prefix) => path.startsWith(prefix));

export async function request<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  if (!token) throw new Error("Your session has expired. Please sign in again.");

  const method = String(init.method || "GET").toUpperCase();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: shouldNoStore(path, method) ? "no-store" : undefined,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  let json: any = null;
  try { json = await response.json(); } catch { /* non-JSON */ }

  if (!response.ok || json?.success === false) {
    if (response.status === 401 && typeof window !== "undefined") window.dispatchEvent(new Event("f15-auth-expired"));
    throw new Error(json?.message || `Request failed (${response.status})`);
  }

  return json?.data as T;
}
