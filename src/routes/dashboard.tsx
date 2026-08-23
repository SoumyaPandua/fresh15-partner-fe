
"use client";

import { createFileRoute, Link } from "@/lib/next-router-compat";
import {
  IndianRupee, Package, Target, Star, Zap, TrendingUp, ChevronRight,
  MapPin, Store, Circle, AlertCircle, Loader2, Timer, Route as RouteIcon,
  Coffee, Play, CalendarClock, Banknote, ShieldAlert,
} from "lucide-react";
import { AppLayout, TopBar, RequireAuth } from "@/components/app-shell";
import { Card, Stat, SectionTitle, EmptyState, Skeleton } from "@/components/ui-bits";
import { StatusBadge } from "@/components/order-bits";
import { useAuth, useAvailability } from "@/lib/app-state";
import { useMyDeliveries } from "@/lib/delivery-queries";
import { computeStats, findActiveDelivery } from "@/lib/delivery-stats";
import {
  formatAddress, formatMoney, getAddress, getCustomerName, getEarning, getOrderNumber,
} from "@/lib/delivery-api";
import { getPartnerOpsOverview, pausePartner, resumePartner } from "@/lib/partner-ops-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · Fresh15 Partner" },
      { name: "description", content: "Today's earnings, active orders, route queue and partner operations." },
    ],
  }),
  component: () => <RequireAuth><Dashboard /></RequireAuth>,
});

function AcceptanceCountdown({ deadline }: { deadline?: string | null }) {
  const [remaining, setRemaining] = useState(() => deadline ? Math.max(0, new Date(deadline).getTime() - Date.now()) : 0);

  useEffect(() => {
    if (!deadline) return;
    const tick = () => setRemaining(Math.max(0, new Date(deadline).getTime() - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [deadline]);

  if (!deadline || remaining <= 0) {
    return <span className="font-bold text-destructive">Expired</span>;
  }

  const seconds = Math.ceil(remaining / 1000);
  return <span className={cn("font-black tabular-nums", seconds <= 15 ? "text-destructive" : "text-primary")}>{seconds}s</span>;
}

function AvailabilityToggle() {
  const { online, toggle, pending } = useAvailability();
  return (
    <button
      onClick={toggle}
      disabled={pending}
      title={online ? "You are online and receiving orders" : "You are offline"}
      className={cn(
        "flex items-center gap-2 h-9 px-3 rounded-full text-xs font-semibold border transition-all disabled:opacity-60",
        online ? "bg-success/15 text-success border-success/30" : "bg-muted text-muted-foreground border-border",
      )}
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Circle className={cn("h-2 w-2 fill-current", online ? "text-success" : "text-muted-foreground")} />}
      {online ? "Online" : "Offline"}
    </button>
  );
}

function Dashboard() {
  const { online } = useAvailability();
  const { user, token } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useMyDeliveries();
  const deliveries = data ?? [];
  const stats = computeStats(deliveries);
  const active = findActiveDelivery(deliveries);
  const firstName = (user?.name ?? "Partner").split(" ")[0];

  const ops = useQuery({
    queryKey: ["partner-ops", "overview"],
    enabled: Boolean(token),
    queryFn: () => getPartnerOpsOverview(token!),
    refetchInterval: 10_000,
    staleTime: 3_000,
  });

  const pause = useMutation({
    mutationFn: () => pausePartner(token!, 30, "Short break"),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["partner-ops", "overview"] });
      toast.success("Break started for 30 minutes");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not start break"),
  });

  const resume = useMutation({
    mutationFn: () => resumePartner(token!),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["partner-ops", "overview"] });
      toast.success("You're available again");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not resume"),
  });

  const paused = Boolean(ops.data?.partner.isPaused);
  const nextStop = ops.data?.nextStop;

  return (
    <AppLayout>
      <TopBar><AvailabilityToggle /></TopBar>

      <div className="px-4 pt-4 space-y-6">
        <div className="animate-slide-up">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Welcome back</div>
          <h1 className="text-2xl font-bold mt-0.5">{firstName} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {paused ? "You're on a break. New orders are paused." : online ? "You're online. New assignments will appear here." : "You're offline. Turn on to receive orders."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat tone="primary" label="Today's earnings" icon={<IndianRupee className="h-4 w-4" />} value={formatMoney(stats.todayEarnings)} />
          <Stat label="Deliveries today" icon={<Package className="h-4 w-4" />} value={stats.todayDeliveries} />
          <Stat label="Acceptance" icon={<Target className="h-4 w-4" />} value={stats.acceptanceRate === null ? "—" : `${stats.acceptanceRate}%`} />
          <Stat label="Completed" icon={<Star className="h-4 w-4" />} value={stats.totalDeliveries} />
        </div>

        {online && !active && !paused && (
          <Card className="border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Coffee className="h-5 w-5" /></div>
                <div>
                  <div className="text-sm font-semibold">Need a break?</div>
                  <div className="text-xs text-muted-foreground">Pause new assignments for 30 minutes.</div>
                </div>
              </div>
              <button onClick={() => pause.mutate()} disabled={pause.isPending} className="rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60">
                {pause.isPending ? "…" : "Take break"}
              </button>
            </div>
          </Card>
        )}

        {paused && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Break active</div>
                <div className="text-xs text-muted-foreground">
                  Until {ops.data?.partner.pauseUntil ? new Date(ops.data.partner.pauseUntil).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "soon"}
                </div>
              </div>
              <button onClick={() => resume.mutate()} disabled={resume.isPending} className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60">
                <Play className="h-3.5 w-3.5" /> Resume
              </button>
            </div>
          </Card>
        )}

        <section>
          <SectionTitle action={<Link to="/deliveries" className="text-xs font-semibold text-primary">View all</Link>}>Active order</SectionTitle>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : isError ? (
            <Card><EmptyState icon={<AlertCircle className="h-6 w-6" />} title="Couldn't load deliveries" desc={error instanceof Error ? error.message : "Please try again."} /></Card>
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

                {active.status === "ASSIGNED" && active.acceptanceDeadlineAt && (
                  <div className="mb-3 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold"><Timer className="h-3.5 w-3.5" /> Accept within</span>
                    <AcceptanceCountdown deadline={active.acceptanceDeadlineAt} />
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="grid place-items-center h-8 w-8 rounded-full bg-primary-soft text-primary shrink-0"><Store className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">Fresh15 Store</div><div className="text-xs text-muted-foreground truncate">Pick up the order from the store</div></div>
                  </div>
                  <div className="ml-4 border-l-2 border-dashed border-border h-4" />
                  <div className="flex gap-3">
                    <div className="grid place-items-center h-8 w-8 rounded-full bg-accent/20 text-accent-foreground shrink-0"><MapPin className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{getCustomerName(active)}</div><div className="text-xs text-muted-foreground truncate">{formatAddress(getAddress(active)) || "Address available in order details"}</div></div>
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

        <section>
          <SectionTitle>Next-stop queue</SectionTitle>
          {ops.isLoading ? (
            <Skeleton className="h-28 w-full" />
          ) : nextStop ? (
            <Card className="border-primary/20">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><RouteIcon className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Recommended next stop</div>
                  <div className="mt-1 text-sm font-bold">{nextStop.orderNumber || "Delivery"}</div>
                  <div className="text-xs text-muted-foreground truncate">{nextStop.customer.name || "Customer"}</div>
                  {nextStop.distanceKm != null && <div className="mt-1 text-xs font-semibold text-primary">{nextStop.distanceKm.toFixed(1)} km away</div>}
                </div>
                <Link to="/orders/$orderId" params={{ orderId: nextStop.deliveryId }} className="rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">Open</Link>
              </div>
              {ops.data?.queue.stops.length ? <div className="mt-3 text-[11px] text-muted-foreground">{ops.data.queue.stops.length} stop(s) in your current queue</div> : null}
            </Card>
          ) : (
            <Card className="text-sm text-muted-foreground">Your route queue will appear after a delivery is assigned.</Card>
          )}
        </section>

        <div className="grid grid-cols-3 gap-2">
          <QuickLink to="/schedule" icon={<CalendarClock className="h-4 w-4" />} label="Shifts" />
          <QuickLink to="/cash" icon={<Banknote className="h-4 w-4" />} label="Cash" />
          <QuickLink to="/incidents" icon={<ShieldAlert className="h-4 w-4" />} label="Report" />
        </div>

        <section>
          <SectionTitle action={<Link to="/wallet" className="text-xs font-semibold text-primary">All earnings</Link>}>Earnings today</SectionTitle>
          <Card>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Kpi label="Orders" value={formatMoney(ops.data?.earnings.totals.orders ?? stats.todayEarnings)} />
              <Kpi label="Incentives" value={formatMoney(ops.data?.earnings.totals.incentives ?? 0)} />
              <Kpi label="Total" value={formatMoney(ops.data?.earnings.totals.total ?? stats.todayEarnings)} />
            </div>
          </Card>
        </section>

        {ops.data?.documents.some((d) => d.expiryState === "EXPIRED" || d.expiryState === "EXPIRING_SOON") && (
          <Link to="/documents">
            <Card className="border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div className="flex-1">
                  <div className="text-sm font-semibold">Document action needed</div>
                  <div className="text-xs text-muted-foreground">One or more KYC/vehicle documents are expired or expiring soon.</div>
                </div>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Card>
          </Link>
        )}

        <section>
          <SectionTitle>Performance</SectionTitle>
          <Link to="/performance">
            <Card className="flex items-center gap-3 hover:shadow-elevated transition-shadow">
              <div className="grid place-items-center h-11 w-11 rounded-xl gradient-primary text-primary-foreground"><TrendingUp className="h-5 w-5" /></div>
              <div className="flex-1"><div className="font-semibold text-sm">Your delivery record</div><div className="text-xs text-muted-foreground">{stats.totalDeliveries} deliveries · {formatMoney(stats.totalEarnings)} earned</div></div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Card>
          </Link>
        </section>
      </div>
    </AppLayout>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return <Link to={to as any} className="flex items-center justify-center gap-1.5 rounded-xl border bg-card py-3 text-xs font-semibold hover:bg-muted">{icon}{label}</Link>;
}

function Kpi({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><div className="text-sm font-bold">{value}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div></div>;
}
