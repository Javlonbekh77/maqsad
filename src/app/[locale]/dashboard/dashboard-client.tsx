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
import HabitTracker from '@/components/profile/habit-tracker';

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
      // First, get a fresh user object to ensure all data is up-to-date
      const fetchedUser = await getUser(userToFetch.id);
      if (!fetchedUser) {
        throw new Error("Could not fetch user profile.");
      }
      const userTasks = await getScheduledTasksForUser(fetchedUser);

      setUser(fetchedUser);
      setTasks(userTasks);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      // In case of error, set a non-loading state to avoid infinite spinners
      setUser(userToFetch); // Fallback to the context user
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!authUser) {
        router.push('/login');
        return;
      }
      // Initial data fetch or fetch on user change
      fetchDashboardData(authUser);
    }
  }, [authUser, authLoading, router, fetchDashboardData]);

  const handleTaskCompletion = useCallback(async () => {
    // A task was completed, we need to re-fetch all data.
    if (authUser) {
      // No need to call refreshAuth, just re-fetch the data for the dashboard
      await fetchDashboardData(authUser);
    }
  }, [authUser, fetchDashboardData]);


  const isLoading = authLoading || loadingTasks || !user;

  if (isLoading) {
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
  
  if (!user) {
    // This case should ideally be handled by the redirect in useEffect
    return <AppLayout><p>Foydalanuvchi topilmadi. Tizimga qaytadan kiring.</p></AppLayout>;
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
            <div className="lg:col-span-2 space-y-8">
                 <TodaySchedule
                    tasks={tasks}
                    userId={user.id}
                    onTaskCompletion={handleTaskCompletion}
                />
                 <HabitTracker user={user} />
            </div>
            <div className="space-y-8">
                <QuickAccess />
            </div>
        </div>
      </div>
    </AppLayout>
  );
}
