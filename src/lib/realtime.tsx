import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./app-state";
import { deliveryKeys } from "./delivery-queries";
import { notificationKeys } from "./notification-queries";
import {
  isActive,
  type Delivery,
} from "./delivery-api";
import {
  disconnectSocket,
  getSocket,
} from "./socket";

export type PartnerCurrentLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  updatedAt: number;
};

type RealtimeContextValue = {
  connected: boolean;
  activeOrderId: string | null;
  currentLocation:
    | PartnerCurrentLocation
    | null;
  destination: {
    latitude: number;
    longitude: number;
  } | null;
};

const RealtimeContext =
  createContext<RealtimeContextValue>({
    connected: false,
    activeOrderId: null,
    currentLocation: null,
    destination: null,
  });

function orderIdOf(
  d: Delivery | undefined | null,
): string | null {
  if (!d?.orderId) return null;

  return typeof d.orderId === "string"
    ? d.orderId
    : d.orderId._id ?? null;
}

function destinationOf(
  d: Delivery | undefined | null,
) {
  if (!d?.destination) return null;

  return d.destination;
}

/**
 * One authenticated Socket.IO connection.
 *
 * - joins partner room after login/reconnect
 * - receives assignment/status snapshots
 * - starts exactly one browser GPS watch while an active delivery exists
 * - sends GPS through Socket.IO only
 *
 * IMPORTANT:
 * React Query cache events are never allowed to synchronously
 * update this provider while another component is rendering.
 */
export function RealtimeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { token, isAuthed } =
    useAuth();

  const qc = useQueryClient();

  const watchIdRef =
    useRef<number | null>(null);

  const activeOrderIdRef =
    useRef<string | null>(null);

  const lastSentRef =
    useRef("");

  const [connected, setConnected] =
    useState(false);

  const [activeOrderId, setActiveOrderId] =
    useState<string | null>(null);

  const [currentLocation, setCurrentLocation] =
    useState<PartnerCurrentLocation | null>(
      null,
    );

  const [destination, setDestination] =
    useState<{
      latitude: number;
      longitude: number;
    } | null>(null);

  useEffect(() => {
    if (
      !isAuthed ||
      !token ||
      typeof window === "undefined"
    ) {
      disconnectSocket();
      setConnected(false);
      return;
    }

    const socket = getSocket(token);

    const join = () => {
      socket.emit("join:partner");
    };

    const onConnect = () => {
      setConnected(true);
      join();
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    socket.on(
      "connect",
      onConnect,
    );

    socket.on(
      "disconnect",
      onDisconnect,
    );

    if (socket.connected) {
      onConnect();
    }

    const stopWatch = () => {
      if (
        watchIdRef.current !== null
      ) {
        navigator.geolocation.clearWatch(
          watchIdRef.current,
        );

        watchIdRef.current = null;
      }

      lastSentRef.current = "";
    };

    const setActive = (
      delivery?: Delivery | null,
      payload?: any,
    ) => {
      const nextOrderId =
        payload?.orderId
          ? String(payload.orderId)
          : orderIdOf(delivery);

      const nextDestination =
        payload?.destination &&
        Number.isFinite(
          Number(
            payload.destination.latitude,
          ),
        ) &&
        Number.isFinite(
          Number(
            payload.destination.longitude,
          ),
        )
          ? {
              latitude: Number(
                payload.destination
                  .latitude,
              ),
              longitude: Number(
                payload.destination
                  .longitude,
              ),
            }
          : destinationOf(delivery);

      activeOrderIdRef.current =
        nextOrderId;

      setActiveOrderId(
        nextOrderId,
      );

      setDestination(
        nextDestination,
      );

      const snapshotLocation =
        payload?.currentLocation &&
        Number.isFinite(
          Number(
            payload.currentLocation
              .latitude,
          ),
        ) &&
        Number.isFinite(
          Number(
            payload.currentLocation
              .longitude,
          ),
        )
          ? {
              latitude: Number(
                payload.currentLocation
                  .latitude,
              ),
              longitude: Number(
                payload.currentLocation
                  .longitude,
              ),
              accuracy:
                payload.currentLocation
                  .accuracy ?? null,
              speed:
                payload.currentLocation
                  .speed ?? null,
              heading:
                payload.currentLocation
                  .heading ?? null,
              updatedAt: Date.now(),
            }
          : delivery?.currentLocation &&
              Number.isFinite(
                Number(
                  delivery.currentLocation
                    .latitude,
                ),
              ) &&
              Number.isFinite(
                Number(
                  delivery.currentLocation
                    .longitude,
                ),
              )
            ? {
                latitude: Number(
                  delivery.currentLocation
                    .latitude,
                ),
                longitude: Number(
                  delivery.currentLocation
                    .longitude,
                ),
                accuracy:
                  delivery.currentLocation
                    .accuracy ?? null,
                speed:
                  delivery.currentLocation
                    .speed ?? null,
                heading:
                  delivery.currentLocation
                    .heading ?? null,
                updatedAt: Date.now(),
              }
            : null;

      if (snapshotLocation) {
        setCurrentLocation(
          snapshotLocation,
        );
      }

      lastSentRef.current = "";

      if (nextOrderId) {
        startWatch();
      } else {
        stopWatch();
      }
    };

    const syncFromCache = () => {
      const list =
        qc.getQueryData<Delivery[]>(
          deliveryKeys.my(),
        );

      const active =
        Array.isArray(list)
          ? list.find((d) =>
              isActive(d.status),
            )
          : undefined;

      if (active) {
        setActive(active);
      } else if (list) {
        setActive(null);
      }
    };

    const refreshDeliveries =
      async (payload?: any) => {
        await qc.invalidateQueries({
          queryKey: deliveryKeys.all,
        });

        await qc.invalidateQueries({
          queryKey: notificationKeys.all,
        });

        await qc.refetchQueries({
          queryKey: deliveryKeys.my(),
          type: "active",
        });

        const list =
          qc.getQueryData<Delivery[]>(
            deliveryKeys.my(),
          );

        const active =
          list?.find((d) =>
            isActive(d.status),
          );

        setActive(
          active,
          payload,
        );
      };

    const onAssigned = (
      payload: any,
    ) => {
      void refreshDeliveries(
        payload,
      );
    };

    const onDeliveryUpdated = (
      payload: any,
    ) => {
      void refreshDeliveries(
        payload,
      );
    };

    const onOrderUpdated = (
      payload: any,
    ) => {
      void refreshDeliveries(
        payload,
      );
    };

    const onActiveSnapshot = (
      payload: any,
    ) => {
      void refreshDeliveries(
        payload,
      );
    };

    const startWatch = () => {
      if (
        watchIdRef.current !== null
      ) {
        return;
      }

      if (
        !("geolocation" in navigator)
      ) {
        return;
      }

      if (
        !activeOrderIdRef.current
      ) {
        return;
      }

      watchIdRef.current =
        navigator.geolocation.watchPosition(
          (pos) => {
            const orderId =
              activeOrderIdRef.current;

            if (!orderId) return;

            const latitude =
              pos.coords.latitude;

            const longitude =
              pos.coords.longitude;

            const now = Date.now();

            setCurrentLocation({
              latitude,
              longitude,
              accuracy:
                Number.isFinite(
                  pos.coords.accuracy,
                )
                  ? pos.coords.accuracy
                  : null,
              speed:
                Number.isFinite(
                  pos.coords.speed ??
                    NaN,
                )
                  ? pos.coords.speed
                  : null,
              heading:
                Number.isFinite(
                  pos.coords.heading ??
                    NaN,
                )
                  ? pos.coords.heading
                  : null,
              updatedAt: now,
            });

            const sig = `${orderId}:${latitude.toFixed(
              6,
            )},${longitude.toFixed(6)}`;

            if (
              sig ===
              lastSentRef.current
            ) {
              return;
            }

            lastSentRef.current =
              sig;

            socket.emit(
              "location:update",
              {
                orderId,
                latitude,
                longitude,
                accuracy:
                  pos.coords.accuracy,
                speed:
                  pos.coords.speed,
                heading:
                  pos.coords.heading,
              },
            );
          },
          () => {
            // Browser permission/unavailable errors
            // are handled by the UI when needed.
          },
          {
            enableHighAccuracy: true,
            maximumAge: 5_000,
            timeout: 20_000,
          },
        );
    };

    socket.on(
      "partner:assigned",
      onAssigned,
    );

    socket.on(
      "delivery:updated",
      onDeliveryUpdated,
    );

    socket.on(
      "order:updated",
      onOrderUpdated,
    );

    socket.on(
      "delivery:active",
      onActiveSnapshot,
    );

    /*
     * Initial synchronization is already running inside useEffect,
     * so it is safe to update provider state here.
     */
    syncFromCache();

    /*
     * IMPORTANT FIX:
     *
     * React Query can emit cache events synchronously while another
     * component is rendering.
     *
     * Previously:
     *
     *   query cache event
     *       ↓
     *   syncFromCache()
     *       ↓
     *   setActive()
     *       ↓
     *   setCurrentLocation()
     *       ↓
     *   React warning/error
     *
     * Now the cache notification only schedules the synchronization
     * for the next macrotask, after the current render/commit cycle.
     */
    let disposed = false;

    let syncTimer:
      ReturnType<typeof setTimeout> | null =
      null;

    const scheduleSyncFromCache =
      () => {
        if (
          syncTimer !== null
        ) {
          return;
        }

        syncTimer = setTimeout(
          () => {
            syncTimer = null;

            if (!disposed) {
              syncFromCache();
            }
          },
          0,
        );
      };

    const unsubscribe =
      qc.getQueryCache().subscribe(
        scheduleSyncFromCache,
      );

    return () => {
      disposed = true;

      if (
        syncTimer !== null
      ) {
        clearTimeout(syncTimer);
        syncTimer = null;
      }

      unsubscribe();

      stopWatch();

      activeOrderIdRef.current =
        null;

      setActiveOrderId(null);

      setDestination(null);

      setCurrentLocation(null);

      socket.off(
        "connect",
        onConnect,
      );

      socket.off(
        "disconnect",
        onDisconnect,
      );

      socket.off(
        "partner:assigned",
        onAssigned,
      );

      socket.off(
        "delivery:updated",
        onDeliveryUpdated,
      );

      socket.off(
        "order:updated",
        onOrderUpdated,
      );

      socket.off(
        "delivery:active",
        onActiveSnapshot,
      );

      disconnectSocket();
    };
  }, [
    isAuthed,
    token,
    qc,
  ]);

  const value =
    useMemo(
      () => ({
        connected,
        activeOrderId,
        currentLocation,
        destination,
      }),
      [
        connected,
        activeOrderId,
        currentLocation,
        destination,
      ],
    );

  return (
    <RealtimeContext.Provider
      value={value}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export const useRealtime =
  () => useContext(RealtimeContext);