
import DashboardClient from "./dashboard-client";

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  // All data fetching is now handled on the client side in DashboardClient
  // to avoid server-side Firebase auth issues.
  return <DashboardClient />;
}
