"use client";

import { createFileRoute, useNavigate } from "@/lib/next-router-compat";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppLayout, PageHeader, RequireAuth } from "@/components/app-shell";
import { Card } from "@/components/ui-bits";
import { useAuth } from "@/lib/app-state";
import { useProfile } from "@/lib/profile-state";
import { toast } from "sonner";

export const Route = createFileRoute("/edit-profile")({
  head: () => ({ meta: [{ title: "Edit profile · Fresh15 Partner" }] }),
  component: () => <RequireAuth><EditProfile /></RequireAuth>,
});

const FIELD =
  "w-full h-12 px-4 rounded-xl bg-muted/60 border border-border/60 text-sm outline-none focus:border-primary/60 focus:bg-card transition-colors";

function Field({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input {...rest} className={FIELD + " mt-1.5"} />
    </label>
  );
}

function EditProfile() {
  const { user } = useAuth();
  const { profile, save, loading } = useProfile();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", gender: "", dob: "",
    vehicleType: "", vehicleNumber: "", drivingLicenseNumber: "",
    bankName: "", accountHolderName: "", accountNumber: "", ifscCode: "",
  });

  useEffect(() => {
    setForm({
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      gender: profile?.gender ?? "",
      dob: profile?.dob ? String(profile.dob).slice(0, 10) : "",
      vehicleType: profile?.vehicleType ?? "",
      vehicleNumber: profile?.vehicleNumber ?? "",
      drivingLicenseNumber: profile?.drivingLicenseNumber ?? "",
      bankName: profile?.bankName ?? "",
      accountHolderName: profile?.accountHolderName ?? "",
      accountNumber: profile?.accountNumber ?? "",
      ifscCode: profile?.ifscCode ?? "",
    });
  }, [user, profile]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.email.trim()) return toast.error("Email is required");
    setSaving(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => String(v).trim() !== ""),
      );
      const msg = await save(payload);
      toast.success(msg);
      navigate({ to: "/profile" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout showNav={false}>
      <PageHeader back title="Edit profile" subtitle="Keep your details up to date" />
      <form onSubmit={onSubmit} className="px-4 pt-4 pb-8 space-y-4">
        <Card className="space-y-4">
          <div className="text-sm font-semibold">Personal</div>
          <Field label="Full name" value={form.name} onChange={set("name")} placeholder="Your name" />
          <Field label="Email" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
          <Field label="Phone" value={form.phone} onChange={set("phone")} placeholder="9876543210" inputMode="tel" />
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Gender</span>
            <select value={form.gender} onChange={set("gender")} className={FIELD + " mt-1.5"}>
              <option value="">Not specified</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <Field label="Date of birth" type="date" value={form.dob} onChange={set("dob")} />
        </Card>

        <Card className="space-y-4">
          <div className="text-sm font-semibold">Vehicle & licence</div>
          <Field label="Vehicle type" value={form.vehicleType} onChange={set("vehicleType")} placeholder="Bike" />
          <Field label="Vehicle number" value={form.vehicleNumber} onChange={set("vehicleNumber")} placeholder="MH12AB1234" />
          <Field label="Driving licence number" value={form.drivingLicenseNumber} onChange={set("drivingLicenseNumber")} placeholder="MH123456789" />
        </Card>

        <Card className="space-y-4">
          <div className="text-sm font-semibold">Bank details</div>
          <Field label="Bank name" value={form.bankName} onChange={set("bankName")} placeholder="HDFC Bank" />
          <Field label="Account holder" value={form.accountHolderName} onChange={set("accountHolderName")} />
          <Field label="Account number" value={form.accountNumber} onChange={set("accountNumber")} inputMode="numeric" />
          <Field label="IFSC code" value={form.ifscCode} onChange={set("ifscCode")} placeholder="HDFC0001234" />
        </Card>

        <button
          type="submit"
          disabled={saving || loading}
          className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-semibold text-sm shadow-elevated inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
        </button>
      </form>
    </AppLayout>
  );
}
