
'use client';

import { useEffect } from 'react';
import { useRouter } from '@/navigation';
import AppLayout from "@/components/layout/app-layout";
import TodoList from "@/components/dashboard/todo-list";
import type { User, UserTask } from "@/lib/types";
import { useTranslations } from "next-intl";
import HabitTracker from "@/components/profile/habit-tracker";
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardClientProps {
  user: User | null;
  initialTasks: UserTask[];
}

export default function DashboardClient({ user: serverUser, initialTasks }: DashboardClientProps) {
  const t = useTranslations('dashboard');
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const currentUser = user || serverUser;

  if (loading || !currentUser) {
    return (
      <AppLayout>
        <div className="grid gap-8">
          <div>
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </div>
          <div className="grid gap-8 items-start">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="grid gap-8">
        <div>
          <h1 className="text-3xl font-bold font-display">{t('welcome', { name: currentUser.firstName })}</h1>
          <p className="text-muted-foreground">{t('welcomeSubtitle')}</p>
        </div>

        <div className="grid gap-8 items-start">
          <div>
            <TodoList initialTasks={initialTasks} userId={currentUser.id} />
          </div>
          <div>
            <HabitTracker user={currentUser} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
