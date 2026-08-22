export { API_BASE } from "./api-client";
import { apiRequest } from "./api-client";

export interface PartnerUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  portal?: string;
  profileImage?: string;
  isEmailVerified?: boolean;
  isActive?: boolean;
}


export async function loginRequest(email: string, password: string) {
  const json = await apiRequest<{
    token: string;
    user: PartnerUser & { _id?: string };
  }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password, portal: "partner" }) });

  const raw = json.data?.user;
  const token = json.data?.token;
  if (!raw || !token) throw new Error("Unexpected response from server.");

  const role = (raw.role ?? "").toUpperCase();
  const portal = (raw.portal ?? "").toLowerCase();
  if ((role && role !== "PARTNER") || (portal && portal !== "partner")) {
    throw new Error("This account is not a Fresh15 delivery partner account.");
  }

  const user: PartnerUser = {
    id: raw._id ?? raw.id,
    name: raw.name,
    email: raw.email,
    phone: raw.phone,
    role: raw.role,
    portal: raw.portal,
    profileImage: raw.profileImage,
    isEmailVerified: raw.isEmailVerified,
    isActive: raw.isActive,
  };

  return { token, user, message: json.message ?? "Login successful" };
}

export async function forgotPasswordRequest(email: string) {
  const json = await apiRequest<null>("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
  return json.message ?? "OTP sent successfully";
}

export async function verifyOtpRequest(email: string, otp: string, purpose = "FORGOT_PASSWORD") {
  const json = await apiRequest<{ resetToken: string }>("/api/auth/verify-otp", { method: "POST", body: JSON.stringify({ email, otp, purpose }) });
  if (!json.data?.resetToken) throw new Error("Unexpected response from server.");
  return { resetToken: json.data.resetToken, message: json.message ?? "OTP verified successfully" };
}

export async function resetPasswordRequest(token: string, password: string) {
  const json = await apiRequest<null>("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });
  return json.message ?? "Password reset successful";
}
