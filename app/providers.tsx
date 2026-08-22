"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { AppProviders } from "@/lib/app-state";
import { ProfileProvider } from "@/lib/profile-state";
import { RealtimeProvider } from "@/lib/realtime";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 10_000, refetchOnWindowFocus: false, retry: 1 },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AppProviders>
        <ProfileProvider>
          <RealtimeProvider>
            {children}
            <Toaster position="top-center" richColors closeButton />
          </RealtimeProvider>
        </ProfileProvider>
      </AppProviders>
    </QueryClientProvider>
  );
}
