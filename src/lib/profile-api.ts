import { apiRequest } from "./api-client";
import { type PartnerUser } from "./auth-api";

export interface PartnerReadiness { ready: boolean; bankComplete: boolean; missingDocuments: string[]; expiredDocuments: string[]; rejectedDocuments: string[]; }
export interface PartnerProfileDetails {
  _id?: string; userId?: string; role?: string; avatar?: string | null; gender?: string | null; dob?: string | null;
  vehicleType?: string | null; vehicleNumber?: string | null; drivingLicenseNumber?: string | null;
  bankName?: string | null; accountHolderName?: string | null; accountNumber?: string | null; ifscCode?: string | null;
  isOnline?: boolean; deliveryStatus?: string | null; currentDeliveryId?: string | null;
  totalDeliveries?: number; totalEarnings?: number; rating?: number; ratingCount?: number; tier?: string; readiness?: PartnerReadiness;
}
export interface AvailabilityPayload { isOnline: boolean; deliveryStatus?: string | null; currentDeliveryId?: string | null; }
export interface ProfilePayload { user: PartnerUser; profile: PartnerProfileDetails; readiness?: PartnerReadiness; }
export interface ProfileUpdateInput { name?: string; email?: string; phone?: string; gender?: string; dob?: string; }
function normalizeUser(raw: (PartnerUser & { _id?: string }) | undefined): PartnerUser { if (!raw) throw new Error("Unexpected response from server."); return { id: raw._id ?? raw.id, name: raw.name, email: raw.email, phone: raw.phone, role: raw.role, portal: raw.portal, profileImage: raw.profileImage, isEmailVerified: raw.isEmailVerified, isActive: raw.isActive }; }
export async function fetchProfile(token: string): Promise<ProfilePayload> {
  const json = await apiRequest<{ user: PartnerUser & { _id?: string }; profile: PartnerProfileDetails; readiness?: PartnerReadiness }>("/api/profile", {}, token);
  const profile = json.data?.profile ?? {};
  return { user: normalizeUser(json.data?.user), profile: { ...profile, readiness: json.data?.readiness } };
}
export async function updateProfile(token: string, input: ProfileUpdateInput) { const json = await apiRequest<{ user: PartnerUser & { _id?: string }; profile: PartnerProfileDetails }>("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }, token); return { payload: { user: normalizeUser(json.data?.user), profile: json.data?.profile ?? {} } as ProfilePayload, message: json.message ?? "Profile updated successfully" }; }
export async function uploadAvatar(token: string, file: File) { const form = new FormData(); form.append("image", file); const json = await apiRequest<{ profileImage?: string; avatar?: string; profile?: PartnerProfileDetails }>("/api/profile/avatar", { method: "PATCH", body: form }, token); return { profileImage: json.data?.profileImage ?? json.data?.avatar ?? "", avatar: json.data?.avatar ?? json.data?.profileImage ?? "", profile: json.data?.profile, message: json.message ?? "Avatar updated successfully" }; }
export async function changePassword(token: string, currentPassword: string, newPassword: string) { const json = await apiRequest<null>("/api/profile/password", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) }, token); return json.message ?? "Password changed successfully"; }
export async function updateAvailability(token: string, isOnline: boolean) { const json = await apiRequest<AvailabilityPayload>("/api/profile/availability", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isOnline }) }, token); return { availability: json.data, message: json.message ?? (isOnline ? "You are now online" : "You are now offline") }; }
export async function setInitialBankDetails(token: string, payload: { bankName: string; accountHolderName: string; accountNumber: string; ifscCode: string }) { const json = await apiRequest<PartnerProfileDetails>("/api/profile/bank", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }, token); return json.data; }
