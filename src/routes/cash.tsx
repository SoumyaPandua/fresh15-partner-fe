
"use client";

import { createFileRoute } from "@/lib/next-router-compat";
import { Banknote, CheckCircle2, ClipboardCheck, History } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppLayout, PageHeader, RequireAuth } from "@/components/app-shell";
import { Card, EmptyState, Skeleton } from "@/components/ui-bits";
import { useAuth } from "@/lib/app-state";
import { getPartnerCash, reconcilePartnerCash } from "@/lib/partner-ops-api";
import { formatMoney } from "@/lib/delivery-api";

export const Route = createFileRoute("/cash")({
  head: () => ({ meta: [{ title: "Cash in Hand · Fresh15 Partner" }] }),
  component: () => <RequireAuth><Cash /></RequireAuth>,
});

function Cash() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const q = useQuery({
    queryKey: ["partner-ops", "cash"],
    enabled: Boolean(token),
    queryFn: () => getPartnerCash(token!),
    staleTime: 5_000,
  });

  const reconcile = useMutation({
    mutationFn: () => {
      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0) throw new Error("Enter a valid amount");
      return reconcilePartnerCash(token!, value, note.trim());
    },
    onSuccess: () => {
      setAmount("");
      setNote("");
      void qc.invalidateQueries({ queryKey: ["partner-ops", "cash"] });
      void qc.invalidateQueries({ queryKey: ["partner-ops", "overview"] });
      toast.success("Cash reconciliation recorded");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not reconcile cash"),
  });

  if (q.isLoading) {
    return <AppLayout showNav={false}><PageHeader back title="Cash in hand" /><div className="px-4 py-4"><Skeleton className="h-52 w-full" /></div></AppLayout>;
  }

  if (q.isError || !q.data) {
    return <AppLayout showNav={false}><PageHeader back title="Cash in hand" /><div className="px-4 py-10"><EmptyState icon={<Banknote className="h-6 w-6" />} title="Couldn't load cash" desc={q.error instanceof Error ? q.error.message : "Try again."} /></div></AppLayout>;
  }

  const d = q.data;

  return (
    <AppLayout showNav={false}>
      <PageHeader back title="Cash in hand" subtitle="COD collection and reconciliation" />
      <div className="space-y-4 px-4 py-4 pb-8">
        <Card className="gradient-primary text-primary-foreground">
          <div className="text-xs uppercase tracking-widest opacity-80">Current cash in hand</div>
          <div className="mt-1 text-4xl font-bold">{formatMoney(d.cashInHand)}</div>
          <div className="mt-2 text-xs opacity-80">Collected {formatMoney(d.totalCollected)} · Reconciled {formatMoney(d.totalReconciled)}</div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 font-semibold">
            <ClipboardCheck className="h-4 w-4 text-primary" /> Reconcile cash
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Record cash handed over to Fresh15. The server prevents reconciliation above your current balance.</p>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            placeholder="Amount"
            className="mt-3 h-11 w-full rounded-xl border bg-background px-3 text-sm"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            placeholder="Optional note / handover reference"
            className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm"
          />
          <button
            onClick={() => reconcile.mutate()}
            disabled={reconcile.isPending || d.cashInHand <= 0}
            className="mt-3 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {reconcile.isPending ? "Saving…" : `Reconcile ${formatMoney(Number(amount) || 0)}`}
          </button>
        </Card>

        <Card>
          <div className="flex items-center gap-2 font-semibold"><History className="h-4 w-4 text-primary" /> Recent cash activity</div>
          <div className="mt-3 divide-y">
            {d.ledger.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No cash activity yet.</div>
            ) : d.ledger.map((x) => (
              <div key={x._id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <div className="text-sm font-semibold">{x.type === "COD_COLLECTION" ? "COD collected" : x.type === "RECONCILIATION" ? "Cash reconciled" : "Cash adjustment"}</div>
                  <div className="text-xs text-muted-foreground">
                    {x.orderId && typeof x.orderId === "object" ? x.orderId.orderNumber : "Fresh15"} ·{" "}
                    {new Date(x.createdAt).toLocaleString("en-IN")}
                  </div>
                </div>
                <div className={x.type === "RECONCILIATION" ? "font-bold text-success" : "font-bold text-foreground"}>
                  {x.type === "RECONCILIATION" ? "−" : "+"}{formatMoney(Math.abs(x.amount))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground flex gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
          Every COD collection is automatically recorded against the delivery. Never reconcile more than the cash you physically hand over.
        </div>
      </div>
    </AppLayout>
  );
}
