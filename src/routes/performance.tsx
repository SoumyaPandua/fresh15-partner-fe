"use client";

import { createFileRoute } from "@/lib/next-router-compat";
import { Package, TrendingUp, Trophy, Target } from "lucide-react";
import { AppLayout, TopBar, RequireAuth } from "@/components/app-shell";
import { Card, SectionTitle, Stat } from "@/components/ui-bits";
import { ACHIEVEMENTS } from "@/lib/demo-data";
import { useMyDeliveries } from "@/lib/delivery-queries";
import { computeStats } from "@/lib/delivery-stats";
import { formatMoney } from "@/lib/delivery-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/performance")({
  head: () => ({
    meta: [
      { title: "Performance · Fresh15 Partner" },
      { name: "description", content: "Ratings, achievements and weekly stats." },
      { property: "og:title", content: "Performance · Fresh15 Partner" },
      { property: "og:description", content: "Track ratings, streaks and achievements." },
    ],
  }),
  component: () => <RequireAuth><Performance /></RequireAuth>,
});

function Performance() {
  const { data } = useMyDeliveries();
  const stats = computeStats(data ?? []);
  const max = Math.max(1, ...stats.weekly.map(d => d.amount));
  const total = stats.weekly.reduce((s, d) => s + d.amount, 0);

  return (
    <AppLayout>
      <TopBar />
      <div className="px-4 pt-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Performance</h1>
          <p className="text-sm text-muted-foreground mt-1">Your week at a glance</p>
        </div>

        {/* Deliveries hero */}
        <Card className="text-center py-6">
          <div className="inline-flex items-center gap-2 text-primary">
            <Package className="h-5 w-5" />
            <span className="text-4xl font-bold">{stats.totalDeliveries}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">Completed deliveries · {formatMoney(stats.totalEarnings)} lifetime earnings</div>
        </Card>

        {/* Week earnings chart */}
        <section>
          <SectionTitle action={<span className="text-xs text-muted-foreground">Last 7 days · {formatMoney(total)}</span>}>Earnings</SectionTitle>
          <Card>
            <div className="flex items-end justify-between gap-2 h-40">
              {stats.weekly.map((d, i) => {
                const h = (d.amount / max) * 100;
                const isToday = i === stats.weekly.length - 1;
                return (
                  <div key={`${d.day}-${i}`} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="text-[10px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">₹{d.amount}</div>
                    <div className={cn(
                      "w-full rounded-t-lg transition-all min-h-[2px]",
                      isToday ? "gradient-primary" : "bg-primary/25 hover:bg-primary/40"
                    )} style={{ height: `${h}%` }} />
                    <div className={cn("text-[10px] font-medium", isToday ? "text-primary font-bold" : "text-muted-foreground")}>{d.day}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Acceptance" icon={<Target className="h-4 w-4" />} value={stats.acceptanceRate === null ? "—" : `${stats.acceptanceRate}%`} />
          <Stat label="Today" icon={<TrendingUp className="h-4 w-4" />} value={formatMoney(stats.todayEarnings)} />
        </div>

        {/* Achievements */}
        <section>
          <SectionTitle>Achievements</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {ACHIEVEMENTS.map(a => (
              <Card key={a.id} className={cn("text-center py-5", !a.unlocked && "opacity-50")}>
                <div className="text-4xl mb-2">{a.icon}</div>
                <div className="font-semibold text-sm">{a.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{a.desc}</div>
                {a.unlocked && (
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-primary uppercase tracking-wider">
                    <Trophy className="h-3 w-3" /> Unlocked
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
