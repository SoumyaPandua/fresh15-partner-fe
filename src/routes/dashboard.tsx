"use client";

import { createFileRoute, Link } from "@/lib/next-router-compat";
import { IndianRupee, Package, Target, Star, Zap, TrendingUp, ChevronRight, MapPin, Store, Circle, AlertCircle, Loader2 } from "lucide-react";
import { AppLayout, TopBar, RequireAuth } from "@/components/app-shell";
import { Card, Stat, SectionTitle, EmptyState, Skeleton } from "@/components/ui-bits";
import { StatusBadge } from "@/components/order-bits";
import { INCENTIVES } from "@/lib/demo-data";
import { useAuth, useAvailability } from "@/lib/app-state";
import { useMyDeliveries } from "@/lib/delivery-queries";
import { computeStats, findActiveDelivery } from "@/lib/delivery-stats";
import {
  formatAddress,
  formatMoney,
  getAddress,
  getCustomerName,
  getEarning,
  getOrderNumber,
} from "@/lib/delivery-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · Fresh15 Partner" },
      { name: "description", content: "Today's earnings, active orders and incentives at a glance." },
      { property: "og:title", content: "Fresh15 Partner Dashboard" },
      { property: "og:description", content: "Track earnings, deliveries and streaks in real time." },
    ],
  }),
  component: () => <RequireAuth><Dashboard /></RequireAuth>,
});

function AvailabilityToggle() {
  const { online, toggle, pending } = useAvailability();
  return (
    <button
      onClick={toggle}
      disabled={pending}
      title={online ? "You are online and receiving orders" : "You are offline"}
      className={cn(
        "flex items-center gap-2 h-9 px-3 rounded-full text-xs font-semibold border transition-all disabled:opacity-60 disabled:cursor-not-allowed",
        online ? "bg-success/15 text-success border-success/30" : "bg-muted text-muted-foreground border-border"
      )}
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <span className="relative flex h-2 w-2">
          {online && <span className="absolute inline-flex h-full w-full rounded-full bg-success animate-ping opacity-60" />}
          <Circle className={cn("h-2 w-2 fill-current", online ? "text-success" : "text-muted-foreground")} />
        </span>
      )}
      {online ? "Online" : "Offline"}
    </button>
  );
}

function Dashboard() {
  const { online } = useAvailability();
  const { user } = useAuth();
  const { data, isLoading, isError, error } = useMyDeliveries();
  const deliveries = data ?? [];
  const stats = computeStats(deliveries);
  const active = findActiveDelivery(deliveries);
  const firstName = (user?.name ?? "Partner").split(" ")[0];

  return (
    <AppLayout>
      <TopBar><AvailabilityToggle /></TopBar>

      <div className="px-4 pt-4 space-y-6">
        {/* Greeting */}
        <div className="animate-slide-up">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Welcome back</div>
          <h1 className="text-2xl font-bold mt-0.5">{firstName} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {online ? "You're online. Assigned orders appear here automatically." : "You're offline. Turn on to receive orders."}
          </p>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 gap-3">
          <Stat tone="primary" label="Today's earnings" icon={<IndianRupee className="h-4 w-4" />} value={formatMoney(stats.todayEarnings)} />
          <Stat label="Deliveries today" icon={<Package className="h-4 w-4" />} value={stats.todayDeliveries} />
          <Stat label="Acceptance" icon={<Target className="h-4 w-4" />} value={stats.acceptanceRate === null ? "—" : `${stats.acceptanceRate}%`} />
          <Stat label="Completed" icon={<Star className="h-4 w-4" />} value={stats.totalDeliveries} />
        </div>

        {/* Active order */}
        <section>
          <SectionTitle action={<Link to="/deliveries" className="text-xs font-semibold text-primary">View all</Link>}>Active order</SectionTitle>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : isError ? (
            <Card>
              <EmptyState
                icon={<AlertCircle className="h-6 w-6" />}
                title="Couldn't load deliveries"
                desc={error instanceof Error ? error.message : "Please try again."}
              />
            </Card>
          ) : active ? (
            <Link to="/orders/$orderId" params={{ orderId: active._id }}>
              <Card className="hover:shadow-elevated transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Order</div>
                    <div className="font-mono font-semibold text-sm">{getOrderNumber(active)}</div>
                  </div>
                  <StatusBadge status={active.status} />
                </div>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="grid place-items-center h-8 w-8 rounded-full bg-primary-soft text-primary shrink-0"><Store className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">Fresh15 Store</div>
                      <div className="text-xs text-muted-foreground truncate">Pick up the order from the store</div>
                    </div>
                  </div>
                  <div className="ml-4 border-l-2 border-dashed border-border h-4" />
                  <div className="flex gap-3">
                    <div className="grid place-items-center h-8 w-8 rounded-full bg-accent/20 text-accent-foreground shrink-0"><MapPin className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{getCustomerName(active)}</div>
                      <div className="text-xs text-muted-foreground truncate">{formatAddress(getAddress(active)) || "Address available in order details"}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Tap for full details</span>
                  <span className="font-semibold text-primary">+{formatMoney(getEarning(active))} <ChevronRight className="inline h-3.5 w-3.5" /></span>
                </div>
              </Card>
            </Link>
          ) : (
            <Card><EmptyState icon={<Package className="h-6 w-6" />} title="No active orders" desc="Stay online — a new order will arrive shortly." /></Card>
          )}
        </section>

        {/* Incentives (demo programme — no backend endpoint yet) */}
        <section>
          <SectionTitle action={<Link to="/wallet" className="text-xs font-semibold text-primary">All incentives</Link>}>Live incentives</SectionTitle>
          <div className="space-y-3">
            {INCENTIVES.slice(0, 2).map(i => {
              const pct = Math.min(100, (i.progress / i.target) * 100);
              return (
                <Card key={i.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-accent shrink-0" />
                        <div className="text-sm font-semibold truncate">{i.title}</div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{i.progress}/{i.target} complete</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">+₹{i.reward}</div>
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Quick performance */}
        <section>
          <SectionTitle>Performance</SectionTitle>
          <Link to="/performance">
            <Card className="flex items-center gap-3 hover:shadow-elevated transition-shadow">
              <div className="grid place-items-center h-11 w-11 rounded-xl gradient-primary text-primary-foreground"><TrendingUp className="h-5 w-5" /></div>
              <div className="flex-1">
                <div className="font-semibold text-sm">Your delivery record</div>
                <div className="text-xs text-muted-foreground">{stats.totalDeliveries} deliveries · {formatMoney(stats.totalEarnings)} earned</div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Card>
          </Link>
        </section>
      </div>
    </AppLayout>
  );
}
