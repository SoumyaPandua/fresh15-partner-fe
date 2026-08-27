"use client";
import { createFileRoute, useNavigate, Link } from "@/lib/next-router-compat";
import { useState } from "react";
import { Mail, ArrowRight, Leaf, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/app-state";
import { loginRequest } from "@/lib/auth-api";

export const Route = createFileRoute("/login")({ head: () => ({ meta: [{ title: "Sign in · Fresh15 Partner" }] }), component: Login });

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("Enter a valid email address");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      const { token, user, message } = await loginRequest(email.trim(), password);
      login(user, token);
      toast.success(message);
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally { setLoading(false); }
  };

  return <div className="min-h-screen bg-background flex flex-col"><div className="relative flex-1 flex flex-col justify-center px-6 py-10 max-w-md mx-auto w-full"><div className="flex items-center gap-3 mb-10"><div className="grid place-items-center h-14 w-14 rounded-2xl gradient-primary text-primary-foreground font-bold text-xl shadow-elevated">F15</div><div><div className="text-xs uppercase tracking-widest text-muted-foreground">Fresh15</div><div className="font-semibold text-lg">Delivery Partner</div></div></div><h1 className="text-3xl font-bold">Welcome back,<br />ready to ride?</h1><p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-sm"><Leaf className="h-4 w-4 text-primary" /> Deliver fresh in 15 minutes.</p><form onSubmit={submit} className="mt-10 space-y-4"><label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email address</span><div className="mt-2 flex items-center gap-2 rounded-2xl border bg-card px-4 h-14"><Mail className="h-5 w-5 text-muted-foreground" /><input autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 bg-transparent outline-none" /></div></label><label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</span><div className="mt-2 flex items-center gap-2 rounded-2xl border bg-card px-4 h-14"><Lock className="h-5 w-5 text-muted-foreground" /><input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="flex-1 bg-transparent outline-none" /><button type="button" onClick={() => setShow((v) => !v)}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label><button type="submit" disabled={loading} className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-70">{loading ? "Signing in..." : <>Sign in <ArrowRight className="h-4 w-4" /></>}</button><Link to="/forgot-password" className="block text-center text-sm text-primary font-medium py-2">Forgot password?</Link></form><div className="mt-7 text-center text-sm text-muted-foreground">New to Fresh15? <Link to="/register" className="font-semibold text-primary">Apply as a partner</Link></div></div></div>;
}
