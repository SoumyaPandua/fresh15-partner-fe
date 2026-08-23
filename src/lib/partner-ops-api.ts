
import { apiRequest } from "./api-client";

export type PartnerOpsOverview = {
  partner: {
    id: string;
    name: string;
    isOnline: boolean;
    isPaused: boolean;
    pauseUntil?: string | null;
    pauseReason?: string;
    deliveryStatus: string;
  };
  activeDelivery?: {
    _id: string;
    status: string;
    assignedAt?: string | null;
    acceptanceDeadlineAt?: string | null;
    earning?: number;
    deliveryCharge?: number;
    orderId?: string;
  } | null;
  nextStop?: PartnerQueueStop | null;
  queue: PartnerQueue;
  cash: CashSummary;
  earnings: EarningsSummary;
  upcomingShifts: PartnerShift[];
  documents: PartnerDocument[];
};

export type PartnerQueueStop = {
  deliveryId: string;
  orderId?: string | null;
  orderNumber?: string | null;
  status: string;
  assignedAt?: string | null;
  acceptanceDeadlineAt?: string | null;
  promisedDeliveryAt?: string | null;
  distanceKm?: number | null;
  customer: {
    name?: string | null;
    address?: {
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      pincode?: string;
      latitude?: number | null;
      longitude?: number | null;
    } | null;
  };
};

export type PartnerQueue = {
  currentLocation: { latitude: number; longitude: number } | null;
  nextStop: PartnerQueueStop | null;
  stops: PartnerQueueStop[];
  generatedAt: string;
};

export type EarningsLedgerEntry = {
  _id: string;
  type: "ORDER" | "INCENTIVE" | "ADJUSTMENT";
  amount: number;
  title: string;
  description?: string;
  createdAt: string;
  orderId?: { _id?: string; orderNumber?: string } | string | null;
  deliveryId?: string | null;
};

export type EarningsSummary = {
  from: string;
  to: string;
  totals: {
    orders: number;
    incentives: number;
    adjustments: number;
    total: number;
  };
  activeIncentives: Array<{
    _id: string;
    title: string;
    description?: string;
    amount: number;
    targetDeliveries: number;
    progress: number;
    remaining: number;
    startAt: string;
    endAt: string;
    completed: boolean;
  }>;
  ledger: EarningsLedgerEntry[];
};

export type CashLedgerEntry = {
  _id: string;
  type: "COD_COLLECTION" | "RECONCILIATION" | "ADJUSTMENT";
  amount: number;
  note?: string;
  createdAt: string;
  orderId?: { _id?: string; orderNumber?: string; grandTotal?: number } | null;
};

export type CashSummary = {
  cashInHand: number;
  totalCollected: number;
  totalReconciled: number;
  adjustments: number;
  ledger: CashLedgerEntry[];
};

export type PartnerShift = {
  _id: string;
  dateKey: string;
  startAt: string;
  endAt: string;
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  note?: string;
};

export type PartnerDocument = {
  _id: string;
  type: "DRIVING_LICENSE" | "RC" | "INSURANCE" | "PAN" | "OTHER";
  documentNumber?: string;
  expiresAt?: string | null;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  fileUrl?: string;
  notes?: string;
  daysRemaining: number | null;
  expiryState: "NOT_SET" | "EXPIRED" | "EXPIRING_SOON" | "VALID";
};

export type PartnerIncident = {
  _id: string;
  deliveryId?: string | null;
  orderId?: string | null;
  type: "SAFETY" | "CUSTOMER" | "VEHICLE" | "PAYMENT" | "APP" | "ACCIDENT" | "OTHER";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED";
  resolutionNote?: string;
  createdAt: string;
};

export type ShiftInput = {
  dateKey: string;
  startAt: string;
  endAt: string;
  note?: string;
};

const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export async function getPartnerOpsOverview(token: string) {
  return (await apiRequest<PartnerOpsOverview>("/api/partner-ops/overview", {}, token)).data;
}

export async function getPartnerQueue(token: string) {
  return (await apiRequest<PartnerQueue>("/api/partner-ops/queue", {}, token)).data;
}

export async function getPartnerEarnings(token: string, from?: string, to?: string) {
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return (await apiRequest<EarningsSummary>(`/api/partner-ops/earnings${suffix}`, {}, token)).data;
}

export async function getPartnerCash(token: string) {
  return (await apiRequest<CashSummary>("/api/partner-ops/cash", {}, token)).data;
}

export async function reconcilePartnerCash(token: string, amount: number, note?: string) {
  return (
    await apiRequest<{ cashInHand: number; entry: CashLedgerEntry }>(
      "/api/partner-ops/cash/reconcile",
      json({ amount, note }),
      token,
    )
  ).data;
}

export async function getPartnerShifts(token: string) {
  return (await apiRequest<PartnerShift[]>("/api/partner-ops/shifts", {}, token)).data;
}

export async function createPartnerShift(token: string, input: ShiftInput) {
  return (await apiRequest<PartnerShift>("/api/partner-ops/shifts", json(input), token)).data;
}

export async function cancelPartnerShift(token: string, id: string) {
  return (await apiRequest<PartnerShift>(`/api/partner-ops/shifts/${id}`, { method: "DELETE" }, token)).data;
}

export async function getPartnerDocuments(token: string) {
  return (await apiRequest<PartnerDocument[]>("/api/partner-ops/documents", {}, token)).data;
}

export async function updatePartnerDocument(
  token: string,
  input: {
    type: PartnerDocument["type"];
    documentNumber?: string;
    expiresAt?: string | null;
    status?: PartnerDocument["status"];
    fileUrl?: string;
    notes?: string;
  },
) {
  return (await apiRequest<PartnerDocument>("/api/partner-ops/documents", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }, token)).data;
}

export async function pausePartner(token: string, minutes = 30, reason = "") {
  return (
    await apiRequest<{
      isPaused: boolean;
      pauseUntil: string;
      pauseReason: string;
      deliveryStatus: string;
    }>("/api/partner-ops/pause", json({ minutes, reason }), token)
  ).data;
}

export async function resumePartner(token: string) {
  return (
    await apiRequest<{
      isPaused: boolean;
      pauseUntil: null;
      pauseReason: string;
      deliveryStatus: string;
    }>("/api/partner-ops/resume", json({}), token)
  ).data;
}

export async function getPartnerIncidents(token: string) {
  return (await apiRequest<PartnerIncident[]>("/api/partner-ops/incidents", {}, token)).data;
}

export async function createPartnerIncident(
  token: string,
  input: {
    type: PartnerIncident["type"];
    severity: PartnerIncident["severity"];
    description: string;
    deliveryId?: string;
    orderId?: string;
    latitude?: number;
    longitude?: number;
  },
) {
  return (
    await apiRequest<PartnerIncident>(
      "/api/partner-ops/incidents",
      json(input),
      token,
    )
  ).data;
}
