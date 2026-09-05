"use client";

import { createFileRoute } from "@/lib/next-router-compat";
import { Eye, EyeOff, Landmark, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { AppLayout, PageHeader, RequireAuth } from "@/components/app-shell";
import { Card, Skeleton } from "@/components/ui-bits";
import { useProfile } from "@/lib/profile-state";
import { setInitialBankDetails } from "@/lib/profile-api";
import { useAuth } from "@/lib/app-state";
import { toast } from "sonner";

export const Route = createFileRoute("/bank")({
  head: () => ({ meta: [{ title: "Bank details · Fresh15 Partner" }] }),
  component: () => <RequireAuth><Bank /></RequireAuth>,
});

function Row({ label, value, sensitive = false, visible = false, onToggle }: { label: string; value?: string | null; sensitive?: boolean; visible?: boolean; onToggle?: () => void }) {
  const shown = value || "—";
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border/60 last:border-0">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-semibold truncate">{sensitive && value ? (visible ? shown : `••••••${value.slice(-4)}`) : shown}</span>
        {sensitive && value && <button type="button" onClick={onToggle} className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted" aria-label={visible ? `Hide ${label}` : `Show ${label}`}>{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>}
      </div>
    </div>
  );
}

function Bank() {
  const { token } = useAuth();
  const { profile, loading, refresh } = useProfile();
  const [showAccount, setShowAccount] = useState(false);
  const [showIfsc, setShowIfsc] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ bankName: "", accountHolderName: "", accountNumber: "", ifscCode: "" });
  const [started, setStarted] = useState(false);
  const canAdd = !profile?.bankName && !profile?.accountNumber;

  const save = async () => {
    if (!token) return;
    if (!form.bankName || !form.accountHolderName || !form.accountNumber || !form.ifscCode) {
      toast.error("Please fill all bank details");
      return;
    }
    setSaving(true);
    try {
      await setInitialBankDetails(token, form);
      await refresh();
      setStarted(false);
      toast.success("Bank details saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save bank details");
    } finally { setSaving(false); }
  };

  return (
    <AppLayout showNav={false}>
      <PageHeader back title="Bank details" subtitle="For weekly payouts" />
      <div className="px-4 pt-4 pb-8 space-y-4">
        {loading && !profile ? <Card className="space-y-3"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-28" /></Card> : profile?.bankName ? (
          <>
            <Card className="gradient-primary text-primary-foreground border-transparent">
              <div className="flex items-start justify-between"><div><div className="text-xs opacity-80 uppercase tracking-wider">Payout account</div><div className="mt-2 text-lg font-bold">{profile.bankName}</div><div className="text-sm font-mono tracking-widest mt-1">{showAccount ? profile.accountNumber : `••••••${profile.accountNumber?.slice(-4)}`}</div></div><Landmark className="h-6 w-6 opacity-80" /></div>
              <div className="mt-4 flex items-center gap-1 text-xs opacity-90"><ShieldCheck className="h-3.5 w-3.5" /> Used for your weekly payouts</div>
            </Card>
            <Card>
              <Row label="Account holder" value={profile.accountHolderName} />
              <Row label="Bank" value={profile.bankName} />
              <Row label="Account" value={profile.accountNumber} sensitive visible={showAccount} onToggle={() => setShowAccount(v => !v)} />
              <Row label="IFSC" value={profile.ifscCode} sensitive visible={showIfsc} onToggle={() => setShowIfsc(v => !v)} />
            </Card>
            <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">Bank details are locked after the first successful setup. Contact Fresh15 support if they need to be changed.</div>
          </>
        ) : canAdd ? (
          <Card className="space-y-4">
            <div><div className="font-semibold">Add bank details</div><div className="text-xs text-muted-foreground mt-1">Required before you can accept delivery orders. No bank validation is applied yet.</div></div>
            {!started ? <button type="button" onClick={() => setStarted(true)} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold">Add bank details</button> : <>
              {(["bankName", "accountHolderName", "accountNumber", "ifscCode"] as const).map((key) => <input key={key} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} type={key === "accountNumber" ? "password" : "text"} placeholder={{ bankName: "Bank name", accountHolderName: "Account holder name", accountNumber: "Account number", ifscCode: "IFSC code" }[key]} className="h-11 w-full rounded-xl border bg-background px-3 text-sm" />)}
              <button type="button" onClick={save} disabled={saving} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-60">{saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Save bank details"}</button>
            </>}
          </Card>
        ) : null}
      </div>
    </AppLayout>
  );
}
