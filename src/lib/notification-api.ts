import { API_BASE, apiRequest, ApiError } from "./api-client";

/**
 * Fresh15 notification contract (verified against the live backend with a
 * PARTNER JWT):
 *
 *   GET    /api/notification              -> notification list
 *   GET    /api/notification/unread-count -> { count }
 *   PATCH  /api/notification/:id/read     -> mark one read
 *   PATCH  /api/notification/read-all     -> mark all read
 *   DELETE /api/notification/:id          -> delete one
 */

export interface NotificationMetadata {
  deliveryId?: string | null;
  orderId?: string | null;
  orderNumber?: string | null;
  [key: string]: unknown;
}

export interface AppNotification {
  _id: string;
  title: string;
  message: string;
  type?: string;
  channel?: string;
  isRead: boolean;
  readAt?: string | null;
  metadata?: NotificationMetadata | null;
  createdAt?: string;
}


/** The list endpoint may return a bare array or a paginated envelope. */
function readList(data: unknown): AppNotification[] {
  if (Array.isArray(data)) return data as AppNotification[];
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    for (const key of ["notifications", "items", "docs", "results"]) {
      if (Array.isArray(d[key])) return d[key] as AppNotification[];
    }
  }
  return [];
}

export async function fetchNotifications(token: string): Promise<AppNotification[]> {
  const json = await apiRequest<unknown>("/api/notification", {}, token);
  return readList(json.data);
}

export async function fetchUnreadCount(token: string): Promise<number> {
  const json = await apiRequest<{ count?: number } | number>("/api/notification/unread-count", {}, token);
  const d = json.data;
  if (typeof d === "number") return d;
  return typeof d?.count === "number" ? d.count : 0;
}

export async function markNotificationRead(token: string, id: string) {
  const json = await apiRequest<unknown>(`/api/notification/${id}/read`, { method: "PATCH" }, token);
  return json.message ?? "Notification marked as read";
}

export async function markAllNotificationsRead(token: string) {
  const json = await apiRequest<unknown>("/api/notification/read-all", { method: "PATCH" }, token);
  return json.message ?? "All notifications marked as read";
}

export async function deleteNotification(token: string, id: string) {
  const json = await apiRequest<unknown>(`/api/notification/${id}`, { method: "DELETE" }, token);
  return json.message ?? "Notification deleted";
}

/** Icon bucket for the existing notification row design. */
export function notificationKind(n: AppNotification): "order" | "earnings" | "system" {
  const t = (n.type ?? "").toUpperCase();
  if (t.includes("PAYOUT") || t.includes("EARNING") || t.includes("PAYMENT")) return "earnings";
  if (t.includes("RIDER") || t.includes("DELIVERY") || t.includes("ORDER")) return "order";
  return "system";
}

/** Delivery id to open when a notification is tapped, if any. */
export function notificationTargetId(n: AppNotification): string | null {
  const m = n.metadata ?? {};
  return (m.deliveryId as string) || (m.orderId as string) || null;
}
