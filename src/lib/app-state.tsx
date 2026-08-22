import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { PartnerUser } from "./auth-api";
import { updateAvailability } from "./profile-api";

interface AuthState {
  isAuthed: boolean;
  ready: boolean;
  user: PartnerUser | null;
  token: string | null;
  login: (user: PartnerUser, token: string) => void;
  setUser: (u: PartnerUser | ((prev: PartnerUser | null) => PartnerUser | null)) => void;
  logout: () => void;
}

interface AvailabilityState {
  online: boolean;
  pending: boolean;
  deliveryStatus: string | null;
  /** Sync UI from an authoritative backend value (e.g. profile fetch). */
  syncOnline: (isOnline: boolean, deliveryStatus?: string | null) => void;
  toggle: () => void;
}

interface ThemeState {
  theme: "light" | "dark";
  toggle: () => void;
}

const AuthCtx = createContext<AuthState | null>(null);
const AvailCtx = createContext<AvailabilityState | null>(null);
const ThemeCtx = createContext<ThemeState | null>(null);

const AUTH_KEY = "fr15_auth";

export function AppProviders({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PartnerUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(false);
  const [availPending, setAvailPending] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      try {
        const p = JSON.parse(stored) as { token?: string; user?: PartnerUser };
        if (p?.token && p?.user) {
          setToken(p.token);
          setUser(p.user);
        } else {
          localStorage.removeItem(AUTH_KEY);
        }
      } catch {
        localStorage.removeItem(AUTH_KEY);
      }
    }
    setReady(true);
    const t = localStorage.getItem("fr15_theme") as "light" | "dark" | null;
    if (t) setTheme(t);
    localStorage.removeItem("fr15_online");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("fr15_theme", theme);
  }, [theme]);


  const login = (u: PartnerUser, t: string) => {
    setUser(u);
    setToken(t);
    localStorage.setItem(AUTH_KEY, JSON.stringify({ user: u, token: t }));
  };
  const updateUser = useCallback(
    (next: PartnerUser | ((prev: PartnerUser | null) => PartnerUser | null)) => {
      setUser((prev) => {
        const value = typeof next === "function" ? next(prev) : next;

        if (value && token) {
          localStorage.setItem(
            AUTH_KEY,
            JSON.stringify({
              user: value,
              token,
            }),
          );
        }

        return value;
      });
    },
    [token],
  );
  const logout = () => {
    setUser(null);
    setToken(null);
    setOnline(false);
    setDeliveryStatus(null);
    localStorage.removeItem(AUTH_KEY);
  };

  const syncOnline = useCallback((isOnline: boolean, status?: string | null) => {
    setOnline(!!isOnline);
    if (status !== undefined) setDeliveryStatus(status ?? null);
  }, []);

  const toggleAvailability = useCallback(async () => {
    if (!token || availPending) return;
    const next = !online;
    setAvailPending(true);
    try {
      const { availability, message } = await updateAvailability(token, next);
      setOnline(!!availability?.isOnline);
      setDeliveryStatus(availability?.deliveryStatus ?? null);
      toast.success(message);
    } catch (e) {
      // Keep current UI state unchanged when the backend rejects the change.
      toast.error(e instanceof Error ? e.message : "Could not update availability");
    } finally {
      setAvailPending(false);
    }
  }, [token, online, availPending]);

  return (
    <ThemeCtx.Provider value={{ theme, toggle: () => setTheme((t) => (t === "light" ? "dark" : "light")) }}>
      <AuthCtx.Provider value={{ isAuthed: !!token && !!user, ready, user, token, login, setUser: updateUser, logout }}>
        <AvailCtx.Provider value={{ online, pending: availPending, deliveryStatus, syncOnline, toggle: () => void toggleAvailability() }}>{children}</AvailCtx.Provider>
      </AuthCtx.Provider>
    </ThemeCtx.Provider>
  );
}

export const useAuth = () => {
  const c = useContext(AuthCtx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
};
export const useAvailability = () => {
  const c = useContext(AvailCtx);
  if (!c) throw new Error("useAvailability outside provider");
  return c;
};
export const useTheme = () => {
  const c = useContext(ThemeCtx);
  if (!c) throw new Error("useTheme outside provider");
  return c;
};
