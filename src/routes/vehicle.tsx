"use client";

import { createFileRoute } from "@/lib/next-router-compat";
import { Bike } from "lucide-react";
import { AppLayout, PageHeader, RequireAuth } from "@/components/app-shell";
import { Card, Skeleton } from "@/components/ui-bits";
import { useProfile } from "@/lib/profile-state";

export const Route = createFileRoute("/vehicle")({
  head: () => ({ meta: [{ title: "Vehicle · Fresh15 Partner" }] }),
  component: () => <RequireAuth><Veh /></RequireAuth>,
});

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/60 last:border-0">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value || "—"}</span>
    </div>
  );
}

function Veh() {
  const { profile, loading } = useProfile();
  return (
    <AppLayout showNav={false}>
      <PageHeader back title="Vehicle details" />
      <div className="px-4 pt-4 pb-8 space-y-4">
        {loading && !profile ? (
          <Card className="space-y-3"><Skeleton className="h-16 w-16 rounded-2xl mx-auto" /><Skeleton className="h-4 w-40 mx-auto" /></Card>
        ) : (
          <>
            <Card className="text-center py-6">
              <div className="grid place-items-center h-16 w-16 rounded-2xl gradient-primary text-primary-foreground mx-auto"><Bike className="h-8 w-8" /></div>
              <div className="mt-3 font-bold text-lg">{profile?.vehicleType || "Vehicle not added"}</div>
              <div className="text-xs text-muted-foreground font-mono mt-1">{profile?.vehicleNumber || "—"}</div>
            </Card>
            <Card>
              <Row label="Type" value={profile?.vehicleType} />
              <Row label="Registration" value={profile?.vehicleNumber} />
              <Row label="Driving licence" value={profile?.drivingLicenseNumber} />
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
