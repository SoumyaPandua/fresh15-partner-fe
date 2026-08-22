"use client";

import { createFileRoute, Link, useNavigate } from "@/lib/next-router-compat";
import { ArrowLeft, Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { resetPasswordRequest } from "@/lib/auth-api";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password · Fresh15 Partner" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    email: (s.email as string) ?? "",
    token: (s.token as string) ?? "",
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { email, token } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error("Reset session expired. Please start again.");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      const message = await resetPasswordRequest(token, password);
      setPassword("");
      setConfirm("");
      toast.success(message);
      navigate({ to: "/login", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setLoading(false);
    }
  };

  const field = (
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
    autoFocus = false
  ) => (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 h-14 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all">
      <Lock className="h-5 w-5 text-muted-foreground" />
      <input
        autoFocus={autoFocus}
        type={show ? "text" : "password"}
        autoComplete="new-password"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-base font-medium"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="grid place-items-center h-9 w-9 -mr-2 rounded-full text-muted-foreground hover:bg-muted transition-colors"
      >
        {show ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-6 max-w-md mx-auto w-full">
      <Link to="/login" className="grid place-items-center h-10 w-10 -ml-2 rounded-full hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Link>

      <div className="mt-8 animate-slide-up">
        <div className="grid place-items-center h-14 w-14 rounded-2xl bg-primary-soft text-primary mb-6">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold">Set a new password</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          {email ? <>For <span className="font-semibold text-foreground">{email}</span>. </> : null}
          Use at least 6 characters.
        </p>
      </div>

      <form onSubmit={submit} className="mt-10 space-y-4 animate-slide-up" style={{ animationDelay: "60ms" }}>
        {field(password, setPassword, "New password", true)}
        {field(confirm, setConfirm, "Confirm new password")}
        <button
          disabled={loading}
          className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-semibold shadow-elevated active:scale-[0.98] disabled:opacity-70"
        >
          {loading ? "Updating..." : "Reset password"}
        </button>
      </form>
    </div>
  );
}
