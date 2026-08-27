"use client";

import { createFileRoute, Link, useNavigate } from "@/lib/next-router-compat";
import { useState } from "react";
import { ArrowRight, Bike, CarFront, Lock, Mail, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";
import { registerPartner, type PartnerRegistrationInput } from "@/lib/partner-registration-api";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Become a Partner · Fresh15" }] }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState<PartnerRegistrationInput>({
    name: "", email: "", phone: "", password: "", vehicleType: "BIKE", vehicleRegistrationNumber: "", vehicleMakeModel: "",
  });
  const [loading, setLoading] = useState(false);
  const update = (key: keyof PartnerRegistrationInput, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.password.length < 8) return toast.error("Password must be at least 8 characters");
    setLoading(true);
    try {
      await registerPartner(form);
      sessionStorage.setItem("fresh15-partner-register-email", form.email.trim().toLowerCase());
      toast.success("Application submitted. Verify your email next.");
      navigate({ to: "/verify-registration" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl gradient-primary font-bold text-primary-foreground">F15</div>
          <div><div className="text-xs uppercase tracking-widest text-muted-foreground">Fresh15</div><div className="font-semibold">Delivery Partner Application</div></div>
        </div>

        <div className="rounded-3xl border bg-card p-6 shadow-elevated md:p-8">
          <h1 className="text-2xl font-bold">Become a Fresh15 partner</h1>
          <p className="mt-2 text-sm text-muted-foreground">Register your details and vehicle. After email verification, an admin reviews your application before you can accept deliveries.</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <Field icon={<UserRound className="h-4 w-4" />} placeholder="Full name" value={form.name} onChange={(v) => update("name", v)} />
            <Field icon={<Mail className="h-4 w-4" />} type="email" placeholder="Email" value={form.email} onChange={(v) => update("email", v)} />
            <Field icon={<Phone className="h-4 w-4" />} placeholder="Phone number" value={form.phone} onChange={(v) => update("phone", v)} />
            <Field icon={<Lock className="h-4 w-4" />} type="password" placeholder="Password (8+ characters)" value={form.password} onChange={(v) => update("password", v)} />

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vehicle type</label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {(["BIKE", "SCOOTER", "CAR", "EV_BIKE", "OTHER"] as const).map((type) => (
                  <button key={type} type="button" onClick={() => update("vehicleType", type)} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${form.vehicleType === type ? "border-primary bg-primary/10 text-primary" : "bg-background"}`}>
                    {type.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            <Field icon={<Bike className="h-4 w-4" />} placeholder="Vehicle registration number" value={form.vehicleRegistrationNumber} onChange={(v) => update("vehicleRegistrationNumber", v.toUpperCase())} />
            <Field icon={<CarFront className="h-4 w-4" />} placeholder="Vehicle make / model (optional)" value={form.vehicleMakeModel || ""} onChange={(v) => update("vehicleMakeModel", v)} />

            <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl gradient-primary font-semibold text-primary-foreground disabled:opacity-60">
              {loading ? "Submitting…" : <>Submit application <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">Already registered? <Link className="font-semibold text-primary" to="/login">Sign in</Link></div>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, type = "text", placeholder, value, onChange }: { icon: React.ReactNode; type?: string; placeholder: string; value: string; onChange: (value: string) => void }) {
  return <div className="flex h-12 items-center gap-2 rounded-xl border bg-background px-3"><span className="text-muted-foreground">{icon}</span><input required type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" /></div>;
}
