import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "./app-state";
import { ApiError } from "./delivery-api";
import {
  deleteNotification,
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "./notification-api";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
  unread: () => [...notificationKeys.all, "unread-count"] as const,
};

const POLL_MS = 30_000;
const noAuthRetry = (count: number, err: unknown) =>
  !(err instanceof ApiError && [401, 403].includes(err.status)) && count < 2;

export function useNotifications() {
  const { token } = useAuth();
  return useQuery({
    queryKey: notificationKeys.list(),
    enabled: !!token,
    queryFn: () => fetchNotifications(token!),
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
    retry: noAuthRetry,
  });
}

export function useUnreadCount() {
  const { token } = useAuth();
  return useQuery({
    queryKey: notificationKeys.unread(),
    enabled: !!token,
    queryFn: () => fetchUnreadCount(token!),
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
    retry: noAuthRetry,
  });
}

function useInvalidateNotifications() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: notificationKeys.all });
  };
}

export function useMarkNotificationRead() {
  const { token } = useAuth();
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!token) throw new ApiError("Your session has expired. Please sign in again.", 401);
      return markNotificationRead(token, id);
    },
    onSuccess: invalidate,
    onError: (err: unknown) => {
      // Opening a notification should never block navigation — just resync.
      if (err instanceof ApiError && err.status === 404) invalidate();
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { token } = useAuth();
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: async () => {
      if (!token) throw new ApiError("Your session has expired. Please sign in again.", 401);
      return markAllNotificationsRead(token);
    },
    onSuccess: (message) => {
      toast.success(message);
      invalidate();
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Could not update notifications"),
  });
}

export function useDeleteNotification() {
  const { token } = useAuth();
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!token) throw new ApiError("Your session has expired. Please sign in again.", 401);
      return deleteNotification(token, id);
    },
    onSuccess: (message) => {
      toast.success(message);
      invalidate();
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Could not delete notification"),
  });
}
