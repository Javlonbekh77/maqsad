'use client';

import DashboardClient from "./dashboard-client";

// This is now a client component to use hooks for data fetching.
// For server-side fetching, we'd need to adjust the structure significantly.
export default function DashboardPage() {
  return <DashboardClient />;
}
