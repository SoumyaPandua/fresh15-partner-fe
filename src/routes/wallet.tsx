
"use client";

import { createFileRoute } from "@/lib/next-router-compat";
import { Wallet as WalletIcon, Zap, ArrowDownLeft, AlertCircle, Gift, ReceiptText } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout, TopBar, RequireAuth } from "@/components/app-shell";
import { Card, SectionTitle, Skeleton, EmptyState } from "@/components/ui-bits";
import { useAuth } from "@/lib/app-state";
import { getPartnerEarnings, type EarningsLedgerEntry } from "@/lib/partner-ops-api";
import { formatDateTime, formatMoney } from "@/lib/delivery-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet · Fresh15 Partner" },
      { name: "description", content: "Order earnings, incentives and adjustments." },
    ],
  }),
  component: () => <RequireAuth><Wallet /></RequireAuth>,
});

const TABS = ["Earnings", "Incentives"] as const;

function Wallet() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Earnings");
  const { token } = useAuth();

  const q = useQuery({
    queryKey: ["partner-ops", "earnings"],
    enabled: Boolean(token),
    queryFn: () => getPartnerEarnings(token!),
    staleTime: 10_000,
  });

  const data = q.data;

  return (
    <AppLayout>
      <TopBar />
      <div className="px-4 pt-4 space-y-6">
        {q.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : q.isError || !data ? (
          <EmptyState icon={<AlertCircle className="h-6 w-6" />} title="Couldn't load earnings" desc={q.error instanceof Error ? q.error.message : "Please try again."} />
        ) : (
          <>
            <div className="rounded-3xl gradient-primary text-primary-foreground p-6 shadow-elevated overflow-hidden relative">
              <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
              <div className="relative">
                <div className="text-xs uppercase tracking-widest opacity-90">Last 30 days</div>
                <div className="mt-1 text-4xl font-bold">{formatMoney(data.totals.total)}</div>
                <div className="mt-2 text-xs opacity-80">Orders {formatMoney(data.totals.orders)} · Incentives {formatMoney(data.totals.incentives)}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Kpi label="Orders" value={formatMoney(data.totals.orders)} />
              <Kpi label="Incentives" value={formatMoney(data.totals.incentives)} />
              <Kpi label="Adjustments" value={formatMoney(data.totals.adjustments)} />
            </div>

            <div className="flex gap-1 p-1 bg-muted rounded-full">
              {TABS.map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn("flex-1 h-10 rounded-full text-sm font-semibold transition-all", tab === t ? "bg-card text-foreground shadow-card" : "text-muted-foreground")}
                >{t}</button>
              ))}
            </div>

            {tab === "Earnings" ? (
              <section>
                <SectionTitle>Order-by-order earnings</SectionTitle>
                <Ledger items={data.ledger.filter(x => x.type !== "INCENTIVE")} />
              </section>
            ) : (
              <section className="space-y-4">
                <div>
                  <SectionTitle>Live incentives</SectionTitle>
                  {data.activeIncentives.length ? (
                    <div className="space-y-2">
                      {data.activeIncentives.map((i) => {
                        const pct = Math.min(100, Math.round((i.progress / Math.max(1, i.targetDeliveries)) * 100));
                        return (
                          <Card key={i._id}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <Zap className="h-4 w-4 text-primary shrink-0" />
                                  <div className="text-sm font-semibold truncate">{i.title}</div>
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {i.progress}/{i.targetDeliveries} deliveries · {formatMoney(i.amount)} reward
                                </div>
                              </div>
                              <div className="text-xs font-bold text-primary">{pct}%</div>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                              <div className="h-full gradient-primary" style={{ width: `${pct}%` }} />
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <Card className="py-6 text-center text-sm text-muted-foreground">No active incentives right now.</Card>
                  )}
                </div>
                <div>
                  <SectionTitle>Reward history</SectionTitle>
                  <Ledger items={data.ledger.filter(x => x.type === "INCENTIVE")} />
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

function Ledger({ items }: { items: EarningsLedgerEntry[] }) {
  if (!items.length) return <Card className="py-8 text-center text-sm text-muted-foreground">No entries yet.</Card>;

  return (
    <div className="space-y-2">
      {items.map((x) => (
        <Card key={x._id} className="flex items-center gap-3 p-3.5">
          <div className={cn("grid h-11 w-11 rounded-xl place-items-center shrink-0", x.type === "INCENTIVE" ? "bg-accent/15 text-accent-foreground" : "bg-primary-soft text-primary")}>
            {x.type === "INCENTIVE" ? <Gift className="h-5 w-5" /> : x.type === "ADJUSTMENT" ? <ReceiptText className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{x.title}</div>
            <div className="text-xs text-muted-foreground">{x.description || "Partner earning"} · {formatDateTime(x.createdAt)}</div>
          </div>
          <div className="text-sm font-bold text-primary shrink-0">+{formatMoney(x.amount)}</div>
        </Card>
      ))}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-2xl border bg-card p-3 text-center"><div className="text-sm font-bold">{value}</div><div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div></div>;
}
