import { Ban, Check, Clock, PackageSearch, PhoneCall, Repeat2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DELIVERY_FLOW,
  DELIVERY_STATUS_LABEL,
  SUBSTITUTION_LABEL,
  getReplacementProduct,
  getSubstitutionPreference,
  replacementImage,
  replacementName,
  type DeliveryOrderItem,
  type DeliveryStatus,
  type SubstitutionPreference,
} from "@/lib/delivery-api";

const STATUS_COLORS: Record<DeliveryStatus, string> = {
  PENDING: "bg-muted text-muted-foreground border-border",
  ASSIGNED: "bg-info/15 text-info border-info/30",
  ACCEPTED: "bg-primary/15 text-primary border-primary/30",
  PICKED_UP: "bg-warning/20 text-warning-foreground border-warning/40",
  OUT_FOR_DELIVERY: "bg-accent/20 text-accent-foreground border-accent/40",
  DELIVERED: "bg-success/15 text-success border-success/30",
  REJECTED: "bg-destructive/15 text-destructive border-destructive/30",

  // Required because DeliveryStatus now supports assignment timeout.
  EXPIRED: "bg-warning/20 text-warning-foreground border-warning/40",

  FAILED: "bg-destructive/15 text-destructive border-destructive/30",
  CANCELLED: "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ status }: { status: DeliveryStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
        STATUS_COLORS[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {DELIVERY_STATUS_LABEL[status]}
    </span>
  );
}

export function OrderTimeline({ current }: { current: DeliveryStatus }) {
  const closed = current === "REJECTED" || current === "FAILED" || current === "CANCELLED";
  const currentIdx = DELIVERY_FLOW.indexOf(current);
  return (
    <ol className="space-y-0">
      {DELIVERY_FLOW.map((s, i) => {
        const done = currentIdx >= 0 && i < currentIdx;
        const active = i === currentIdx;
        return (
          <li key={s} className="flex gap-3 relative">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "grid place-items-center h-8 w-8 rounded-full border-2 transition-all shrink-0",
                  done && "bg-primary border-primary text-primary-foreground",
                  active && "bg-primary-soft border-primary text-primary animate-bounce-in",
                  !done && !active && "bg-background border-border text-muted-foreground",
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" />
                ) : active ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <div className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
                {active && (
                  <span className="absolute inline-flex h-8 w-8 rounded-full bg-primary/40 animate-pulse-ring" />
                )}
              </div>
              {i < DELIVERY_FLOW.length - 1 && <div className={cn("w-0.5 h-8", done ? "bg-primary" : "bg-border")} />}
            </div>
            <div className={cn("pb-6 pt-1", done || active ? "text-foreground" : "text-muted-foreground")}>
              <div className={cn("text-sm font-medium", active && "text-primary")}>{DELIVERY_STATUS_LABEL[s]}</div>
              <div className="text-xs text-muted-foreground">
                {done ? "Completed" : active ? "In progress" : closed ? "Not reached" : "Pending"}
              </div>
            </div>
          </li>
        );
      })}
      {closed && (
        <li className="flex gap-3">
          <div className="grid place-items-center h-8 w-8 rounded-full border-2 border-destructive/40 bg-destructive/10 text-destructive shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
          </div>
          <div className="pt-1">
            <div className="text-sm font-medium text-destructive">{DELIVERY_STATUS_LABEL[current]}</div>
            <div className="text-xs text-muted-foreground">This delivery was closed</div>
          </div>
        </li>
      )}
    </ol>
  );
}

/* ---------- out-of-stock substitution guidance (customer preference, read-only) ---------- */

const SUBSTITUTION_STYLES: Record<SubstitutionPreference, { cls: string; Icon: typeof PhoneCall }> = {
  CALL_ME: { cls: "bg-info/10 text-info border-info/30", Icon: PhoneCall },
  BEST_SIMILAR: { cls: "bg-primary/10 text-primary border-primary/30", Icon: Repeat2 },
  DO_NOT_SUBSTITUTE: { cls: "bg-destructive/10 text-destructive border-destructive/30", Icon: Ban },
  SPECIFIC_REPLACEMENT: { cls: "bg-accent/20 text-accent-foreground border-accent/40", Icon: PackageSearch },
};

/** Compact badge + optional replacement product shown under each order item. Renders nothing when the backend sends no preference. */
export function SubstitutionNote({ item, className }: { item: DeliveryOrderItem; className?: string }) {
  const pref = getSubstitutionPreference(item);
  if (!pref) return null;

  const { cls, Icon } = SUBSTITUTION_STYLES[pref];
  const product = getReplacementProduct(item);
  const name = replacementName(product);
  const image = replacementImage(product);

  return (
    <div className={cn("mt-1.5 space-y-1.5", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border",
          cls,
        )}
      >
        <Icon className="h-3 w-3" />
        If out of stock: {SUBSTITUTION_LABEL[pref]}
      </span>
      {pref === "SPECIFIC_REPLACEMENT" && (name || image) && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-2 py-1.5">
          {image && (
            <img
              src={image}
              alt={name ?? "Preferred replacement"}
              loading="lazy"
              className="h-8 w-8 rounded-md object-cover shrink-0"
            />
          )}
          <span className="text-[11px] text-muted-foreground truncate">
            Replace with <span className="font-medium text-foreground">{name ?? "selected item"}</span>
          </span>
        </div>
      )}
    </div>
  );
}
