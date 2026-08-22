"use client";

import { createFileRoute } from "@/lib/next-router-compat";
import { Wallet as WalletIcon, Zap, Gift, ArrowDownLeft, AlertCircle } from "lucide-react";
import { useState } from "react";
import { AppLayout, TopBar, RequireAuth } from "@/components/app-shell";
import { Card, SectionTitle, Skeleton, EmptyState } from "@/components/ui-bits";
import { INCENTIVES } from "@/lib/demo-data";
import { useMyDeliveries } from "@/lib/delivery-queries";
import { computeStats } from "@/lib/delivery-stats";
import { formatDateTime, formatMoney, getEarning, getOrderNumber, type Delivery } from "@/lib/delivery-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet · Fresh15 Partner" },
      { name: "description", content: "Balance, payouts and incentives." },
      { property: "og:title", content: "Wallet · Fresh15 Partner" },
      { property: "og:description", content: "Track balance, payouts and incentives." },
    ],
  }),
  component: () => <RequireAuth><Wallet /></RequireAuth>,
});

const TABS = ["Earnings", "Payouts", "Incentives"] as const;

function Wallet() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Earnings");
  const { data, isLoading, isError, error } = useMyDeliveries();
  const deliveries = data ?? [];
  const stats = computeStats(deliveries);
  const delivered = deliveries
    .filter(d => d.status === "DELIVERED")
    .sort((a, b) => new Date(b.deliveredAt ?? b.updatedAt ?? 0).getTime() - new Date(a.deliveredAt ?? a.updatedAt ?? 0).getTime());

  return (
    <AppLayout>
      <TopBar />
      <div className="px-4 pt-4 space-y-6">
        {/* Balance hero */}
        <div className="rounded-3xl gradient-primary text-primary-foreground p-6 shadow-elevated overflow-hidden relative animate-slide-up">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -right-4 -bottom-12 h-32 w-32 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-90">
              <WalletIcon className="h-3.5 w-3.5" /> Total earnings
            </div>
            <div className="mt-1 text-4xl font-bold">{formatMoney(stats.totalEarnings)}</div>
            <div className="mt-1 text-xs opacity-80">
              {stats.totalDeliveries} completed deliveries · {formatMoney(stats.todayEarnings)} today
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-full">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("flex-1 h-10 rounded-full text-sm font-semibold transition-all", tab === t ? "bg-card text-foreground shadow-card" : "text-muted-foreground")}>
              {t}
            </button>
          ))}
        </div>

        {tab === "Earnings" && (
          isLoading ? <Skeleton className="h-24 w-full" /> :
          isError ? (
            <EmptyState
              icon={<AlertCircle className="h-6 w-6" />}
              title="Couldn't load earnings"
              desc={error instanceof Error ? error.message : "Please try again."}
            />
          ) : <EarningsList items={delivered} />
        )}

        {tab === "Payouts" && (
          <Card className="text-center text-sm text-muted-foreground py-8">
            Payout history isn't available yet — earnings are settled by the Fresh15 finance team.
          </Card>
        )}

        {tab === "Incentives" && <IncentivesList />}
      </div>
    </AppLayout>
  );
}

function EarningsList({ items }: { items: Delivery[] }) {
  if (items.length === 0) {
    return <Card className="text-center text-sm text-muted-foreground py-8">No earnings yet — complete a delivery to get started.</Card>;
  }
  return (
    <div className="space-y-2">
      {items.map(d => (
        <Card key={d._id} className="flex items-center gap-3 p-3.5">
          <div className="grid place-items-center h-11 w-11 rounded-xl shrink-0 bg-primary-soft text-primary">
            <ArrowDownLeft className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">Delivery {getOrderNumber(d)}</div>
            <div className="text-xs text-muted-foreground">{formatDateTime(d.deliveredAt ?? d.updatedAt)}</div>
          </div>
          <div className="text-sm font-bold shrink-0 text-primary">+{formatMoney(getEarning(d))}</div>
        </Card>
      ))}
    </div>
  );
}

function IncentivesList() {
  return (
    <div className="space-y-3">
      <SectionTitle>Active this week</SectionTitle>
      {INCENTIVES.map(i => {
        const pct = Math.min(100, (i.progress / i.target) * 100);
        return (
          <Card key={i.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent shrink-0" />
                  <div className="text-sm font-semibold truncate">{i.title}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{i.progress}/{i.target} · {Math.round(pct)}%</div>
              </div>
              <div className="text-lg font-bold text-primary shrink-0">+₹{i.reward}</div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </Card>
        );
      })}

      <Card className="gradient-warm text-white border-transparent">
        <div className="flex items-center gap-3">
          <Gift className="h-8 w-8" />
          <div>
            <div className="font-semibold">Referral bonus</div>
            <div className="text-xs opacity-90">Earn ₹1,000 for every partner who joins with your code</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
