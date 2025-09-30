
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from '@/navigation';
import AppLayout from "@/components/layout/app-layout";
import TodoList from "@/components/dashboard/todo-list";
import type { User, UserTask } from "@/lib/types";
import { useTranslations } from "next-intl";
import HabitTracker from "@/components/profile/habit-tracker";
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserById, getUserTasks } from '@/lib/data';

export default function DashboardClient() {
  const t = useTranslations('dashboard');
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchData = useCallback(async (userId: string) => {
    setLoadingData(true);
    try {
      // Auth context already provides the user, so we only need to fetch tasks
      const userTasks = await getUserTasks(userId);
      setTasks(userTasks);
    } catch (error) {
      console.error("Failed to fetch dashboard tasks:", error);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!authUser) {
        router.push('/login');
      } else {
        fetchData(authUser.id);
      }
    }
  }, [authUser, authLoading, router, fetchData]);

  const isLoading = authLoading || loadingData;

  if (isLoading || !authUser) {
    return (
      <AppLayout>
        <div className="grid gap-8">
          <div>
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="grid gap-8">
        <div>
          <h1 className="text-3xl font-bold font-display">{t('welcome', { name: authUser.firstName })}</h1>
          <p className="text-muted-foreground">{t('welcomeSubtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            <TodoList initialTasks={tasks} userId={authUser.id} onTaskCompletion={() => fetchData(authUser.id)} />
          </div>
          <div>
            <HabitTracker user={authUser} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
