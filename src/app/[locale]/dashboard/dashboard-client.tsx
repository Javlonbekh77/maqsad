
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

  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const [userData, userTasks] = await Promise.all([
        getUserById(userId),
        getUserTasks(userId)
      ]);
      setUser(userData || null);
      setTasks(userTasks);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/login');
      return;
    }

    if (authUser?.id) {
      fetchData(authUser.id);
    }
  }, [authUser, authLoading, router, fetchData]);

  const isLoading = authLoading || loading || !user;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="grid gap-8">
          <div>
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-start">
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
          <h1 className="text-3xl font-bold font-display">{t('welcome', { name: user.firstName })}</h1>
          <p className="text-muted-foreground">{t('welcomeSubtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            <TodoList initialTasks={tasks} userId={user.id} onTaskCompletion={fetchData} />
          </div>
          <div>
            <HabitTracker user={user} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
