"use client";

import { createFileRoute } from "@/lib/next-router-compat";
import { FileText, CheckCircle2, AlertTriangle, Upload } from "lucide-react";
import { AppLayout, PageHeader, RequireAuth } from "@/components/app-shell";
import { Card } from "@/components/ui-bits";
import { PARTNER_PROFILE } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/documents")({
  head: () => ({ meta: [{ title: "Documents · Fresh15 Partner" }] }),
  component: () => <RequireAuth><Docs /></RequireAuth>,
});

function Docs() {
  return (
    <AppLayout showNav={false}>
      <PageHeader back title="Documents" subtitle="Keep your KYC up to date" />
      <div className="px-4 pt-4 pb-8 space-y-3">
        {PARTNER_PROFILE.documents.map(d => {
          const verified = d.status === "verified";
          const expiring = d.status === "expiring";
          return (
            <Card key={d.id} className="flex items-center gap-3">
              <div className={cn(
                "grid place-items-center h-11 w-11 rounded-xl shrink-0",
                verified ? "bg-success/15 text-success" : expiring ? "bg-warning/20 text-warning-foreground" : "bg-destructive/15 text-destructive"
              )}>
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{d.name}</div>
                <div className="text-xs text-muted-foreground">
                  {verified ? <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Verified</span>
                    : expiring ? <span className="inline-flex items-center gap-1 text-warning-foreground"><AlertTriangle className="h-3 w-3" /> Expires soon</span>
                    : "Missing"}
                  {d.expires && ` · ${new Date(d.expires).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                </div>
              </div>
              <button onClick={() => toast("Upload mock")} className="h-9 px-3 rounded-full bg-muted text-xs font-semibold hover:bg-muted/70 inline-flex items-center gap-1">
                <Upload className="h-3.5 w-3.5" /> Update
              </button>
            </Card>
          );
        })}
      </div>
    </AppLayout>
  );
}
