export { ApiError } from "./api-client";
import { API_BASE, apiRequest, ApiError } from "./api-client";

/**
 * Fresh15 backend delivery contract.
 *
 * GET   /api/delivery/my
 * GET   /api/delivery/:id
 * PATCH /api/delivery/:id/status
 */

export type DeliveryStatus =
  | "PENDING"
  | "ASSIGNED"
  | "ACCEPTED"
  | "PICKED_UP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "REJECTED"
  | "EXPIRED"
  | "FAILED"
  | "CANCELLED";

export type RiderDeliveryStatus = Extract<
  DeliveryStatus,
  "ACCEPTED" | "PICKED_UP" | "OUT_FOR_DELIVERY" | "DELIVERED" | "REJECTED" | "CANCELLED"
>;

export const DELIVERY_STATUS_LABEL: Record<DeliveryStatus, string> = {
  PENDING: "Pending",
  ASSIGNED: "Assigned",
  ACCEPTED: "Accepted",
  PICKED_UP: "Picked Up",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  REJECTED: "Rejected",
  EXPIRED: "Expired — not accepted in time",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export const DELIVERY_FLOW: DeliveryStatus[] = ["ASSIGNED", "ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"];
export const ACTIVE_STATUSES: DeliveryStatus[] = ["PENDING", "ASSIGNED", "ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY"];
export const CLOSED_STATUSES: DeliveryStatus[] = ["REJECTED", "EXPIRED", "FAILED", "CANCELLED"];

export function nextRiderStatus(status: DeliveryStatus): RiderDeliveryStatus | null {
  switch (status) {
    case "ASSIGNED":
      return "ACCEPTED";
    case "ACCEPTED":
      return "PICKED_UP";
    case "PICKED_UP":
      return "OUT_FOR_DELIVERY";
    case "OUT_FOR_DELIVERY":
      return "DELIVERED";
    default:
      return null;
  }
}

export function isActive(status: DeliveryStatus) {
  return ACTIVE_STATUSES.includes(status);
}

/** Internal UI vocabulary; maps the backend's current enum names into the existing partner UI. */
export type SubstitutionPreference = "CALL_ME" | "BEST_SIMILAR" | "DO_NOT_SUBSTITUTE" | "SPECIFIC_REPLACEMENT";

export const SUBSTITUTION_LABEL: Record<SubstitutionPreference, string> = {
  CALL_ME: "Call me",
  BEST_SIMILAR: "Best similar item",
  DO_NOT_SUBSTITUTE: "Do not substitute",
  SPECIFIC_REPLACEMENT: "Specific replacement",
};

export interface ReplacementProduct {
  _id?: string;
  name?: string;
  productName?: string;
  title?: string;
  image?: string;
  imageUrl?: string;
  images?: string[];
  unit?: string;
}

export interface BackendSubstitutionPreference {
  type?: string | null;
  preferredReplacementProductId?: string | ReplacementProduct | null;
  preferredReplacementProductName?: string | null;
  preferredReplacementSku?: string | null;
  preferredReplacementImage?: string | null;
}

export interface DeliveryOrderItem {
  _id?: string;
  name?: string;
  productName?: string;
  quantity?: number;
  qty?: number;
  unit?: string;
  price?: number;
  substitutionPreference?: string | BackendSubstitutionPreference | null;
  preferredReplacementProductId?: string | ReplacementProduct | null;
  preferredReplacementName?: string | null;
  replacementProduct?: ReplacementProduct | null;
}

export interface DeliveryAddress {
  _id?: string;
  name?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface DeliveryOrder {
  _id?: string;
  orderNumber?: string;
  orderStatus?: string;
  grandTotal?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  items?: DeliveryOrderItem[];
  addressId?: DeliveryAddress | string | null;
  userId?: { _id?: string; name?: string; phone?: string; email?: string } | string | null;
  createdAt?: string;
}

export interface Delivery {
  _id: string;
  orderId?: DeliveryOrder | string | null;
  riderId?: string | { _id?: string; name?: string } | null;
  status: DeliveryStatus;
  riderStatus?: string | null;
  assignedAt?: string | null;
  acceptedAt?: string | null;
  acceptanceDeadlineAt?: string | null;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  rejectedAt?: string | null;
  cancelledAt?: string | null;
  estimatedDeliveryTime?: string | null;
  deliveryOtpVerified?: boolean;
  deliveryOtpVerifiedAt?: string | null;
  customerConfirmedAt?: string | null;
  proofOfDelivery?: {
    photoUrl?: string | null;
    signatureUrl?: string | null;
    uploadedAt?: string | null;
  } | null;
  failedDelivery?: {
    reason?: string | null;
    note?: string | null;
    failedAt?: string | null;
  } | null;
  deliveryCharge?: number;
  earning?: number;
  notes?: string | null;
  currentLocation?: {
    latitude?: number | null;
    longitude?: number | null;
    accuracy?: number | null;
    speed?: number | null;
    heading?: number | null;
    updatedAt?: string | null;
  } | null;
  destination?: { latitude: number; longitude: number } | null;
  createdAt?: string;
  updatedAt?: string;
}


export async function fetchMyDeliveries(token: string, status?: DeliveryStatus): Promise<Delivery[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const json = await apiRequest<Delivery[]>(`/api/delivery/my${qs}`, {}, token);
  return Array.isArray(json.data) ? json.data : [];
}

export async function fetchDelivery(token: string, id: string): Promise<Delivery> {
  const json = await apiRequest<Delivery>(`/api/delivery/${id}`, {}, token);
  if (!json.data) throw new ApiError("Delivery not found.", 404);
  return json.data;
}

export async function fetchMyActiveDelivery(token: string): Promise<Delivery | null> {
  const json = await apiRequest<Delivery | null>("/api/delivery/my/active", {}, token);
  return json.data ?? null;
}

export type CodPaymentResult = {
  payment?: {
    _id?: string;
    amount?: number;
    currency?: string;
    method?: string;
    status?: string;
    paidAt?: string;
    gatewayResponse?: Record<string, unknown>;
  } | null;
  order?: DeliveryOrder | null;
  delivery?: Delivery | null;
};

export async function collectCodPayment(
  token: string,
  deliveryId: string,
): Promise<{
  delivery: Delivery | null;
  order: DeliveryOrder | null;
  payment: CodPaymentResult["payment"];
  message: string;
}> {
  const json = await apiRequest<CodPaymentResult>(`/api/delivery/${deliveryId}/cod-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  }, token);

  return {
    delivery: json.data?.delivery ?? null,
    order: json.data?.order ?? null,
    payment: json.data?.payment ?? null,
    message: json.message ?? "COD payment collected successfully.",
  };
}

export async function verifyDeliveryOtp(
  token: string,
  deliveryId: string,
  otp: string,
): Promise<{ delivery: Delivery | null; message: string }> {
  const json = await apiRequest<Delivery>(`/api/delivery/${deliveryId}/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ otp }),
  }, token);
  return { delivery: json.data ?? null, message: json.message ?? "Delivery OTP verified." };
}

export async function uploadDeliveryProof(
  token: string,
  deliveryId: string,
  type: "PHOTO" | "SIGNATURE",
  file: File,
): Promise<{ url: string; message: string; proofOfDelivery?: Delivery["proofOfDelivery"] }> {
  const form = new FormData();
  form.append("type", type);
  form.append("image", file);

  const json = await apiRequest<{
    url: string;
    proofOfDelivery?: Delivery["proofOfDelivery"];
  }>(`/api/delivery/${deliveryId}/proof`, {
    method: "POST",
    body: form,
  }, token);

  return {
    url: json.data.url,
    proofOfDelivery: json.data.proofOfDelivery,
    message: json.message ?? "Delivery proof uploaded.",
  };
}

export async function failDelivery(
  token: string,
  deliveryId: string,
  reason: string,
  note?: string,
): Promise<{ delivery: Delivery | null; message: string }> {
  const json = await apiRequest<Delivery>(`/api/delivery/${deliveryId}/fail`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason, note: note ?? "" }),
  }, token);
  return { delivery: json.data ?? null, message: json.message ?? "Delivery marked as failed." };
}

export async function updateDeliveryStatus(
  token: string,
  id: string,
  status: RiderDeliveryStatus,
): Promise<{ delivery: Delivery | null; message: string }> {
  const json = await apiRequest<Delivery>(`/api/delivery/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  }, token);
  return {
    delivery: json.data ?? null,
    message: json.message ?? `Delivery marked as ${DELIVERY_STATUS_LABEL[status]}`,
  };
}

export function getOrder(d: Delivery): DeliveryOrder | null {
  return d.orderId && typeof d.orderId === "object" ? (d.orderId as DeliveryOrder) : null;
}

export function getOrderNumber(d: Delivery): string {
  const o = getOrder(d);
  if (o?.orderNumber) return o.orderNumber;
  const raw = typeof d.orderId === "string" ? d.orderId : o?._id;
  return raw ? `#${raw.slice(-6).toUpperCase()}` : `#${d._id.slice(-6).toUpperCase()}`;
}

export function getAddress(d: Delivery): DeliveryAddress | null {
  const a = getOrder(d)?.addressId;
  return a && typeof a === "object" ? (a as DeliveryAddress) : null;
}

export function formatAddress(a: DeliveryAddress | null): string {
  if (!a) return "";
  return [a.addressLine1, a.addressLine2, a.city, a.state, a.pincode].filter(Boolean).join(", ");
}

export function getCustomerName(d: Delivery): string {
  const o = getOrder(d);
  const u = o?.userId;
  if (u && typeof u === "object" && u.name) return u.name;
  return getAddress(d)?.name ?? "Customer";
}

export function getCustomerPhone(d: Delivery): string | undefined {
  const u = getOrder(d)?.userId;
  if (u && typeof u === "object" && u.phone) return u.phone;
  return getAddress(d)?.phone;
}

export function getItems(d: Delivery): DeliveryOrderItem[] {
  return getOrder(d)?.items ?? [];
}

export function itemName(i: DeliveryOrderItem) {
  return i.name ?? i.productName ?? "Item";
}

export function itemQty(i: DeliveryOrderItem) {
  return i.quantity ?? i.qty ?? 1;
}

export function getEarning(d: Delivery): number {
  return typeof d.earning === "number" ? d.earning : (d.deliveryCharge ?? 0);
}

export function formatMoney(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export function getSubstitutionPreference(i: DeliveryOrderItem): SubstitutionPreference | null {
  const rawValue = i.substitutionPreference;

  const raw = rawValue && typeof rawValue === "object" ? rawValue.type : rawValue;

  const key = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  switch (key) {
    case "CALL_ME":
    case "CALL":
      return "CALL_ME";
    case "BEST_SIMILAR":
    case "BEST_SIMILAR_ITEM":
    case "SIMILAR":
      return "BEST_SIMILAR";
    case "DO_NOT_SUBSTITUTE":
    case "NO_SUBSTITUTE":
    case "NONE":
      return "DO_NOT_SUBSTITUTE";
    case "SPECIFIC_REPLACEMENT":
    case "SPECIFIC":
    case "SPECIFIC_PRODUCT":
    case "SPECIFIC_ITEM":
      return "SPECIFIC_REPLACEMENT";
    default:
      return null;
  }
}

export function getReplacementProduct(i: DeliveryOrderItem): ReplacementProduct | null {
  const nested =
    i.substitutionPreference && typeof i.substitutionPreference === "object"
      ? i.substitutionPreference.preferredReplacementProductId
      : null;

  const p = i.replacementProduct ?? nested ?? i.preferredReplacementProductId;
  if (p && typeof p === "object") {
    return p as ReplacementProduct;
  }

  const sub =
    i.substitutionPreference && typeof i.substitutionPreference === "object" ? i.substitutionPreference : null;

  if (sub?.preferredReplacementProductName || sub?.preferredReplacementImage) {
    return {
      name: sub.preferredReplacementProductName ?? undefined,
      image: sub.preferredReplacementImage ?? undefined,
      unit: "Customer-selected replacement",
    };
  }

  return null;
}

export function getReplacementProductId(i: DeliveryOrderItem): string | null {
  const nested =
    i.substitutionPreference && typeof i.substitutionPreference === "object"
      ? i.substitutionPreference.preferredReplacementProductId
      : null;

  const p = nested ?? i.preferredReplacementProductId;
  if (typeof p === "string") return p;
  if (p && typeof p === "object" && p._id) return p._id;
  return i.replacementProduct?._id ?? null;
}

export function replacementName(p: ReplacementProduct | null): string | null {
  return p?.name ?? p?.productName ?? p?.title ?? null;
}

export function replacementImage(p: ReplacementProduct | null): string | null {
  return p?.image ?? p?.imageUrl ?? p?.images?.[0] ?? null;
}
