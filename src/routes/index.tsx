"use client";

import { createFileRoute, useNavigate } from "@/lib/next-router-compat";
import { useEffect } from "react";
import { useAuth } from "@/lib/app-state";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { isAuthed, ready } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!ready) return;
    navigate({ to: isAuthed ? "/dashboard" : "/login", replace: true });
  }, [isAuthed, ready, navigate]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="grid place-items-center h-16 w-16 rounded-3xl gradient-primary text-primary-foreground font-bold text-2xl animate-pulse">F15</div>
    </div>
  );
}
