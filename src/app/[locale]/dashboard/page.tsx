
import { getUserById, getUserTasks } from "@/lib/data";
import type { UserTask } from "@/lib/types";
import { getTranslations } from "next-intl/server";
import DashboardClient from "./dashboard-client";
import { auth } from "@/lib/firebase";
import { redirect } from "@/navigation";
import { useAuth } from "@/context/auth-context";


export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const t = await getTranslations('dashboard');
  
  // This is a server component, so we can't use the useAuth hook.
  // We will handle auth check in the client component.
  const userId = auth.currentUser?.uid;

  if (!userId) {
     // This case should be handled by the layout or a higher-level component wrapper
     // but we can add a safeguard. The client component will do the redirect.
     return <DashboardClient user={null} initialTasks={[]} />;
  }
  
  const user = await getUserById(userId);
  const tasks: UserTask[] = await getUserTasks(userId);
  
  if (!user) {
    return (
        <div className="flex items-center justify-center h-full">
          <p>{t('userNotFound')}</p>
        </div>
    );
  }

  return (
    <DashboardClient user={user} initialTasks={tasks} />
  );
}
