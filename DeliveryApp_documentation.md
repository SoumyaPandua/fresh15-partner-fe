# Fresh15 Delivery Partner App — Documentation

## Overview

The **Fresh15 Delivery Partner** app is the rider-facing mobile web application in the Fresh15 15-minute grocery delivery ecosystem. It gives delivery partners a lightweight, mobile-first interface to receive orders, complete pickups and drop-offs, track earnings, manage documents, and monitor performance.

This documentation covers the current **frontend-only demo build** (mock data, mock APIs) so you can understand what the product does, how each screen behaves, and how it relates to the other two apps in the Fresh15 platform.

---

## The Fresh15 Ecosystem

Fresh15 is built as three connected applications that share the same order lifecycle and data model:

| App | Audience | Purpose |
|---|---|---|
| **Customer App** | Shoppers | Browse catalogue, place orders, track live delivery, rate the partner. |
| **Admin Dashboard** | Operations team | Manage stores, catalogue, orders, partners, payouts, incentives. |
| **Delivery Partner App** (this repo) | Riders | Accept assigned orders, pick up from the store, deliver to the customer, track earnings and performance. |

The same order IDs, customer IDs, and store IDs flow through all three apps. When an order is created in the Customer App it appears in the Admin Dashboard, then gets dispatched to a Partner in this app. Status updates made here (Accepted → Picked Up → Delivered) propagate back so the customer and admin see the same state.

---

## Order Status Flow

Every order transitions through this exact sequence. All three apps read/write against the same set of states.

```
Assigned  →  Accepted  →  Reached Store  →  Picked Up  →  Out For Delivery  →  Delivered
                                                                         ↘  Cancelled
```

| Status | Trigger | Who sets it |
|---|---|---|
| `Assigned` | Admin dispatches order to partner | Admin Dashboard / auto-assign engine |
| `Accepted` | Partner taps Accept in this app | Delivery Partner App |
| `Reached Store` | Partner arrives at pickup location | Delivery Partner App |
| `Picked Up` | Partner confirms items collected | Delivery Partner App |
| `Out For Delivery` | Partner starts trip to customer | Delivery Partner App |
| `Delivered` | Partner verifies OTP shown by customer | Delivery Partner App |
| `Cancelled` | Customer/admin cancels, or partner declines | Customer App / Admin |

Delivery is confirmed via an **OTP the customer sees in the Customer App** and reads out to the partner. The partner enters it in this app to close the order — the same OTP mechanism the Customer App generates.

---

## Features & Use Cases

### 1. Authentication
- **Login** — Email-based sign-in (mobile number auth is planned for later).
- **OTP verification** — 4-digit code (`1234` for the demo). On success the session is stored in `localStorage` and the partner lands on the dashboard.
- **Forgot Password** — Sends a reset code to the partner's email and routes into the OTP screen.

### 2. Availability Toggle
Partners flip themselves **Online / Offline** from the profile screen or the app top bar. When offline, they won't be assigned new orders. State persists across sessions.

### 3. Dashboard (Home)
The mission-control screen for the shift:
- Today's earnings, today's completed deliveries.
- Acceptance rate, customer rating.
- Active order card with quick actions.
- Shortcuts to Wallet, Performance, and Notifications.

### 4. Active Order & Order Details
- **Pickup details** — store name, address, items to collect.
- **Customer details** — masked name, drop address, call/message shortcuts.
- **Live status updates** — one-tap transitions through the status flow above.
- **Delivery OTP entry** — enter the code from the customer to mark `Delivered`.

### 5. Deliveries (Orders History)
Chronological list of past and in-progress orders with filter by status. Tapping an order opens the same detail screen used for the active order.

### 6. Wallet
- Current balance, lifetime earnings.
- Transaction history (deliveries, incentives, adjustments).
- Withdraw / payout entry point (mocked).

### 7. Performance
- Rating breakdown, on-time %, acceptance %, cancellation %.
- Trend chips for the last 7 / 30 days.
- Achievements & tier (e.g. Gold).

### 8. Profile
Central hub for the partner's account:
- **Documents** — KYC docs with `verified / expiring / missing` status and re-upload.
- **Vehicle details** — plate, model, insurance.
- **Bank details** — payout account (masked).
- **Settings** — dark mode, push notifications, order sounds, biometric login, language.
- **Help & Support** — support entry point.
- **Sign out**.

### 9. Notifications
Order alerts, payout confirmations, and platform announcements.

### 10. Theming
Full **light and dark mode** with a shared design language (Bricolage Grotesque display + Inter body, green primary) that matches the Customer App and Admin Dashboard.

---

## UX Details

- **Mobile-first, responsive to tablet** — content is centred in a `max-w-2xl` column.
- **Bottom tab navigation** — Home · Orders · Wallet · Stats · Profile.
- **Sub-pages** (Documents, Vehicle, Bank, Settings, Support, Notifications) use a header with a **Back** button that returns to the previous screen — so `Profile → Documents → Back` returns to Profile, not the dashboard.
- Consistent primitives: `Card`, `Stat`, `ListRow`, `EmptyState`, `Skeleton`, `Toggle`, `SectionTitle`.
- Skeleton loading, empty states, pull-to-refresh style animations, safe-area padding for notch/home-indicator.

---

## Technical Architecture

- **Framework** — TanStack Start (React 19 + Vite 7), file-based routing under `src/routes/`.
- **Styling** — Tailwind CSS v4 with semantic tokens in `src/styles.css` (never hard-coded colours).
- **State** — Lightweight React context providers in `src/lib/app-state.tsx` for auth, availability, and theme, all persisted in `localStorage`.
- **Data** — Static demo data in `src/lib/demo-data.ts`. All network activity is mocked with `setTimeout` + `sonner` toasts.
- **Components** — Shared UI in `src/components/ui-bits.tsx`, shell/layout in `src/components/app-shell.tsx`, order-specific pieces in `src/components/order-bits.tsx`.
- **Routing** — Every top-level feature is its own route file, so backend integration can be dropped in per screen without touching siblings.

### Folder map

```
src/
├─ routes/               file-based routes (login, otp, dashboard, deliveries, orders.$orderId, wallet, performance, profile, documents, vehicle, bank, settings, support, notifications, forgot-password)
├─ components/           app-shell, ui-bits, order-bits
├─ lib/                  app-state (contexts), demo-data, utils
└─ styles.css            design tokens + Tailwind v4 theme
```

---

## Ready for Backend Integration

The app is intentionally structured so each screen fetches its own data and dispatches its own mutations. To go live:

1. Replace `demo-data.ts` with API clients (TanStack Query is already wired in `__root.tsx`).
2. Swap the mock login flow in `src/routes/login.tsx` + `otp.tsx` for a real auth provider.
3. Point order status transitions in `orders.$orderId.tsx` at the same order endpoints used by the Customer App and Admin Dashboard.
4. Wire the availability toggle and push notifications to your dispatch service.

Because IDs, statuses, and vocabulary already match the Customer App and Admin Dashboard, all three apps can share a single backend without translation layers.

## Delivery module — live backend integration

The delivery lifecycle is no longer demo data. It is served by
`https://fresh15-main.onrender.com`:

| Purpose | Endpoint |
| --- | --- |
| Rider's deliveries (optionally `?status=`) | `GET /api/delivery/my` |
| Single delivery | `GET /api/delivery/:id` |
| Rider status transition | `PATCH /api/delivery/:id/status` |

Statuses accepted by the backend validator: `ACCEPTED`, `PICKED_UP`,
`OUT_FOR_DELIVERY`, `DELIVERED`, `REJECTED`, `CANCELLED`. `PENDING` and
`ASSIGNED` are set by the admin assignment flow and cannot be written by a
rider, so the partner app only ever offers the next valid transition
(Assigned → Accept → Picked Up → Out for Delivery → Delivered) plus Reject
while the order is still unaccepted.

Code map:
- `src/lib/delivery-api.ts` — typed API client, status metadata, safe readers
  for the populated order/address payload.
- `src/lib/delivery-queries.ts` — TanStack Query hooks with 30s foreground
  polling and cache invalidation after a status change.
- `src/lib/delivery-stats.ts` — earnings, acceptance rate and the 7-day chart
  derived from real delivery records (the backend has no earnings endpoint).

Still demo-only, clearly scoped: incentives, achievements, notifications, and
the availability toggle (no rider-availability endpoint exists yet — it is
persisted locally on the device). Payout history is intentionally shown as
unavailable rather than faked.

## Notifications — live backend integration

Notifications are served by `https://fresh15-main.onrender.com`:

| Purpose | Endpoint |
| --- | --- |
| List | `GET /api/notification` |
| Unread badge count | `GET /api/notification/unread-count` |
| Mark one read | `PATCH /api/notification/:id/read` |
| Mark all read | `PATCH /api/notification/read-all` |
| Delete | `DELETE /api/notification/:id` |

Code map: `src/lib/notification-api.ts` (typed client, kind/target helpers) and
`src/lib/notification-queries.ts` (TanStack Query hooks, 30s foreground polling,
invalidation after mutations). Opening a notification marks it read and, when
`metadata.deliveryId`/`orderId` is present, navigates to the delivery detail
screen. The header bell shows the real unread count.
