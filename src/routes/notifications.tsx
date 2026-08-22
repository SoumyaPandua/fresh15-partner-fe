"use client";

import { createFileRoute, useNavigate } from "@/lib/next-router-compat";
import { Bell, Package, IndianRupee, Info, CheckCheck, Trash2 } from "lucide-react";
import { AppLayout, PageHeader, RequireAuth } from "@/components/app-shell";
import { Card, EmptyState, Skeleton } from "@/components/ui-bits";
import { notificationKind, notificationTargetId, type AppNotification } from "@/lib/notification-api";
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/lib/notification-queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications · Fresh15 Partner" }] }),
  component: () => <RequireAuth><Notifs /></RequireAuth>,
});

const iconFor = (k: string) => k === "order" ? Package : k === "earnings" ? IndianRupee : Info;

function Notifs() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const remove = useDeleteNotification();

  const items = data ?? [];
  const hasUnread = items.some(n => !n.isRead);

  const open = (n: AppNotification) => {
    if (!n.isRead) markRead.mutate(n._id);
    const target = notificationTargetId(n);
    if (target) navigate({ to: "/orders/$orderId", params: { orderId: target } });
  };

  return (
    <AppLayout showNav={false}>
      <PageHeader
        back
        title="Notifications"
        right={
          hasUnread ? (
            <button
              type="button"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              className="inline-flex items-center gap-1.5 rounded-full px-3 h-8 text-xs font-semibold bg-primary-soft text-primary disabled:opacity-60"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          ) : undefined
        }
      />
      <div className="px-4 pt-4 pb-8 space-y-2">
        {isLoading ? (
          <>
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </>
        ) : isError ? (
          <EmptyState
            icon={<Bell className="h-6 w-6" />}
            title="Couldn't load notifications"
            desc={error instanceof Error ? error.message : "Please try again in a moment."}
          />
        ) : items.length === 0 ? (
          <EmptyState icon={<Bell className="h-6 w-6" />} title="You're all caught up" desc="New updates will show up here." />
        ) : items.map(n => {
          const Icon = iconFor(notificationKind(n));
          return (
            <Card key={n._id} className={cn("flex gap-3", !n.isRead && "ring-1 ring-primary/20")}>
              <button type="button" onClick={() => open(n)} className="flex flex-1 min-w-0 gap-3 text-left">
                <div className={cn("grid place-items-center h-10 w-10 rounded-xl shrink-0", !n.isRead ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground")}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold">{n.title}</div>
                    {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{n.message}</div>
                  {n.createdAt && (
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {new Date(n.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>
              </button>
              <button
                type="button"
                aria-label="Delete notification"
                onClick={() => remove.mutate(n._id)}
                disabled={remove.isPending}
                className="grid place-items-center h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-destructive transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          );
        })}
      </div>
    </AppLayout>
  );
}
