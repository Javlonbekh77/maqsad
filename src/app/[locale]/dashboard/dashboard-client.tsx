'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from '@/navigation';
import AppLayout from "@/components/layout/app-layout";
import TodaySchedule from "@/components/dashboard/today-schedule";
import type { User, UserTask } from "@/lib/types";
import { useTranslations } from "next-intl";
import HabitTracker from "@/components/profile/habit-tracker";
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { getUser, getUserTasks } from '@/lib/data';

export default function DashboardClient() {
  const t = useTranslations('dashboard');
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const fetchData = useCallback(async (user: User) => {
    if (!user) return;
    setLoadingTasks(true);
    try {
      const userTasks = await getUserTasks(user);
      setTasks(userTasks);
    } catch (error) {
      console.error("Failed to fetch dashboard tasks:", error);
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!authUser) {
        router.push('/login');
      } else {
        fetchData(authUser);
      }
    }
  }, [authUser, authLoading, router, fetchData]);

  const isLoading = authLoading || loadingTasks;

  const handleTaskCompletion = useCallback(async () => {
    if(authUser) {
      // We need to re-fetch the authUser to get the latest taskHistory, then fetch tasks
      const freshUser = await getUser(authUser.id);
      if (freshUser) {
        fetchData(freshUser);
      }
    }
  }, [authUser, fetchData]);

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
          <TodaySchedule 
            tasks={tasks} 
            userId={authUser.id} 
            onTaskCompletion={handleTaskCompletion} 
          />
          <HabitTracker user={authUser} />
        </div>
      </div>
    </AppLayout>
  );
}
