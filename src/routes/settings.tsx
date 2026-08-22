"use client";

import { createFileRoute, useNavigate } from "@/lib/next-router-compat";
import { Moon, Bell, Globe, Volume2, Fingerprint, LogOut, ChevronRight } from "lucide-react";
import { AppLayout, PageHeader, RequireAuth } from "@/components/app-shell";
import { Card, Toggle } from "@/components/ui-bits";
import { useAuth, useTheme } from "@/lib/app-state";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Fresh15 Partner" }] }),
  component: () => <RequireAuth><Settings /></RequireAuth>,
});

function Settings() {
  const { theme, toggle } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [notif, setNotif] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [bio, setBio] = useState(false);

  const doLogout = () => {
    logout();
    toast.success("Signed out");
    setTimeout(() => navigate({ to: "/login", replace: true }), 200);
  };

  return (
    <AppLayout showNav={false}>
      <PageHeader back title="Settings" />
      <div className="px-4 pt-4 pb-8 space-y-5">
        <div className="rounded-2xl bg-card border border-border/60 shadow-card overflow-hidden divide-y divide-border/60">
          <SwitchRow icon={<Moon className="h-4.5 w-4.5" />} title="Dark mode" desc="Reduce glare at night" on={theme === "dark"} onToggle={toggle} />
          <SwitchRow icon={<Bell className="h-4.5 w-4.5" />} title="Push notifications" desc="Order & payout alerts" on={notif} onToggle={() => setNotif(v => !v)} />
          <SwitchRow icon={<Volume2 className="h-4.5 w-4.5" />} title="Order sounds" desc="Play chime for new orders" on={sounds} onToggle={() => setSounds(v => !v)} />
          <SwitchRow icon={<Fingerprint className="h-4.5 w-4.5" />} title="Biometric login" desc="Sign in with fingerprint" on={bio} onToggle={() => setBio(v => !v)} />
        </div>

        <div className="rounded-2xl bg-card border border-border/60 shadow-card overflow-hidden divide-y divide-border/60">
          <StaticRow icon={<Globe className="h-4.5 w-4.5" />} title="Language" value="English" />
          <StaticRow title="App version" value="1.0.0" />
        </div>

        <button onClick={doLogout} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-destructive/30 text-destructive font-semibold text-sm hover:bg-destructive/5 transition-colors">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </AppLayout>
  );
}

function SwitchRow({ icon, title, desc, on, onToggle }: { icon?: React.ReactNode; title: string; desc?: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-3 p-4">
      {icon && <div className="grid place-items-center h-9 w-9 rounded-xl bg-primary-soft text-primary shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title}</div>
        {desc && <div className="text-xs text-muted-foreground truncate">{desc}</div>}
      </div>
      <Toggle checked={on} onChange={() => onToggle()} label={title} />
    </div>
  );
}
function StaticRow({ icon, title, value }: { icon?: React.ReactNode; title: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-4">
      {icon && <div className="grid place-items-center h-9 w-9 rounded-xl bg-primary-soft text-primary shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title}</div>
      </div>
      <div className="text-sm text-muted-foreground">{value}</div>
    </div>
  );
}
