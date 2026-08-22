"use client";

import { createFileRoute, Link, useNavigate } from "@/lib/next-router-compat";
import { useRef, useState } from "react";
import { FileText, Bike, Landmark, Settings as SettingsIcon, HelpCircle, LogOut, ChevronRight, Star, Package, Award, Camera, Loader2, Pencil, KeyRound } from "lucide-react";
import { AppLayout, TopBar, RequireAuth } from "@/components/app-shell";
import { Card, Skeleton, Toggle } from "@/components/ui-bits";
import { PARTNER_PROFILE } from "@/lib/demo-data";
import { useAuth, useAvailability } from "@/lib/app-state";
import { useProfile } from "@/lib/profile-state";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile · Fresh15 Partner" },
      { name: "description", content: "Manage your profile, documents and settings." },
      { property: "og:title", content: "Profile · Fresh15 Partner" },
      { property: "og:description", content: "Manage documents, vehicle and payouts." },
    ],
  }),
  component: () => <RequireAuth><Profile /></RequireAuth>,
});

function initials(name?: string) {
  if (!name) return "P";
  return name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]!.toUpperCase()).join("");
}

function Profile() {
  const { logout, user } = useAuth();
  const { profile, loading, saveAvatar } = useProfile();
  const { online, toggle, pending: availPending } = useAvailability();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const avatarUrl = user?.profileImage || profile?.avatar || "";

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const msg = await saveAvatar(file);
      toast.success(msg);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update photo");
    } finally {
      setUploading(false);
    }
  };

  const doLogout = () => {
    logout();
    toast.success("Signed out");
    setTimeout(() => navigate({ to: "/login", replace: true }), 200);
  };

  return (
    <AppLayout>
      <TopBar />
      <div className="px-4 pt-4 space-y-5">
        {/* Profile card */}
        <Card className="animate-slide-up">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Change profile photo"
              className="relative grid place-items-center h-16 w-16 rounded-2xl gradient-primary text-primary-foreground font-bold text-xl shadow-card overflow-hidden"
            >
              {avatarUrl
                ? <img src={avatarUrl} alt={user?.name ? `${user.name} profile photo` : "Profile photo"} className="h-full w-full object-cover" />
                : initials(user?.name)}
              <span className="absolute inset-x-0 bottom-0 grid place-items-center h-5 bg-black/40">
                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
              </span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickFile} />
            <div className="flex-1 min-w-0">
              {loading && !user ? (
                <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div>
              ) : (
                <>
                  <div className="font-semibold text-lg truncate">{user?.name || "Delivery Partner"}</div>
                  <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                  <div className="text-xs text-muted-foreground truncate">{user?.phone || "Phone not added"}</div>
                </>
              )}
            </div>
            <Link to="/edit-profile" aria-label="Edit profile" className="grid place-items-center h-9 w-9 rounded-full bg-muted hover:bg-muted/70 transition-colors">
              <Pencil className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 pt-4 border-t border-border/60 grid grid-cols-3 gap-2 text-center">
            <MiniStat icon={<Star className="h-3.5 w-3.5" />} label="Rating" value={PARTNER_PROFILE.rating.toFixed(2)} />
            <MiniStat icon={<Package className="h-3.5 w-3.5" />} label="Deliveries" value={PARTNER_PROFILE.totalDeliveries} />
            <MiniStat icon={<Award className="h-3.5 w-3.5" />} label="Tier" value="Gold" />
          </div>
        </Card>

        {/* Availability quick */}
        <Card className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm">Availability</div>
            <div className="text-xs text-muted-foreground">{availPending ? "Updating…" : online ? "You're accepting orders" : "Offline · not receiving orders"}</div>
          </div>
          <Toggle checked={online} onChange={() => toggle()} disabled={availPending} label="Availability" />
        </Card>

        {/* Groups */}
        <div className="rounded-2xl bg-card border border-border/60 shadow-card overflow-hidden divide-y divide-border/60">
          <RowLink to="/documents" icon={<FileText className="h-4.5 w-4.5" />} title="Documents" subtitle={profile?.drivingLicenseNumber ? `DL ${profile.drivingLicenseNumber}` : "KYC documents"} />
          <RowLink to="/vehicle" icon={<Bike className="h-4.5 w-4.5" />} title="Vehicle details" subtitle={profile?.vehicleNumber || "Not added"} />
          <RowLink to="/bank" icon={<Landmark className="h-4.5 w-4.5" />} title="Bank details" subtitle={profile?.bankName || "Not added"} />
        </div>

        <div className="rounded-2xl bg-card border border-border/60 shadow-card overflow-hidden divide-y divide-border/60">
          <RowLink to="/change-password" icon={<KeyRound className="h-4.5 w-4.5" />} title="Change password" />
          <RowLink to="/settings" icon={<SettingsIcon className="h-4.5 w-4.5" />} title="Settings" />
          <RowLink to="/support" icon={<HelpCircle className="h-4.5 w-4.5" />} title="Help & support" />
        </div>

        <button onClick={doLogout} className="w-full flex items-center justify-center gap-2 h-13 py-3.5 rounded-2xl border border-destructive/30 text-destructive font-semibold text-sm hover:bg-destructive/5 transition-colors">
          <LogOut className="h-4 w-4" /> Sign out
        </button>

        <div className="text-center text-xs text-muted-foreground pt-2">Fresh15 Partner v1.0.0</div>
      </div>
    </AppLayout>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1 text-primary">{icon}<span className="font-bold text-sm">{value}</span></div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function RowLink({ to, icon, title, subtitle }: { to: string; icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <Link to={to as any} className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
      <div className="grid place-items-center h-9 w-9 rounded-xl bg-primary-soft text-primary shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</div>}
      </div>
      <ChevronRight className="h-4.5 w-4.5 text-muted-foreground" />
    </Link>
  );
}
