'use client';

import { useState, useCallback } from 'react';
import AppLayout from "@/components/layout/app-layout";
import TodaySchedule from "@/components/dashboard/today-schedule";
import type { User, UserTask } from "@/lib/types";
import { useTranslations } from "next-intl";
import DashboardStats from '@/components/dashboard/dashboard-stats';
import QuickAccess from '@/components/dashboard/quick-access';
import HabitTracker from '@/components/profile/habit-tracker';
import { getScheduledTasksForUser } from '@/lib/data';
import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';


function LoadingFallback() {
    return (
      <AppLayout>
        <div className="grid gap-8">
          <div className="rounded-lg bg-background/50 backdrop-blur-sm p-6 border">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </div>
           <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          <div className="grid lg:grid-cols-3 gap-8 items-start">
             <div className="lg:col-span-2 space-y-8">
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="space-y-8">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
}

const fetcher = ([key, user]: [string, User | null]) => {
  if (!user) {
    return Promise.resolve([]);
  }
  return getScheduledTasksForUser(user);
};

export default function DashboardClient() {
  const t = useTranslations('dashboard');
  const { user, loading: authLoading } = useAuth();

  const { data: tasks, error, mutate, isLoading } = useSWR(
    user ? ['scheduledTasks', user] : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const handleTaskCompletion = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const isLoadingData = authLoading || isLoading;

  if (isLoadingData || !user) {
    return <LoadingFallback />;
  }
  
  if (error) {
     return (
       <AppLayout>
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold">Could not load dashboard data.</h2>
          <p className="text-muted-foreground mt-2">Please try refreshing the page.</p>
        </div>
      </AppLayout>
     )
  }

  const allTasks = tasks || [];

  return (
    <AppLayout>
      <div className="grid gap-8">
        <div className="rounded-lg bg-background/50 backdrop-blur-sm p-6 border">
          <h1 className="text-3xl font-bold font-display">{t('welcome', { name: user.firstName })}</h1>
          <p className="text-muted-foreground mt-1">{t('welcomeSubtitle')}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                 <TodaySchedule
                    tasks={allTasks}
                    userId={user.id}
                    onTaskCompletion={handleTaskCompletion}
                />
                 <HabitTracker user={user} allTasks={allTasks} onDataNeedsRefresh={mutate} />
            </div>
            <div className="space-y-8">
                 <DashboardStats user={user} tasks={allTasks} />
                <QuickAccess />
            </div>
        </div>
      </div>
    </AppLayout>
  );
}
