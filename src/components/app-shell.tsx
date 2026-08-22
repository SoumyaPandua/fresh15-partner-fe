import { Link, useRouterState, useNavigate } from "@/lib/next-router-compat";
import { Home, Package, Wallet, TrendingUp, User, ArrowLeft, Bell, Moon, Sun } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAuth, useTheme } from "@/lib/app-state";
import { useUnreadCount } from "@/lib/notification-queries";

const TABS = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/deliveries", label: "Orders", icon: Package },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/performance", label: "Stats", icon: TrendingUp },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: s => s.location.pathname });
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-card/95 backdrop-blur-xl safe-bottom">
      <div className="mx-auto max-w-2xl grid grid-cols-5 px-2 pt-2">
        {TABS.map(t => {
          const active = pathname === t.to || pathname.startsWith(t.to + "/");
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "flex flex-col items-center gap-1 py-2 rounded-xl transition-all",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "relative flex items-center justify-center h-9 w-9 rounded-xl transition-all",
                active && "bg-primary-soft"
              )}>
                <Icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} strokeWidth={active ? 2.4 : 2} />
              </div>
              <span className={cn("text-[10px] font-medium tracking-wide", active && "font-semibold")}>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
}

export function PageHeader({ title, subtitle, back, right }: PageHeaderProps) {
  const navigate = useNavigate();
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      navigate({ to: "/dashboard" });
    }
  };
  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl border-b border-border/50 safe-top">
      <div className="mx-auto max-w-2xl flex items-center gap-3 px-4 py-3 min-h-14">
        {back && (
          <button
            onClick={goBack}
            className="grid place-items-center h-9 w-9 -ml-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold truncate leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}

export function TopBar({ children }: { children?: ReactNode }) {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl border-b border-border/50 safe-top">
      <div className="mx-auto max-w-2xl flex items-center gap-2 px-4 py-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="grid place-items-center h-9 w-9 rounded-xl gradient-primary text-primary-foreground font-bold text-sm">F15</div>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground leading-none">Fresh15</div>
            <div className="text-sm font-semibold leading-tight">Delivery Partner</div>
          </div>
        </div>
        {children}
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="grid place-items-center h-9 w-9 rounded-full hover:bg-muted transition-colors"
        >
          {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
        </button>
        <NotificationBell />
      </div>
    </header>
  );
}

function NotificationBell() {
  const { data: unread = 0 } = useUnreadCount();
  return (
    <Link to="/notifications" aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"} className="relative grid place-items-center h-9 w-9 rounded-full hover:bg-muted transition-colors">
      <Bell className="h-4.5 w-4.5" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 grid place-items-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none ring-2 ring-background">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}


export function AppLayout({ children, showNav = true }: { children: ReactNode; showNav?: boolean }) {
  return (
    <div className="min-h-screen bg-background">
      <div className={cn("mx-auto max-w-2xl", showNav && "pb-24")}>
        {children}
      </div>
      {showNav && <BottomNav />}
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthed, ready } = useAuth();
  const navigate = useNavigate();
  if (typeof window !== "undefined" && ready && !isAuthed) {
    // client-only redirect
    setTimeout(() => navigate({ to: "/login" }), 0);
    return null;
  }
  return <>{children}</>;
}
