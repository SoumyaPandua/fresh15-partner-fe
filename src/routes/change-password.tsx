"use client";

import { createFileRoute, useNavigate } from "@/lib/next-router-compat";
import { useState } from "react";
import { Loader2, KeyRound } from "lucide-react";
import { AppLayout, PageHeader, RequireAuth } from "@/components/app-shell";
import { Card } from "@/components/ui-bits";
import { useAuth } from "@/lib/app-state";
import { changePassword } from "@/lib/profile-api";
import { toast } from "sonner";

export const Route = createFileRoute("/change-password")({
  head: () => ({ meta: [{ title: "Change password · Fresh15 Partner" }] }),
  component: () => <RequireAuth><ChangePassword /></RequireAuth>,
});

const FIELD =
  "w-full h-12 px-4 rounded-xl bg-muted/60 border border-border/60 text-sm outline-none focus:border-primary/60 focus:bg-card transition-colors mt-1.5";

function ChangePassword() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current) return toast.error("Current password is required");
    if (next.length < 6) return toast.error("New password must be at least 6 characters");
    if (next !== confirm) return toast.error("Passwords do not match");
    if (!token) return toast.error("You are signed out. Please sign in again.");
    setBusy(true);
    try {
      const msg = await changePassword(token, current, next);
      toast.success(msg);
      setCurrent(""); setNext(""); setConfirm("");
      navigate({ to: "/profile" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppLayout showNav={false}>
      <PageHeader back title="Change password" subtitle="Keep your account secure" />
      <form onSubmit={onSubmit} className="px-4 pt-4 pb-8 space-y-4">
        <Card className="space-y-4">
          <div className="grid place-items-center h-12 w-12 rounded-2xl bg-primary-soft text-primary"><KeyRound className="h-5 w-5" /></div>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Current password</span>
            <input type="password" value={current} onChange={e => setCurrent(e.target.value)} className={FIELD} autoComplete="current-password" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">New password</span>
            <input type="password" value={next} onChange={e => setNext(e.target.value)} className={FIELD} autoComplete="new-password" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Confirm new password</span>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className={FIELD} autoComplete="new-password" />
          </label>
        </Card>
        <button
          type="submit"
          disabled={busy}
          className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-semibold text-sm shadow-elevated inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Update password
        </button>
      </form>
    </AppLayout>
  );
}
