"use client";

import { createFileRoute } from "@/lib/next-router-compat";
import { MessageCircle, Phone, Mail, HelpCircle, ChevronDown } from "lucide-react";
import { useState } from "react";
import { AppLayout, PageHeader, RequireAuth } from "@/components/app-shell";
import { Card } from "@/components/ui-bits";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Support · Fresh15 Partner" }] }),
  component: () => <RequireAuth><Support /></RequireAuth>,
});

const FAQS = [
  { q: "How do I get paid?", a: "Earnings are settled to your registered bank account every Monday. You can also request an instant payout from the Wallet screen." },
  { q: "What if the customer isn't reachable?", a: "Wait 5 minutes and try calling twice. If still unreachable, mark the order via the app and support will contact them." },
  { q: "How do incentives work?", a: "Complete the target set for each incentive within the window to earn extra rewards. Progress updates in real time." },
  { q: "Can I change my vehicle?", a: "Yes. Go to Profile → Vehicle details and submit updated documents for verification." },
];

function Support() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <AppLayout showNav={false}>
      <PageHeader back title="Help & support" />
      <div className="px-4 pt-4 pb-8 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <ContactBtn icon={<Phone className="h-5 w-5" />} label="Call" onClick={() => toast("Calling support...")} />
          <ContactBtn icon={<MessageCircle className="h-5 w-5" />} label="Chat" onClick={() => toast("Opening chat...")} />
          <ContactBtn icon={<Mail className="h-5 w-5" />} label="Email" onClick={() => toast("Draft opened")} />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Frequently asked</h2>
          </div>
          <Card className="p-0 divide-y divide-border/60 overflow-hidden">
            {FAQS.map((f, i) => (
              <button key={i} onClick={() => setOpen(open === i ? null : i)} className="w-full text-left p-4 hover:bg-muted/40 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">{f.q}</div>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", open === i && "rotate-180")} />
                </div>
                <div className={cn("grid transition-all", open === i ? "grid-rows-[1fr] mt-2" : "grid-rows-[0fr]")}>
                  <div className="overflow-hidden">
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.a}</p>
                  </div>
                </div>
              </button>
            ))}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function ContactBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border/60 shadow-card hover:shadow-elevated hover:border-primary/40 transition-all active:scale-95">
      <div className="grid place-items-center h-11 w-11 rounded-xl bg-primary-soft text-primary">{icon}</div>
      <div className="text-xs font-semibold">{label}</div>
    </button>
  );
}
