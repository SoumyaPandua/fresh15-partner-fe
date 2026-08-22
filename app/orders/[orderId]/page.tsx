"use client";

import { Route } from "@/routes/orders.$orderId";

export const dynamic = "force-dynamic";

export default function Page() {
  return <Route.component />;
}
