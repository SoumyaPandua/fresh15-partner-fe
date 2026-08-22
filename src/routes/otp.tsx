"use client";

import { createFileRoute, useNavigate, Link } from "@/lib/next-router-compat";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { forgotPasswordRequest, verifyOtpRequest } from "@/lib/auth-api";

const LEN = 6;

export const Route = createFileRoute("/otp")({
  head: () => ({ meta: [{ title: "Verify OTP · Fresh15 Partner" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    email: (s.email as string) ?? "",
    purpose: ((s.purpose as string) ?? "FORGOT_PASSWORD") as "FORGOT_PASSWORD",
  }),
  component: Otp,
});

function Otp() {
  const { email, purpose } = Route.useSearch();
  const [code, setCode] = useState<string[]>(Array(LEN).fill(""));
  const [seconds, setSeconds] = useState(30);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const navigate = useNavigate();

  useEffect(() => { inputs.current[0]?.focus(); }, []);
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const setDigit = (i: number, v: string) => {
    const digits = v.replace(/\D/g, "");
    if (!digits) {
      setCode(prev => { const n = [...prev]; n[i] = ""; return n; });
      return;
    }
    setCode(prev => {
      const n = [...prev];
      for (let k = 0; k < digits.length && i + k < LEN; k++) n[i + k] = digits[k]!;
      return n;
    });
    const next = Math.min(i + digits.length, LEN - 1);
    inputs.current[next]?.focus();
  };

  const verify = async () => {
    const otp = code.join("");
    if (otp.length !== LEN) {
      toast.error(`Enter the ${LEN}-digit code`);
      return;
    }
    if (!email) {
      toast.error("Missing email. Please start again.");
      return;
    }
    setLoading(true);
    try {
      const { resetToken, message } = await verifyOtpRequest(email, otp, purpose);
      toast.success(message);
      navigate({ to: "/reset-password", search: { email, token: resetToken }, replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email) return toast.error("Missing email. Please start again.");
    try {
      const message = await forgotPasswordRequest(email);
      setSeconds(30);
      toast.success(message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resend code");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-6 max-w-md mx-auto w-full">
      <Link to="/forgot-password" className="grid place-items-center h-10 w-10 -ml-2 rounded-full hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Link>

      <div className="mt-8 animate-slide-up">
        <div className="grid place-items-center h-14 w-14 rounded-2xl bg-primary-soft text-primary mb-6">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold">Verify your email</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          We sent a {LEN}-digit code to <span className="font-semibold text-foreground">{email || "your email"}</span>.
        </p>
      </div>

      <div className="mt-8 flex gap-2 justify-center animate-slide-up" style={{ animationDelay: "60ms" }}>
        {code.map((d, i) => (
          <input
            key={i}
            ref={el => { inputs.current[i] = el; }}
            value={d}
            onChange={e => setDigit(i, e.target.value)}
            onKeyDown={e => { if (e.key === "Backspace" && !d && i > 0) inputs.current[i - 1]?.focus(); }}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={LEN}
            className="h-12 w-11 rounded-xl border-2 border-border bg-card text-center text-lg font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
          />
        ))}
      </div>

      <button
        onClick={verify}
        disabled={loading}
        className="mt-8 w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-semibold shadow-elevated active:scale-[0.98] transition-transform disabled:opacity-70"
      >
        {loading ? "Verifying..." : "Verify & continue"}
      </button>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        {seconds > 0 ? (
          <>Resend code in <span className="font-semibold text-foreground">{seconds}s</span></>
        ) : (
          <button className="text-primary font-semibold" onClick={resend}>Resend code</button>
        )}
      </div>
    </div>
  );
}
