"use client";

import { createFileRoute, Link, useNavigate } from "@/lib/next-router-compat";
import { useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { verifyPartnerRegistration } from "@/lib/partner-registration-api";

export const Route = createFileRoute("/verify-registration")({
  head: () => ({ meta: [{ title: "Verify Partner Application · Fresh15" }] }),
  component: VerifyRegistration,
});

function VerifyRegistration() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("fresh15-partner-register-email");
    if (saved) setEmail(saved);
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await verifyPartnerRegistration(email, otp);
      sessionStorage.removeItem("fresh15-partner-register-email");
      toast.success("Email verified. Your application is now awaiting admin approval.");
      navigate({ to: "/login", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return <div className="min-h-screen bg-background px-6 py-10"><div className="mx-auto mt-20 max-w-md rounded-3xl border bg-card p-7 shadow-elevated"><div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><MailCheck className="h-6 w-6" /></div><h1 className="text-2xl font-bold">Verify your email</h1><p className="mt-2 text-sm text-muted-foreground">Enter the OTP sent to your registration email. Your account will remain unable to sign in until an admin approves the application.</p><form onSubmit={submit} className="mt-6 space-y-3"><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 w-full rounded-xl border bg-background px-3" placeholder="Email" /><input required inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} className="h-12 w-full rounded-xl border bg-background px-3 text-center text-xl tracking-[0.4em]" placeholder="OTP" /><button disabled={loading} className="h-12 w-full rounded-2xl gradient-primary font-semibold text-primary-foreground disabled:opacity-60">{loading ? "Verifying…" : "Verify email"}</button></form><div className="mt-5 text-center text-sm text-muted-foreground"><Link className="font-semibold text-primary" to="/login">Back to sign in</Link></div></div></div>;
}
