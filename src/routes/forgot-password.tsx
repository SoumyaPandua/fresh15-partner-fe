"use client";

import { createFileRoute, Link, useNavigate } from "@/lib/next-router-compat";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { forgotPasswordRequest } from "@/lib/auth-api";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password · Fresh15 Partner" }] }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("Enter a valid email address");
    setLoading(true);
    try {
      const message = await forgotPasswordRequest(email.trim());
      toast.success(message);
      navigate({ to: "/otp", search: { email: email.trim(), purpose: "FORGOT_PASSWORD" } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-6 max-w-md mx-auto w-full">
      <Link to="/login" className="grid place-items-center h-10 w-10 -ml-2 rounded-full hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Link>
      <div className="mt-8 animate-slide-up">
        <div className="grid place-items-center h-14 w-14 rounded-2xl bg-primary-soft text-primary mb-6">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold">Forgot password?</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">Enter your registered email and we'll send a reset code.</p>
      </div>
      <form onSubmit={submit} className="mt-10 space-y-4">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 h-14 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <input
            autoFocus
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@fresh15.in"
            className="flex-1 bg-transparent outline-none text-base font-medium"
          />
        </div>
        <button
          disabled={loading}
          className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-semibold shadow-elevated active:scale-[0.98] disabled:opacity-70"
        >
          {loading ? "Sending..." : "Send reset code"}
        </button>
      </form>
    </div>
  );
}
