
"use client";

import { createFileRoute } from "@/lib/next-router-compat";
import { FileText, CheckCircle2, AlertTriangle, CalendarDays } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppLayout, PageHeader, RequireAuth } from "@/components/app-shell";
import { Card, EmptyState, Skeleton } from "@/components/ui-bits";
import { useAuth } from "@/lib/app-state";
import {
  getPartnerDocuments,
  updatePartnerDocument,
  type PartnerDocument,
} from "@/lib/partner-ops-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/documents")({
  head: () => ({ meta: [{ title: "Documents · Fresh15 Partner" }] }),
  component: () => <RequireAuth><Docs /></RequireAuth>,
});

const LABELS: Record<PartnerDocument["type"], string> = {
  DRIVING_LICENSE: "Driving license",
  RC: "Vehicle RC",
  INSURANCE: "Vehicle insurance",
  PAN: "PAN",
  OTHER: "Other document",
};

function Docs() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["partner-ops", "documents"],
    enabled: Boolean(token),
    queryFn: () => getPartnerDocuments(token!),
    staleTime: 30_000,
  });

  const [editing, setEditing] = useState<PartnerDocument["type"] | null>(null);
  const [number, setNumber] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const save = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error("Select a document");
      return updatePartnerDocument(token!, {
        type: editing,
        documentNumber: number.trim(),
        expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
      });
    },
    onSuccess: () => {
      setEditing(null);
      setNumber("");
      setExpiresAt("");
      void qc.invalidateQueries({ queryKey: ["partner-ops", "documents"] });
      toast.success("Document details updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update document"),
  });

  if (q.isLoading) {
    return <AppLayout showNav={false}><PageHeader back title="Documents" /><div className="space-y-3 px-4 py-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div></AppLayout>;
  }

  if (q.isError) {
    return <AppLayout showNav={false}><PageHeader back title="Documents" /><div className="px-4 py-10"><EmptyState icon={<FileText className="h-6 w-6" />} title="Couldn't load documents" desc={q.error instanceof Error ? q.error.message : "Try again."} /></div></AppLayout>;
  }

  const docs = q.data ?? [];

  return (
    <AppLayout showNav={false}>
      <PageHeader back title="Documents" subtitle="Keep your KYC and vehicle documents current" />
      <div className="space-y-3 px-4 py-4 pb-8">
        {docs.map((d) => {
          const danger = d.expiryState === "EXPIRED";
          const warning = d.expiryState === "EXPIRING_SOON" || d.expiryState === "NOT_SET";

          return (
            <Card key={d._id} className={cn(danger && "border-destructive/30 bg-destructive/5", warning && !danger && "border-amber-500/30 bg-amber-500/5")}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "grid h-11 w-11 place-items-center rounded-xl shrink-0",
                  danger ? "bg-destructive/15 text-destructive" : warning ? "bg-amber-500/15 text-amber-700" : "bg-success/15 text-success",
                )}>
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{LABELS[d.type]}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {d.documentNumber || "Document number not added"}
                  </div>
                  <div className={cn("mt-1 flex items-center gap-1 text-[11px]", danger ? "text-destructive" : warning ? "text-amber-700" : "text-success")}>
                    {danger ? <AlertTriangle className="h-3 w-3" /> : warning ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                    {d.expiryState === "NOT_SET"
                      ? "Expiry date not set"
                      : d.expiryState === "EXPIRED"
                        ? `Expired ${Math.abs(d.daysRemaining ?? 0)} day(s) ago`
                        : d.expiryState === "EXPIRING_SOON"
                          ? `Expires in ${d.daysRemaining} day(s)`
                          : `Valid until ${new Date(d.expiresAt!).toLocaleDateString("en-IN")}`}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditing(d.type);
                    setNumber(d.documentNumber ?? "");
                    setExpiresAt(d.expiresAt ? new Date(d.expiresAt).toISOString().slice(0, 10) : "");
                  }}
                  className="rounded-full bg-muted px-3 py-2 text-xs font-semibold"
                >
                  Update
                </button>
              </div>
            </Card>
          );
        })}

        {editing && (
          <Card className="border-primary/30 bg-primary/5">
            <div className="font-semibold">{LABELS[editing]}</div>
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Document number"
              className="mt-3 h-11 w-full rounded-xl border bg-background px-3 text-sm"
            />
            <label className="mt-2 block text-xs font-semibold">
              Expiry date
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-sm"
              />
            </label>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setEditing(null)} className="h-10 flex-1 rounded-xl border text-sm font-semibold">Cancel</button>
              <button onClick={() => save.mutate()} disabled={save.isPending} className="h-10 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60">
                {save.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </Card>
        )}

        <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground flex gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
          Fresh15 flags documents that are expired or due within 30 days so you can renew them before they block deliveries.
        </div>
      </div>
    </AppLayout>
  );
}
