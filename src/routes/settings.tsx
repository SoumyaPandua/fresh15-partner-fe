"use client";

import { createFileRoute, useNavigate } from "@/lib/next-router-compat";
import { Moon, Bell, Volume2, Fingerprint, LogOut, Save } from "lucide-react";
import { AppLayout, PageHeader, RequireAuth } from "@/components/app-shell";
import { Toggle } from "@/components/ui-bits";
import { useAuth, useTheme } from "@/lib/app-state";
import { toast } from "sonner";
import { useEffect, useState } from "react";

const KEY = "fresh15-partner-settings";

type SettingsState = { notifications: boolean; sounds: boolean; biometric: boolean };
const defaults: SettingsState = { notifications: true, sounds: true, biometric: false };

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Fresh15 Partner" }] }),
  component: () => <RequireAuth><Settings /></RequireAuth>,
});

function Settings() {
  const { theme, toggle } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SettingsState>(defaults);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSettings({ ...defaults, ...JSON.parse(raw) });
    } catch {
      setSettings(defaults);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(settings));
  }, [ready, settings]);

  const update = (key: keyof SettingsState) => setSettings((current) => ({ ...current, [key]: !current[key] }));

  const doLogout = () => {
    logout();
    toast.success("Signed out");
    void navigate({ to: "/login", replace: true });
  };

  return (
    <AppLayout showNav={false}>
      <PageHeader back title="Settings" />
      <div className="space-y-5 px-4 pb-8 pt-4">
        <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
          <SwitchRow icon={<Moon className="h-4.5 w-4.5" />} title="Dark mode" desc="Reduce glare at night" on={theme === "dark"} onToggle={toggle} />
          <SwitchRow icon={<Bell className="h-4.5 w-4.5" />} title="Push notifications" desc="Order & payout alerts" on={settings.notifications} onToggle={() => update("notifications")} />
          <SwitchRow icon={<Volume2 className="h-4.5 w-4.5" />} title="Order sounds" desc="Play chime for new orders" on={settings.sounds} onToggle={() => update("sounds")} />
          <SwitchRow icon={<Fingerprint className="h-4.5 w-4.5" />} title="Biometric login" desc="Use device biometrics when supported" on={settings.biometric} onToggle={() => update("biometric")} />
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-4 text-xs text-muted-foreground">
          <Save className="mb-2 h-4 w-4 text-primary" />
          Partner preferences are stored on this device and survive refreshes.
        </div>

        <button onClick={doLogout} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 py-3.5 text-sm font-semibold text-destructive hover:bg-destructive/5">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </AppLayout>
  );
}

function SwitchRow({ icon, title, desc, on, onToggle }: { icon?: React.ReactNode; title: string; desc?: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-3 p-4">
      {icon && <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">{icon}</div>}
      <div className="min-w-0 flex-1"><div className="text-sm font-medium">{title}</div><div className="truncate text-xs text-muted-foreground">{desc}</div></div>
      <Toggle checked={on} onChange={onToggle} label={title} />
    </div>
  );
}
