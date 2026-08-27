import { API_BASE } from "./api-client";

export type PartnerRegistrationInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
  vehicleType: "BIKE" | "SCOOTER" | "CAR" | "EV_BIKE" | "OTHER";
  vehicleRegistrationNumber: string;
  vehicleMakeModel?: string;
};

async function publicPost<T>(path: string, body: unknown): Promise<{ data: T; message?: string }> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  const json = await response.json().catch(() => null);
  if (!response.ok || json?.success === false) {
    throw new Error(json?.message || `Request failed (${response.status})`);
  }
  return json;
}

export async function registerPartner(input: PartnerRegistrationInput) {
  return publicPost<{ id: string; email: string }>("/api/auth/partner-register", input);
}

export async function verifyPartnerRegistration(email: string, otp: string) {
  return publicPost<null>("/api/auth/verify-otp", {
    email: email.trim(),
    otp: otp.trim(),
    purpose: "REGISTER",
  });
}
