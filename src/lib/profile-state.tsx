import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth, useAvailability } from "./app-state";
import {
  fetchProfile,
  updateProfile as apiUpdateProfile,
  uploadAvatar as apiUploadAvatar,
  type PartnerProfileDetails,
  type ProfilePayload,
  type ProfileUpdateInput,
} from "./profile-api";

interface ProfileState {
  profile: PartnerProfileDetails | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  save: (input: ProfileUpdateInput) => Promise<string>;
  saveAvatar: (file: File) => Promise<string>;
}

const Ctx = createContext<ProfileState | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { token, isAuthed, setUser } = useAuth();
  const { syncOnline } = useAvailability();
  const [profile, setProfile] = useState<PartnerProfileDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback(
    (payload: ProfilePayload) => {
      setProfile(payload.profile ?? {});
      setUser(payload.user);
      if (typeof payload.profile?.isOnline === "boolean") {
        syncOnline(payload.profile.isOnline, payload.profile.deliveryStatus ?? null);
      }
    },
    [setUser, syncOnline],
  );

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      apply(await fetchProfile(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [token, apply]);

  useEffect(() => {
    if (isAuthed && token) void refresh();
    if (!isAuthed) setProfile(null);
  }, [isAuthed, token, refresh]);

  const save = useCallback(
    async (input: ProfileUpdateInput) => {
      if (!token) throw new Error("You are signed out. Please sign in again.");
      const { payload, message } = await apiUpdateProfile(token, input);
      apply(payload);
      return message;
    },
    [token, apply],
  );

  const saveAvatar = useCallback(
    async (file: File) => {
      if (!token) throw new Error("You are signed out. Please sign in again.");
      const res = await apiUploadAvatar(token, file);
      setProfile(p => ({ ...(res.profile ?? p ?? {}), avatar: res.avatar || res.profileImage }));
      setUser(u => (u ? { ...u, profileImage: res.profileImage || res.avatar } : u));
      return res.message;
    },
    [token, setUser],
  );

  return (
    <Ctx.Provider value={{ profile, loading, error, refresh, save, saveAvatar }}>
      {children}
    </Ctx.Provider>
  );
}

export const useProfile = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useProfile outside provider");
  return c;
};
