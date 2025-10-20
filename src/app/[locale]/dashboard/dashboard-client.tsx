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
import DashboardStats from '@/components/dashboard/dashboard-stats';
import { Card } from '@/components/ui/card';
import QuickAccess from '@/components/dashboard/quick-access';

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

  const refreshUserData = useCallback(async () => {
    if (authUser) {
      const freshUser = await getUser(authUser.id);
      if(freshUser) {
        fetchData(freshUser);
      }
    }
  }, [authUser, fetchData]);

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

  if (isLoading || !authUser) {
    return (
      <AppLayout>
        <div className="grid gap-8">
          <div>
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="space-y-8">
               <Skeleton className="h-60 w-full" />
               <Skeleton className="h-60 w-full" />
            </div>
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

        <DashboardStats user={authUser} tasks={tasks} />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 grid gap-8">
             <TodaySchedule 
              tasks={tasks} 
              userId={authUser.id} 
              onTaskCompletion={refreshUserData} 
            />
             <HabitTracker user={authUser} />
          </div>

          <div className="space-y-8">
            <QuickAccess userGroups={authUser.groups} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
