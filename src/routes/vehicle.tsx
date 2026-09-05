"use client";

import { createFileRoute } from "@/lib/next-router-compat";
import { Bike, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { AppLayout, PageHeader, RequireAuth } from "@/components/app-shell";
import { Card, Skeleton } from "@/components/ui-bits";
import { useProfile } from "@/lib/profile-state";

export const Route = createFileRoute("/vehicle")({
  head: () => ({ meta: [{ title: "Vehicle · Fresh15 Partner" }] }),
  component: () => <RequireAuth><Veh /></RequireAuth>,
});

function Row({ label, value, sensitive, visible, toggle }: { label: string; value?: string | null; sensitive?: boolean; visible?: boolean; toggle?: () => void }) {
  return <div className="flex items-center justify-between gap-3 py-3 border-b border-border/60 last:border-0"><span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span><div className="flex items-center gap-2"><span className="text-sm font-semibold">{sensitive && value ? (visible ? value : `••••••${value.slice(-4)}`) : value || "—"}</span>{sensitive && value && <button type="button" onClick={toggle} className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted" aria-label={visible ? `Hide ${label}` : `Show ${label}`}>{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>}</div></div>;
}

function Veh() {
  const { profile, loading } = useProfile();
  const [showReg, setShowReg] = useState(false);
  const [showDl, setShowDl] = useState(false);
  return <AppLayout showNav={false}><PageHeader back title="Vehicle details" subtitle="Registered vehicle information" /><div className="px-4 pt-4 pb-8 space-y-4">{loading && !profile ? <Card className="space-y-3"><Skeleton className="h-16 w-16 rounded-2xl mx-auto" /><Skeleton className="h-4 w-40 mx-auto" /></Card> : <><Card className="text-center py-6"><div className="grid place-items-center h-16 w-16 rounded-2xl gradient-primary text-primary-foreground mx-auto"><Bike className="h-8 w-8" /></div><div className="mt-3 font-bold text-lg">{profile?.vehicleType || "Vehicle not added"}</div><div className="text-xs text-muted-foreground mt-1">Registration details are protected</div></Card><Card><Row label="Type" value={profile?.vehicleType} /><Row label="Registration" value={profile?.vehicleNumber} sensitive visible={showReg} toggle={() => setShowReg(v => !v)} /><Row label="Driving licence" value={profile?.drivingLicenseNumber} sensitive visible={showDl} toggle={() => setShowDl(v => !v)} /></Card><div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">Vehicle details are read-only after partner approval and cannot be modified from the Partner app.</div></>}</div></AppLayout>;
}
