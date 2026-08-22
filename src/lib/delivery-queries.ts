import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "./app-state";
import {
  ApiError,
  DELIVERY_STATUS_LABEL,
  collectCodPayment,
  fetchDelivery,
  fetchMyDeliveries,
  updateDeliveryStatus,
  verifyDeliveryOtp,
  uploadDeliveryProof,
  failDelivery,
  type Delivery,
  type RiderDeliveryStatus,
} from "./delivery-api";

export const deliveryKeys = {
  all: ["deliveries"] as const,
  my: () => [...deliveryKeys.all, "my"] as const,
  detail: (id: string) => [...deliveryKeys.all, "detail", id] as const,
};

/** Controlled polling: only while the tab is visible, never per render. */

export function useMyDeliveries() {
  const { token } = useAuth();
  return useQuery({
    queryKey: deliveryKeys.my(),
    enabled: !!token,
    queryFn: () => fetchMyDeliveries(token!),
    refetchInterval: false,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
    retry: (count, err) => !(err instanceof ApiError && [401, 403].includes(err.status)) && count < 2,
  });
}

export function useDelivery(id: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: deliveryKeys.detail(id),
    enabled: !!token && !!id,
    queryFn: () => fetchDelivery(token!, id),
    refetchInterval: false,
    refetchIntervalInBackground: false,
    staleTime: 5_000,
    retry: (count, err) => !(err instanceof ApiError && [401, 403, 404].includes(err.status)) && count < 2,
  });
}

export function useUpdateDeliveryStatus(id: string) {
  const { token } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (status: RiderDeliveryStatus) => {
      if (!token) throw new ApiError("Your session has expired. Please sign in again.", 401);
      return updateDeliveryStatus(token, id, status);
    },
    onSuccess: ({ delivery, message }, status) => {
      if (delivery) qc.setQueryData<Delivery>(deliveryKeys.detail(id), delivery);
      void qc.invalidateQueries({ queryKey: deliveryKeys.my() });
      void qc.invalidateQueries({ queryKey: deliveryKeys.detail(id) });
      toast.success(message || `Marked as ${DELIVERY_STATUS_LABEL[status]}`);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(msg);
      // Backend stays authoritative — resync whatever the real state is.
      void qc.invalidateQueries({ queryKey: deliveryKeys.all });
    },
  });
}

export function useCollectCodPayment(id: string) {
  const { token } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!token) throw new ApiError("Your session has expired. Please sign in again.", 401);
      return collectCodPayment(token, id);
    },
    onSuccess: ({ delivery, message }) => {
      if (delivery) qc.setQueryData<Delivery>(deliveryKeys.detail(id), delivery);
      void qc.invalidateQueries({ queryKey: deliveryKeys.my() });
      void qc.invalidateQueries({ queryKey: deliveryKeys.detail(id) });
      toast.success(message || "COD payment collected.");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Could not collect COD payment.";
      toast.error(msg);
      void qc.invalidateQueries({ queryKey: deliveryKeys.all });
    },
  });
}

export function useVerifyDeliveryOtp(id: string) {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (otp: string) => {
      if (!token) throw new ApiError("Your session has expired. Please sign in again.", 401);
      return verifyDeliveryOtp(token, id, otp);
    },
    onSuccess: ({ delivery, message }) => {
      if (delivery) qc.setQueryData<Delivery>(deliveryKeys.detail(id), delivery);
      void qc.invalidateQueries({ queryKey: deliveryKeys.my() });
      void qc.invalidateQueries({ queryKey: deliveryKeys.detail(id) });
      toast.success(message);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Could not verify delivery OTP.");
    },
  });
}

export function useUploadDeliveryProof(id: string) {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { type: "PHOTO" | "SIGNATURE"; file: File }) => {
      if (!token) throw new ApiError("Your session has expired. Please sign in again.", 401);
      return uploadDeliveryProof(token, id, input.type, input.file);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: deliveryKeys.my() });
      void qc.invalidateQueries({ queryKey: deliveryKeys.detail(id) });
      toast.success("Delivery proof uploaded.");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Could not upload delivery proof.");
    },
  });
}

export function useFailDelivery(id: string) {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { reason: string; note?: string }) => {
      if (!token) throw new ApiError("Your session has expired. Please sign in again.", 401);
      return failDelivery(token, id, input.reason, input.note);
    },
    onSuccess: ({ delivery, message }) => {
      if (delivery) qc.setQueryData<Delivery>(deliveryKeys.detail(id), delivery);
      void qc.invalidateQueries({ queryKey: deliveryKeys.my() });
      void qc.invalidateQueries({ queryKey: deliveryKeys.detail(id) });
      toast.success(message);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Could not mark delivery as failed.");
    },
  });
}
