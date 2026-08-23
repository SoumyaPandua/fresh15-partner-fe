"use client";

import { createFileRoute, useNavigate, Link } from "@/lib/next-router-compat";
import {
  Phone,
  Navigation,
  MapPin,
  Store,
  Package,
  IndianRupee,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Camera,
  PenLine,
  XCircle,
  Loader2,
  Timer,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AppLayout, PageHeader, RequireAuth } from "@/components/app-shell";
import { Card, Skeleton, EmptyState } from "@/components/ui-bits";
import { StatusBadge, OrderTimeline, SubstitutionNote } from "@/components/order-bits";
import {
  useCollectCodPayment,
  useDelivery,
  useUpdateDeliveryStatus,
  useVerifyDeliveryOtp,
  useUploadDeliveryProof,
  useFailDelivery,
} from "@/lib/delivery-queries";
import { useAuth } from "@/lib/app-state";
import { useRealtime } from "@/lib/realtime";
import { LiveDeliveryMap } from "@/components/LiveDeliveryMap";
import { cn } from "@/lib/utils";
import {
  DELIVERY_STATUS_LABEL,
  formatAddress,
  formatDateTime,
  formatMoney,
  getAddress,
  getCustomerName,
  getCustomerPhone,
  getEarning,
  getItems,
  getOrder,
  getSubstitutionPreference,
  getOrderNumber,
  itemName,
  itemQty,
  nextRiderStatus,
  type Delivery,
  type RiderDeliveryStatus,
} from "@/lib/delivery-api";

export const Route = createFileRoute("/orders/$orderId")({
  head: ({ params }: { params: { orderId: string } }) => ({ meta: [{ title: `Delivery ${params.orderId.slice(-6).toUpperCase()} · Fresh15 Partner` }] }),
  component: () => (
    <RequireAuth>
      <OrderDetailRoute />
    </RequireAuth>
  ),
});

function OrderDetailRoute() {
  const { orderId } = Route.useParams();
  const { data, isLoading, isError, error } = useDelivery(orderId);

  if (isLoading) {
    return (
      <AppLayout showNav={false}>
        <PageHeader back title="Delivery" />
        <div className="px-4 py-4 space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (isError || !data) {
    return (
      <AppLayout showNav={false}>
        <PageHeader back title="Delivery" />
        <div className="px-4 py-10">
          <EmptyState
            icon={<AlertCircle className="h-6 w-6" />}
            title="Couldn't load this delivery"
            desc={error instanceof Error ? error.message : "It may no longer be assigned to you."}
          />
          <Link to="/deliveries" className="mt-6 mx-auto w-fit block text-sm font-semibold text-primary">
            Back to deliveries
          </Link>
        </div>
      </AppLayout>
    );
  }

  return <OrderDetail delivery={data} />;
}

function OrderDetail({ delivery }: { delivery: Delivery }) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { currentLocation, destination } = useRealtime();
  const mutation = useUpdateDeliveryStatus(delivery._id);
  const codMutation = useCollectCodPayment(delivery._id);
  const otpMutation = useVerifyDeliveryOtp(delivery._id);
  const proofMutation = useUploadDeliveryProof(delivery._id);
  const failMutation = useFailDelivery(delivery._id);
  const [confirm, setConfirm] = useState<RiderDeliveryStatus | null>(null);
  const [confirmCod, setConfirmCod] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [failOpen, setFailOpen] = useState(false);
  const [failReason, setFailReason] = useState("CUSTOMER_UNAVAILABLE");
  const [failNote, setFailNote] = useState("");

  const status = delivery.status;
  const order = getOrder(delivery);
  const items = getItems(delivery);
  const substitutionItems = items.filter((it) => getSubstitutionPreference(it) !== null);
  const phone = getCustomerPhone(delivery);
  const address = formatAddress(getAddress(delivery));
  const next = nextRiderStatus(status);
  const canReject = status === "ASSIGNED" || status === "PENDING";
  const busy = mutation.isPending;
  const codBusy = codMutation.isPending;
  const isCod = String(order?.paymentMethod ?? "").toUpperCase() === "COD";
  const codPending = isCod && String(order?.paymentStatus ?? "").toUpperCase() !== "PAID";
  const canCollectCod = codPending && (status === "OUT_FOR_DELIVERY" || status === "PICKED_UP");
  const collectedAmount = order?.grandTotal ?? 0;
  const proofRequired = isCod || Number(order?.grandTotal ?? 0) >= 1000;
  const otpVerified = Boolean(delivery.deliveryOtpVerified);
  const customerConfirmed = Boolean(delivery.customerConfirmedAt);
  const canCompleteVerified = !proofRequired || (otpVerified && customerConfirmed);
  const [acceptanceRemaining, setAcceptanceRemaining] = useState(
    () => delivery.acceptanceDeadlineAt
      ? Math.max(0, new Date(delivery.acceptanceDeadlineAt).getTime() - Date.now())
      : 0,
  );

  useEffect(() => {
    if (!delivery.acceptanceDeadlineAt || status !== "ASSIGNED") {
      setAcceptanceRemaining(0);
      return;
    }

    const tick = () => {
      setAcceptanceRemaining(
        Math.max(
          0,
          new Date(delivery.acceptanceDeadlineAt!).getTime() - Date.now(),
        ),
      );
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [delivery.acceptanceDeadlineAt, status]);

  const acceptanceSeconds = Math.ceil(acceptanceRemaining / 1000);

  const run = (to: RiderDeliveryStatus) => {
    mutation.mutate(to, {
      onSuccess: () => {
        setConfirm(null);
        if (to === "REJECTED") setTimeout(() => navigate({ to: "/deliveries" }), 600);
      },
    });
  };

  const onPrimary = () => {
    if (!next) return;
    if (next === "DELIVERED") {
      if (codPending) {
        setConfirmCod(true);
        return;
      }
      if (proofRequired && !otpVerified) {
        setOtpOpen(true);
        return;
      }
      if (proofRequired && !customerConfirmed) {
        toast.info("Ask the customer to confirm receipt in their Fresh15 app.");
        return;
      }
      setConfirm("DELIVERED");
    } else run(next);
  };

  const collectCod = () => {
    if (!canCollectCod || codBusy) return;
    codMutation.mutate(undefined, {
      onSuccess: () => setConfirmCod(false),
    });
  };

  return (
    <AppLayout showNav={false}>
      <PageHeader
        back
        title={getOrderNumber(delivery)}
        subtitle={formatDateTime(delivery.assignedAt ?? delivery.createdAt)}
        right={<StatusBadge status={status} />}
      />

      <div className="px-4 py-4 space-y-4 pb-32">
        {/* Earnings hero */}
        <div className="rounded-2xl gradient-primary text-primary-foreground p-5 shadow-elevated animate-slide-up">
          {status === "ASSIGNED" && delivery.acceptanceDeadlineAt && (
            <div className="mb-4 flex items-center justify-between rounded-xl bg-black/10 px-3 py-2">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Timer className="h-4 w-4" />
                Accept this delivery within
              </div>
              <div className={cn("text-lg font-black tabular-nums", acceptanceSeconds <= 15 ? "text-red-100" : "")}>
                {acceptanceRemaining > 0 ? `${acceptanceSeconds}s` : "Expired"}
              </div>
            </div>
          )}
          <div className="text-xs uppercase tracking-widest opacity-80">You'll earn</div>
          <div className="text-3xl font-bold mt-1">{formatMoney(getEarning(delivery))}</div>
          <div className="mt-3 flex gap-4 text-xs">
            <span className="flex items-center gap-1">
              <Package className="h-3.5 w-3.5" />
              {items.length || 1} items
            </span>
            <span className="flex items-center gap-1">
              <IndianRupee className="h-3.5 w-3.5" />
              {order?.paymentMethod === "COD" || order?.paymentStatus === "PENDING"
                ? `Collect ${formatMoney(order?.grandTotal ?? 0)}`
                : "Prepaid"}
            </span>
          </div>
        </div>

        {/* Timeline */}
        <Card>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Delivery timeline
          </div>
          <OrderTimeline current={status} />
        </Card>

        {(currentLocation || delivery.currentLocation) && (
          <LiveDeliveryMap
            current={
              currentLocation
                ? {
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                  }
                : {
                    latitude: Number(delivery.currentLocation!.latitude),
                    longitude: Number(delivery.currentLocation!.longitude),
                  }
            }
            destination={destination ?? delivery.destination}
            deliveryId={delivery._id}
            token={token}
            routeBaseUrl="https://fresh15-main.onrender.com"
            partnerName="Your live location"
            orderStatus={DELIVERY_STATUS_LABEL[status]}
          />
        )}

        {/* Pickup */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="grid place-items-center h-8 w-8 rounded-full bg-primary-soft text-primary">
              <Store className="h-4 w-4" />
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pickup from</div>
          </div>
          <div className="font-semibold">Fresh15 Store</div>
          <div className="text-sm text-muted-foreground mt-1">Collect this order from the Fresh15 store counter</div>
          {substitutionItems.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/60">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Out-of-stock preferences
              </div>
              <ul className="space-y-2">
                {substitutionItems.map((it, i) => (
                  <li key={it._id ?? i}>
                    <div className="text-sm truncate">{itemName(it)}</div>
                    <SubstitutionNote item={it} className="mt-1" />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* COD collection */}
        {isCod && (
          <Card className={codPending ? "border-amber-500/40 bg-amber-500/5" : "border-success/30 bg-success/5"}>
            <div className="flex items-center gap-2 mb-3">
              <div
                className={
                  "grid place-items-center h-8 w-8 rounded-full " +
                  (codPending ? "bg-amber-500/15 text-amber-600" : "bg-success/15 text-success")
                }
              >
                {codPending ? <IndianRupee className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Cash on delivery
                </div>
                <div className="font-semibold mt-0.5">
                  {codPending ? `Collect ${formatMoney(collectedAmount)}` : "Payment collected"}
                </div>
              </div>
            </div>

            {codPending ? (
              <>
                <div className="text-sm text-muted-foreground">
                  Collect the exact order total from the customer before marking this delivery as delivered.
                </div>
                {canCollectCod ? (
                  <button
                    onClick={() => setConfirmCod(true)}
                    disabled={codBusy}
                    className="mt-3 w-full h-12 rounded-xl bg-amber-600 text-white font-semibold shadow-card disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <IndianRupee className="h-4 w-4" />
                    Collect {formatMoney(collectedAmount)}
                  </button>
                ) : (
                  <div className="mt-3 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
                    COD collection becomes available when the order is picked up or out for delivery.
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                The customer payment has been recorded. You can complete delivery normally.
              </div>
            )}
          </Card>
        )}

        {/* Door verification + proof */}
        {status === "OUT_FOR_DELIVERY" && (
          <Card className={proofRequired && !canCompleteVerified ? "border-primary/30 bg-primary/5" : ""}>
            <div className="flex items-center gap-2 mb-3">
              <div className="grid place-items-center h-8 w-8 rounded-full bg-primary/10 text-primary">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Door verification
                </div>
                <div className="font-semibold mt-0.5">
                  {proofRequired ? (otpVerified ? "OTP verified" : "OTP required") : "Optional proof of delivery"}
                </div>
              </div>
            </div>

            {proofRequired && !otpVerified && (
              <>
                <div className="text-sm text-muted-foreground">
                  Ask the customer for the 6-digit OTP shown in their Fresh15 app. Do not accept an OTP sent by anyone
                  else.
                </div>
                <button
                  onClick={() => setOtpOpen(true)}
                  className="mt-3 w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold"
                >
                  Enter delivery OTP
                </button>
              </>
            )}

            {proofRequired && otpVerified && !customerConfirmed && (
              <div className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-700">
                OTP verified. Ask the customer to tap <strong>Confirm I received my order</strong> in their Fresh15 app
                before completing delivery.
              </div>
            )}

            {proofRequired && otpVerified && customerConfirmed && (
              <div className="rounded-xl bg-success/10 p-3 text-sm font-semibold text-success">
                Customer confirmation received. You can complete the delivery.
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-border/60">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Proof of delivery
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border bg-background px-3 py-3 text-sm font-semibold">
                  <Camera className="h-4 w-4" /> Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={proofMutation.isPending}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) proofMutation.mutate({ type: "PHOTO", file });
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border bg-background px-3 py-3 text-sm font-semibold">
                  <PenLine className="h-4 w-4" /> Signature
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={proofMutation.isPending}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) proofMutation.mutate({ type: "SIGNATURE", file });
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
              {(delivery.proofOfDelivery?.photoUrl || delivery.proofOfDelivery?.signatureUrl) && (
                <div className="mt-3 flex gap-2">
                  {delivery.proofOfDelivery.photoUrl && (
                    <a
                      href={delivery.proofOfDelivery.photoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-primary underline"
                    >
                      View photo proof
                    </a>
                  )}
                  {delivery.proofOfDelivery.signatureUrl && (
                    <a
                      href={delivery.proofOfDelivery.signatureUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-primary underline"
                    >
                      View signature
                    </a>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Failed delivery */}
        {["ASSIGNED", "ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(status) && (
          <Card>
            <button
              onClick={() => setFailOpen(true)}
              className="w-full h-11 rounded-xl border border-destructive/30 text-destructive font-semibold"
            >
              Report failed delivery
            </button>
          </Card>
        )}

        {/* Customer */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="grid place-items-center h-8 w-8 rounded-full bg-accent/20 text-accent-foreground">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deliver to</div>
          </div>
          <div className="font-semibold truncate">{getCustomerName(delivery)}</div>
          {address && <div className="text-sm text-muted-foreground mt-2">{address}</div>}
          {getAddress(delivery)?.landmark && (
            <div className="text-xs text-muted-foreground mt-0.5">Landmark: {getAddress(delivery)?.landmark}</div>
          )}
          <div className="mt-3 flex gap-2">
            <ActionBtn
              icon={<Phone className="h-4 w-4" />}
              label="Call"
              disabled={!phone}
              onClick={() => {
                if (phone) window.location.href = `tel:${phone}`;
              }}
            />
            <ActionBtn
              icon={<Navigation className="h-4 w-4" />}
              label="Navigate"
              primary
              disabled={!address}
              onClick={() => {
                if (!address) return;
                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
                  "_blank",
                  "noopener",
                );
              }}
            />
          </div>
        </Card>

        {/* Items */}
        <Card>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Order items ({items.length})
          </div>
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground py-2">Item details are not available for this delivery.</div>
          ) : (
            <ul className="divide-y divide-border/60">
              {items.map((it, i) => (
                <li key={it._id ?? i} className="py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm truncate">{itemName(it)}</span>
                    <span className="text-sm font-medium text-muted-foreground shrink-0">
                      {itemQty(it)}
                      {it.unit ? ` ${it.unit}` : ""}
                    </span>
                  </div>
                  <SubstitutionNote item={it} />
                </li>
              ))}
            </ul>
          )}
          {typeof order?.grandTotal === "number" && (
            <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Order total</span>
              <span className="font-semibold">{formatMoney(order.grandTotal)}</span>
            </div>
          )}
        </Card>
      </div>

      {/* Sticky actions */}
      {next && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/60 safe-bottom">
          <div className="mx-auto max-w-2xl px-4 py-3 space-y-2">
            <button
              onClick={onPrimary}
              disabled={busy}
              className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-semibold shadow-elevated active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busy ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Mark as {DELIVERY_STATUS_LABEL[next]} <ChevronRight className="h-5 w-5" />
                </>
              )}
            </button>
            {canReject && (
              <button
                onClick={() => setConfirm("REJECTED")}
                disabled={busy}
                className="w-full h-11 rounded-2xl text-sm font-semibold text-destructive disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                <XCircle className="h-4 w-4" /> Reject order
              </button>
            )}
          </div>
        </div>
      )}

      {status === "DELIVERED" && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/60 safe-bottom">
          <div className="mx-auto max-w-2xl px-4 py-3">
            <Link
              to="/deliveries"
              className="w-full h-14 rounded-2xl bg-success text-success-foreground font-semibold flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-5 w-5" /> Delivered · Back to orders
            </Link>
          </div>
        </div>
      )}

      {/* Delivery OTP sheet */}
      {otpOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-center">Enter delivery OTP</h3>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Ask the customer for the OTP displayed in their Fresh15 app.
            </p>
            <input
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-5 w-full h-14 rounded-2xl border bg-background text-center text-2xl font-black tracking-[0.45em]"
              placeholder="000000"
              autoFocus
            />
            <button
              onClick={() =>
                otpMutation.mutate(otp, {
                  onSuccess: () => {
                    setOtp("");
                    setOtpOpen(false);
                  },
                })
              }
              disabled={otp.length !== 6 || otpMutation.isPending}
              className="mt-4 w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold disabled:opacity-60"
            >
              {otpMutation.isPending ? "Verifying…" : "Verify OTP"}
            </button>
            <button
              onClick={() => setOtpOpen(false)}
              disabled={otpMutation.isPending}
              className="mt-2 w-full h-11 text-sm text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Failed delivery sheet */}
      {failOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-center">Why did delivery fail?</h3>
            <select
              value={failReason}
              onChange={(e) => setFailReason(e.target.value)}
              className="mt-5 w-full h-12 rounded-xl border bg-background px-3 text-sm"
            >
              <option value="CUSTOMER_UNAVAILABLE">Customer unavailable</option>
              <option value="CUSTOMER_REFUSED">Customer refused</option>
              <option value="WRONG_ADDRESS">Wrong address</option>
              <option value="PHONE_UNREACHABLE">Phone unreachable</option>
              <option value="PAYMENT_ISSUE">Payment issue</option>
              <option value="DAMAGED_ORDER">Damaged order</option>
              <option value="SAFETY_ISSUE">Safety issue</option>
              <option value="OTHER">Other</option>
            </select>
            <textarea
              value={failNote}
              onChange={(e) => setFailNote(e.target.value.slice(0, 500))}
              placeholder="Optional note"
              className="mt-3 w-full min-h-24 rounded-xl border bg-background p-3 text-sm"
            />
            <button
              onClick={() =>
                failMutation.mutate(
                  { reason: failReason, note: failNote },
                  {
                    onSuccess: () => {
                      setFailOpen(false);
                      setFailNote("");
                      navigate({ to: "/deliveries" });
                    },
                  },
                )
              }
              disabled={failMutation.isPending}
              className="mt-4 w-full h-12 rounded-xl bg-destructive text-destructive-foreground font-semibold disabled:opacity-60"
            >
              {failMutation.isPending ? "Saving…" : "Mark delivery failed"}
            </button>
            <button
              onClick={() => setFailOpen(false)}
              disabled={failMutation.isPending}
              className="mt-2 w-full h-11 text-sm text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* COD confirmation sheet */}
      {confirmCod && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-scale"
          onClick={() => !codBusy && setConfirmCod(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up"
          >
            <div className="grid place-items-center h-14 w-14 rounded-2xl mb-4 mx-auto bg-amber-500/10 text-amber-600">
              <IndianRupee className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-center">Collect COD payment?</h3>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Confirm that you received{" "}
              <span className="font-semibold text-foreground">{formatMoney(collectedAmount)}</span> cash from{" "}
              {getCustomerName(delivery)}.
            </p>
            <button
              onClick={collectCod}
              disabled={codBusy}
              className="mt-6 w-full h-14 rounded-2xl bg-amber-600 text-white font-semibold shadow-elevated disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {codBusy ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" /> Yes, payment received
                </>
              )}
            </button>
            <button
              onClick={() => setConfirmCod(false)}
              disabled={codBusy}
              className="mt-2 w-full h-11 rounded-2xl text-sm text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Confirm sheet */}
      {confirm && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-scale"
          onClick={() => !busy && setConfirm(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up"
          >
            <div
              className={
                "grid place-items-center h-14 w-14 rounded-2xl mb-4 mx-auto " +
                (confirm === "REJECTED" ? "bg-destructive/10 text-destructive" : "bg-primary-soft text-primary")
              }
            >
              {confirm === "REJECTED" ? <XCircle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
            </div>
            <h3 className="text-lg font-semibold text-center">
              {confirm === "REJECTED" ? "Reject this order?" : "Confirm delivery?"}
            </h3>
            <p className="text-sm text-muted-foreground text-center mt-1">
              {confirm === "REJECTED"
                ? "The order goes back to the Fresh15 team for reassignment. This can't be undone."
                : `Confirm you've handed over ${getOrderNumber(delivery)} to ${getCustomerName(delivery)}.`}
            </p>
            <button
              onClick={() => run(confirm)}
              disabled={busy}
              className={
                "mt-6 w-full h-14 rounded-2xl font-semibold shadow-elevated disabled:opacity-60 flex items-center justify-center gap-2 " +
                (confirm === "REJECTED"
                  ? "bg-destructive text-destructive-foreground"
                  : "gradient-primary text-primary-foreground")
              }
            >
              {busy ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : confirm === "REJECTED" ? (
                "Yes, reject"
              ) : (
                "Yes, mark delivered"
              )}
            </button>
            <button
              onClick={() => setConfirm(null)}
              disabled={busy}
              className="mt-2 w-full h-11 rounded-2xl text-sm text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  primary,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        "flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 " +
        (primary ? "bg-primary text-primary-foreground shadow-card" : "bg-muted text-foreground hover:bg-muted/70")
      }
    >
      {icon} {label}
    </button>
  );
}
