"use client";

import { createFileRoute, Link } from "@/lib/next-router-compat";
import { Package, AlertCircle } from "lucide-react";
import { useState } from "react";
import { AppLayout, TopBar, RequireAuth } from "@/components/app-shell";
import { Card, EmptyState, SectionTitle, Skeleton } from "@/components/ui-bits";
import { StatusBadge } from "@/components/order-bits";
import { useMyDeliveries } from "@/lib/delivery-queries";
import {
  CLOSED_STATUSES,
  formatAddress,
  formatMoney,
  getAddress,
  getCustomerName,
  getEarning,
  getOrderNumber,
  isActive,
  type Delivery,
} from "@/lib/delivery-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/deliveries")({
  head: () => ({
    meta: [
      { title: "Deliveries · Fresh15 Partner" },
      { name: "description", content: "Active and completed deliveries with full history." },
      { property: "og:title", content: "Deliveries · Fresh15 Partner" },
      { property: "og:description", content: "Active and completed deliveries." },
    ],
  }),
  component: () => <RequireAuth><Deliveries /></RequireAuth>,
});

const TABS = ["Active", "Completed", "Rejected"] as const;

function Deliveries() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Active");
  const { data, isLoading, isError, error } = useMyDeliveries();
  const all = data ?? [];

  const list =
    tab === "Active"
      ? all.filter(d => isActive(d.status))
      : tab === "Completed"
        ? all.filter(d => d.status === "DELIVERED")
        : all.filter(d => CLOSED_STATUSES.includes(d.status));

  const delivered = list.filter(d => d.status === "DELIVERED");

  return (
    <AppLayout>
      <TopBar />
      <div className="px-4 pt-4">
        <h1 className="text-2xl font-bold">Deliveries</h1>
        <p className="text-sm text-muted-foreground mt-1">Your order history and active runs</p>

        <div className="mt-5 flex gap-1 p-1 bg-muted rounded-full">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 h-10 rounded-full text-sm font-semibold transition-all",
                tab === t ? "bg-card text-foreground shadow-card" : "text-muted-foreground"
              )}
            >{t}</button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {isLoading ? (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          ) : isError ? (
            <EmptyState
              icon={<AlertCircle className="h-6 w-6" />}
              title="Couldn't load deliveries"
              desc={error instanceof Error ? error.message : "Please try again."}
            />
          ) : list.length === 0 ? (
            <EmptyState
              icon={<Package className="h-6 w-6" />}
              title={tab === "Active" ? "No active deliveries" : `No ${tab.toLowerCase()} deliveries`}
              desc="Deliveries assigned to you by the Fresh15 team will show up here."
            />
          ) : list.map(d => <DeliveryCard key={d._id} d={d} />)}
        </div>

        {delivered.length > 0 && (
          <div className="mt-6 mb-2">
            <SectionTitle>Summary</SectionTitle>
            <Card>
              <div className="grid grid-cols-2 gap-3 text-center">
                <Kpi label="Delivered" value={delivered.length} />
                <Kpi label="Earnings" value={formatMoney(delivered.reduce((s, d) => s + getEarning(d), 0))} />
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function DeliveryCard({ d }: { d: Delivery }) {
  const addr = formatAddress(getAddress(d));
  return (
    <Link to="/orders/$orderId" params={{ orderId: d._id }}>
      <Card className="hover:shadow-elevated transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <div className="font-mono text-xs text-muted-foreground">{getOrderNumber(d)}</div>
          <StatusBadge status={d.status} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{getCustomerName(d)}</div>
            {addr && <div className="text-xs text-muted-foreground truncate">{addr}</div>}
          </div>
          <div className="text-right shrink-0">
            <div className={cn(
              "font-bold text-base",
              d.status === "CANCELLED" || d.status === "REJECTED" ? "text-muted-foreground line-through" : "text-primary"
            )}>{formatMoney(getEarning(d))}</div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function Kpi({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
