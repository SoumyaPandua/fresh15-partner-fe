
"use client";

import { createFileRoute } from "@/lib/next-router-compat";
import { CalendarClock, Clock3, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppLayout, PageHeader, RequireAuth } from "@/components/app-shell";
import { Card, EmptyState, Skeleton } from "@/components/ui-bits";
import { useAuth } from "@/lib/app-state";
import {
  cancelPartnerShift,
  createPartnerShift,
  getPartnerShifts,
  type PartnerShift,
} from "@/lib/partner-ops-api";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "My Shifts · Fresh15 Partner" },
      { name: "description", content: "Schedule delivery shifts and manage upcoming work hours." },
    ],
  }),
  component: () => <RequireAuth><Schedule /></RequireAuth>,
});

function toLocalDateKey(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Schedule() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [note, setNote] = useState("");

  const q = useQuery({
    queryKey: ["partner-ops", "shifts"],
    enabled: Boolean(token),
    queryFn: () => getPartnerShifts(token!),
    staleTime: 10_000,
  });

  const create = useMutation({
    mutationFn: () => {
      if (!start || !end) throw new Error("Choose a start and end time");
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (endDate <= startDate) throw new Error("Shift end must be after shift start");
      return createPartnerShift(token!, {
        dateKey: toLocalDateKey(start),
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        note: note.trim(),
      });
    },
    onSuccess: () => {
      setStart("");
      setEnd("");
      setNote("");
      void qc.invalidateQueries({ queryKey: ["partner-ops", "shifts"] });
      toast.success("Shift scheduled");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not schedule shift"),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => cancelPartnerShift(token!, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["partner-ops", "shifts"] });
      toast.success("Shift cancelled");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not cancel shift"),
  });

  const shifts = useMemo(
    () => (q.data ?? []).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [q.data],
  );

  return (
    <AppLayout showNav={false}>
      <PageHeader back title="My shifts" subtitle="Plan your delivery hours" />
      <div className="space-y-4 px-4 py-4 pb-8">
        <Card className="border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold">Schedule ahead</div>
              <div className="text-xs text-muted-foreground">Shifts are limited to 12 hours and cannot overlap.</div>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <label className="text-xs font-semibold">
              Start
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-sm"
              />
            </label>
            <label className="text-xs font-semibold">
              End
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-sm"
              />
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              placeholder="Optional note"
              className="h-11 rounded-xl border bg-background px-3 text-sm"
            />
            <button
              onClick={() => create.mutate()}
              disabled={create.isPending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {create.isPending ? "Scheduling…" : "Schedule shift"}
            </button>
          </div>
        </Card>

        {q.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : q.isError ? (
          <EmptyState icon={<Clock3 className="h-6 w-6" />} title="Couldn't load shifts" desc={q.error instanceof Error ? q.error.message : "Try again."} />
        ) : shifts.length === 0 ? (
          <EmptyState icon={<CalendarClock className="h-6 w-6" />} title="No upcoming shifts" desc="Schedule your next delivery block above." />
        ) : (
          <div className="space-y-2">
            {shifts.map((shift: PartnerShift) => {
              const startAt = new Date(shift.startAt);
              const endAt = new Date(shift.endAt);
              const canCancel = shift.status === "SCHEDULED" && startAt.getTime() > Date.now();

              return (
                <Card key={shift._id} className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-primary">
                    <Clock3 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">
                      {startAt.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {startAt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })} –{" "}
                      {endAt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                    </div>
                    {shift.note && <div className="mt-1 text-xs text-muted-foreground truncate">{shift.note}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{shift.status}</div>
                    {canCancel && (
                      <button
                        onClick={() => cancel.mutate(shift._id)}
                        disabled={cancel.isPending}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Cancel
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
