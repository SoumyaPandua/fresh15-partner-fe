import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn(
        "rounded-2xl bg-card border border-border/60 shadow-card p-4 animate-fade-scale",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Stat({
  label, value, icon, tone = "default",
}: { label: string; value: ReactNode; icon?: ReactNode; tone?: "default" | "primary" | "warm" }) {
  return (
    <div className={cn(
      "rounded-2xl p-4 border shadow-card overflow-hidden relative",
      tone === "primary" && "gradient-primary text-primary-foreground border-transparent",
      tone === "warm" && "gradient-warm text-white border-transparent",
      tone === "default" && "bg-card border-border/60",
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className={cn("text-[11px] uppercase tracking-wider font-medium", tone === "default" ? "text-muted-foreground" : "opacity-90")}>{label}</div>
        {icon && <div className="opacity-80">{icon}</div>}
      </div>
      <div className="mt-2 text-2xl font-bold font-[var(--font-display)] tracking-tight">{value}</div>
    </div>
  );
}

export function EmptyState({ icon, title, desc, action }: { icon: ReactNode; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-4 animate-fade-scale">
      <div className="grid place-items-center h-16 w-16 rounded-2xl bg-primary-soft text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-base">{title}</h3>
      {desc && <p className="text-sm text-muted-foreground mt-1 max-w-xs">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-1 mb-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{children}</h2>
      {action}
    </div>
  );
}

export function ListRow({ leading, title, subtitle, trailing, onClick }: {
  leading?: ReactNode; title: ReactNode; subtitle?: ReactNode; trailing?: ReactNode; onClick?: () => void;
}) {
  const Comp: any = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3.5 rounded-xl transition-colors text-left",
        onClick && "hover:bg-muted active:scale-[0.99]"
      )}
    >
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</div>}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </Comp>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60 disabled:cursor-not-allowed",
        checked ? "bg-primary" : "bg-muted-foreground/25"
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200",
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
