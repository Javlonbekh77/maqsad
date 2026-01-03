'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from '@/navigation';
import AppLayout from "@/components/layout/app-layout";
import TodaySchedule from "@/components/dashboard/today-schedule";
import type { User, UserTask } from "@/lib/types";
import { useTranslations } from "next-intl";
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { getUser, getScheduledTasksForUser } from '@/lib/data';
import DashboardStats from '@/components/dashboard/dashboard-stats';
import QuickAccess from '@/components/dashboard/quick-access';

export default function DashboardClient() {
  const t = useTranslations('dashboard');
  const { user: authUser, loading: authLoading, refreshAuth } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [user, setUser] = useState<User | null>(authUser);

  const fetchDashboardData = useCallback(async (userToFetch: User) => {
    setLoadingTasks(true);
    try {
      const [fetchedUser, userTasks] = await Promise.all([
        getUser(userToFetch.id),
        getScheduledTasksForUser(userToFetch)
      ]);
      setUser(fetchedUser);
      setTasks(userTasks);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/login');
      return;
    }

    if (authUser) {
      fetchDashboardData(authUser);
    }
  }, [authUser, authLoading, router, fetchDashboardData]);

  const handleTaskCompletion = async () => {
    // Refresh all auth context data, which will trigger a re-render and re-fetch of tasks.
    if (authUser) {
      await refreshAuth();
      // After auth is refreshed, authUser in context is updated.
      // We need to wait for the next render cycle for the updated authUser to be passed down.
      // The useEffect listening to `authUser` will then re-trigger the data fetch.
    }
  };

  useEffect(() => {
    if(authUser) {
      fetchDashboardData(authUser);
    }
  }, [authUser, fetchDashboardData]);

  const isLoading = authLoading || loadingTasks || !user;

  if (isLoading || !user) {
    return (
      <AppLayout>
        <div className="grid gap-8">
          <div>
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </div>
           <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <Skeleton className="h-96 w-full lg:col-span-2" />
            <div className="space-y-8">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="grid gap-8">
        <div className="rounded-lg bg-background/50 backdrop-blur-sm p-6 border">
          <h1 className="text-3xl font-bold font-display">{t('welcome', { name: user.firstName })}</h1>
          <p className="text-muted-foreground mt-1">{t('welcomeSubtitle')}</p>
        </div>

        <DashboardStats user={user} tasks={tasks} />

        <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
                 <TodaySchedule
                    tasks={tasks}
                    userId={user.id}
                    onTaskCompletion={handleTaskCompletion}
                />
            </div>
            <div className="space-y-8">
                <QuickAccess />
            </div>
        </div>
      </div>
    </AppLayout>
  );
}
