// Shared demo data - order IDs mirror Customer App & Admin Dashboard so all
// three apps feel like one ecosystem.

// Delivery, earnings and wallet data now come from the real Fresh15 backend
// (see src/lib/delivery-api.ts). What remains here is presentation-only demo
// content for programmes the backend does not expose yet.

export const INCENTIVES = [
  { id: "i1", title: "Complete 10 deliveries today", progress: 7, target: 10, reward: 150 },
  { id: "i2", title: "Weekend warrior — 25 orders", progress: 18, target: 25, reward: 500 },
  { id: "i3", title: "Maintain 4.8+ rating this week", progress: 486, target: 480, reward: 200 },
];

// Notifications are now served by the real backend (see src/lib/notification-api.ts).


export const ACHIEVEMENTS = [
  { id: "a1", title: "100 Deliveries", desc: "Delivered 100 orders", unlocked: true, icon: "🏅" },
  { id: "a2", title: "5-Star Streak", desc: "10 five-star ratings in a row", unlocked: true, icon: "⭐" },
  { id: "a3", title: "Speed Demon", desc: "Avg. delivery under 20 min", unlocked: true, icon: "⚡" },
  { id: "a4", title: "500 Deliveries", desc: "Deliver 500 orders", unlocked: false, icon: "🏆" },
  { id: "a5", title: "Night Owl", desc: "50 late-night deliveries", unlocked: false, icon: "🌙" },
];

export const PARTNER_PROFILE = {
  name: "Arjun Kapoor",
  id: "FP-2041",
  phone: "+91 98765 43210",
  email: "arjun.k@fresh15.in",
  city: "Bengaluru",
  joinedAt: "2024-03-12",
  avatar: "AK",
  rating: 4.86,
  totalDeliveries: 428,
  vehicle: {
    type: "Motorcycle",
    model: "Honda Activa 6G",
    plate: "KA 05 MJ 7841",
    color: "White",
  },
  bank: {
    holder: "Arjun Kapoor",
    bank: "HDFC Bank",
    accountMasked: "••••4521",
    ifsc: "HDFC0001234",
  },
  documents: [
    { id: "d1", name: "Driving License", status: "verified", expires: "2029-08-14" },
    { id: "d2", name: "Aadhaar Card", status: "verified", expires: null },
    { id: "d3", name: "PAN Card", status: "verified", expires: null },
    { id: "d4", name: "Vehicle RC", status: "verified", expires: "2028-05-20" },
    { id: "d5", name: "Insurance", status: "expiring", expires: "2026-09-01" },
  ] as Array<{ id: string; name: string; status: "verified" | "expiring" | "missing"; expires: string | null }>,
};
