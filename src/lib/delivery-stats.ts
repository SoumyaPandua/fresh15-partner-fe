import { getEarning, isActive, type Delivery } from "./delivery-api";

export interface DeliveryStats {
  todayEarnings: number;
  todayDeliveries: number;
  totalEarnings: number;
  totalDeliveries: number;
  acceptanceRate: number | null;
  weekly: Array<{ day: string; amount: number }>;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function completedAt(d: Delivery): Date | null {
  const raw = d.deliveredAt ?? d.updatedAt ?? d.createdAt;
  if (!raw) return null;
  const dt = new Date(raw);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** All figures are derived from real delivery records — the backend has no earnings endpoint. */
export function computeStats(deliveries: Delivery[], now = new Date()): DeliveryStats {
  const delivered = deliveries.filter(d => d.status === "DELIVERED");

  let todayEarnings = 0;
  let todayDeliveries = 0;
  for (const d of delivered) {
    const at = completedAt(d);
    if (at && sameDay(at, now)) {
      todayEarnings += getEarning(d);
      todayDeliveries += 1;
    }
  }

  const decided = deliveries.filter(d => d.status !== "PENDING" && d.status !== "ASSIGNED");
  const rejected = deliveries.filter(d => d.status === "REJECTED" || d.status === "EXPIRED").length;
  const acceptanceRate = decided.length > 0 ? Math.round(((decided.length - rejected) / decided.length) * 100) : null;

  // Last 7 days including today.
  const weekly: Array<{ day: string; amount: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const amount = delivered.reduce((sum, d) => {
      const at = completedAt(d);
      return at && sameDay(at, day) ? sum + getEarning(d) : sum;
    }, 0);
    weekly.push({ day: DAY_LABELS[day.getDay()], amount });
  }

  return {
    todayEarnings,
    todayDeliveries,
    totalEarnings: delivered.reduce((s, d) => s + getEarning(d), 0),
    totalDeliveries: delivered.length,
    acceptanceRate,
    weekly,
  };
}

export function findActiveDelivery(deliveries: Delivery[]): Delivery | null {
  const actives = deliveries.filter(d => isActive(d.status));
  if (actives.length === 0) return null;
  // Newest assignment first.
  return [...actives].sort((a, b) => {
    const ta = new Date(a.assignedAt ?? a.createdAt ?? 0).getTime();
    const tb = new Date(b.assignedAt ?? b.createdAt ?? 0).getTime();
    return tb - ta;
  })[0];
}
