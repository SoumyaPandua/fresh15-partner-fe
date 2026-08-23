
"use client";

import { createFileRoute } from "@/lib/next-router-compat";
import { AlertTriangle, ClipboardList, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppLayout, PageHeader, RequireAuth } from "@/components/app-shell";
import { Card, EmptyState, Skeleton } from "@/components/ui-bits";
import { useAuth } from "@/lib/app-state";
import { createPartnerIncident, getPartnerIncidents, type PartnerIncident } from "@/lib/partner-ops-api";

export const Route = createFileRoute("/incidents")({
  head: () => ({ meta: [{ title: "Report incident · Fresh15 Partner" }] }),
  component: () => <RequireAuth><Incidents /></RequireAuth>,
});

function Incidents() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [type, setType] = useState<PartnerIncident["type"]>("SAFETY");
  const [severity, setSeverity] = useState<PartnerIncident["severity"]>("MEDIUM");
  const [description, setDescription] = useState("");

  const q = useQuery({
    queryKey: ["partner-ops", "incidents"],
    enabled: Boolean(token),
    queryFn: () => getPartnerIncidents(token!),
    staleTime: 5_000,
  });

  const create = useMutation({
    mutationFn: () => {
      if (!description.trim()) throw new Error("Describe what happened");
      return createPartnerIncident(token!, {
        type,
        severity,
        description: description.trim(),
      });
    },
    onSuccess: () => {
      setDescription("");
      void qc.invalidateQueries({ queryKey: ["partner-ops", "incidents"] });
      toast.success("Incident reported to Fresh15");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not report incident"),
  });

  return (
    <AppLayout showNav={false}>
      <PageHeader back title="Report incident" subtitle="Safety, customer, vehicle or app issues" />
      <div className="space-y-4 px-4 py-4 pb-8">
        <Card className="border-destructive/20 bg-destructive/5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold">For immediate danger</div>
              <div className="mt-1 text-xs text-muted-foreground">Move to a safe place first. This report creates an operations record; it is not an emergency service.</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 font-semibold"><ClipboardList className="h-4 w-4 text-primary" /> New report</div>
          <div className="mt-3 grid gap-2">
            <select value={type} onChange={(e) => setType(e.target.value as PartnerIncident["type"])} className="h-11 rounded-xl border bg-background px-3 text-sm">
              <option value="SAFETY">Safety</option>
              <option value="CUSTOMER">Customer</option>
              <option value="VEHICLE">Vehicle</option>
              <option value="PAYMENT">Payment</option>
              <option value="APP">App / technical</option>
              <option value="ACCIDENT">Accident</option>
              <option value="OTHER">Other</option>
            </select>
            <select value={severity} onChange={(e) => setSeverity(e.target.value as PartnerIncident["severity"])} className="h-11 rounded-xl border bg-background px-3 text-sm">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={5}
              placeholder="What happened? Include the order/customer context if relevant."
              className="rounded-xl border bg-background px-3 py-3 text-sm"
            />
            <button
              onClick={() => create.mutate()}
              disabled={create.isPending || !description.trim()}
              className="h-11 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {create.isPending ? "Submitting…" : "Submit incident"}
            </button>
          </div>
        </Card>

        <section>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-primary" /> Previous reports</div>
          {q.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : q.isError ? (
            <EmptyState icon={<AlertTriangle className="h-6 w-6" />} title="Couldn't load reports" desc={q.error instanceof Error ? q.error.message : "Try again."} />
          ) : !q.data?.length ? (
            <Card className="py-8 text-center text-sm text-muted-foreground">No incidents reported.</Card>
          ) : (
            <div className="space-y-2">
              {q.data.map((x) => (
                <Card key={x._id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{x.type.replaceAll("_", " ")} · {x.severity}</div>
                      <div className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{x.description}</div>
                      <div className="mt-2 text-[11px] text-muted-foreground">{new Date(x.createdAt).toLocaleString("en-IN")}</div>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[10px] font-semibold">{x.status.replaceAll("_", " ")}</span>
                  </div>
                  {x.resolutionNote && <div className="mt-2 rounded-lg bg-success/10 p-2 text-xs text-success">{x.resolutionNote}</div>}
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
