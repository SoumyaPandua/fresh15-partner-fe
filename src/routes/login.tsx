"use client";

import { createFileRoute, useNavigate, Link } from "@/lib/next-router-compat";
import { useState } from "react";
import { Mail, ArrowRight, Leaf, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/app-state";
import { loginRequest } from "@/lib/auth-api";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · Fresh15 Partner" }] }),
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const { token, user, message } = await loginRequest(email.trim(), password);
      login(user, token);
      toast.success(message);
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="relative flex-1 flex flex-col justify-center px-6 py-10 max-w-md mx-auto w-full">
        <div className="absolute inset-x-0 top-0 h-64 gradient-primary opacity-10 blur-3xl -z-10" />

        <div className="flex items-center gap-3 mb-10 animate-slide-up">
          <div className="grid place-items-center h-14 w-14 rounded-2xl gradient-primary text-primary-foreground font-bold text-xl shadow-elevated">
            F15
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Fresh15</div>
            <div className="font-semibold text-lg">Delivery Partner</div>
          </div>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "60ms" }}>
          <h1 className="text-3xl font-bold text-balance leading-tight">Welcome back,<br />ready to ride?</h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-sm">
            <Leaf className="h-4 w-4 text-primary" /> Deliver fresh in 15 minutes.
          </p>
        </div>

        <form onSubmit={submit} className="mt-10 space-y-4 animate-slide-up" style={{ animationDelay: "120ms" }}>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email address</span>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 h-14 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all">
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
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</span>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 h-14 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <input
                type={show ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
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
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-semibold shadow-elevated flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98] transition-transform"
          >
            {loading ? "Signing in..." : <>Sign in <ArrowRight className="h-4.5 w-4.5" /></>}
          </button>

          <Link to="/forgot-password" className="block text-center text-sm text-primary font-medium py-2">
            Forgot password?
          </Link>
        </form>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          Mobile number sign-in coming soon.
        </div>
        <div className="mt-auto pt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to our Terms & Privacy Policy
        </div>
      </div>
    </div>
  );
}
