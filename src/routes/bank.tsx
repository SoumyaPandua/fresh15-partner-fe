"use client";

import { createFileRoute } from "@/lib/next-router-compat";
import { Landmark, ShieldCheck } from "lucide-react";
import { AppLayout, PageHeader, RequireAuth } from "@/components/app-shell";
import { Card, Skeleton } from "@/components/ui-bits";
import { useProfile } from "@/lib/profile-state";

export const Route = createFileRoute("/bank")({
  head: () => ({ meta: [{ title: "Bank details · Fresh15 Partner" }] }),
  component: () => <RequireAuth><Bank /></RequireAuth>,
});

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/60 last:border-0">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value || "—"}</span>
    </div>
  );
}

function mask(acc?: string | null) {
  if (!acc) return "";
  return "••••" + acc.slice(-4);
}

function Bank() {
  const { profile, loading } = useProfile();
  return (
    <AppLayout showNav={false}>
      <PageHeader back title="Bank details" subtitle="For weekly payouts" />
      <div className="px-4 pt-4 pb-8 space-y-4">
        {loading && !profile ? (
          <Card className="space-y-3"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-28" /></Card>
        ) : (
          <>
            <Card className="gradient-primary text-primary-foreground border-transparent">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs opacity-80 uppercase tracking-wider">Payout account</div>
                  <div className="mt-2 text-lg font-bold">{profile?.bankName || "Bank not added"}</div>
                  <div className="text-sm font-mono tracking-widest mt-1">{mask(profile?.accountNumber) || "—"}</div>
                </div>
                <Landmark className="h-6 w-6 opacity-80" />
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs opacity-90">
                <ShieldCheck className="h-3.5 w-3.5" /> Used for your weekly payouts
              </div>
            </Card>
            <Card>
              <Row label="Account holder" value={profile?.accountHolderName} />
              <Row label="Bank" value={profile?.bankName} />
              <Row label="Account" value={mask(profile?.accountNumber)} />
              <Row label="IFSC" value={profile?.ifscCode} />
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
