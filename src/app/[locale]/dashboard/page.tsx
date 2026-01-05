'use client';
import { Suspense, useEffect, useState, useCallback } from 'react';
import DashboardClient from "./dashboard-client";
import AppLayout from '@/components/layout/app-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { useRouter } from '@/navigation';
import { getUser, getScheduledTasksForUser } from '@/lib/data';
import type { User, UserTask } from '@/lib/types';

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

export default function DashboardPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(authUser);
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const fetchDashboardData = useCallback(async (userToFetch: User | null) => {
    if (!userToFetch) {
        setDataLoading(false);
        return;
    }
    setDataLoading(true);
    try {
      const fetchedUser = await getUser(userToFetch.id);
      if (!fetchedUser) {
        throw new Error("Could not fetch user profile.");
      }
      const userTasks = await getScheduledTasksForUser(fetchedUser);

      setUser(fetchedUser);
      setTasks(userTasks);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      // In case of error, still set some user data to avoid blank screen
      setUser(userToFetch); 
      setTasks([]);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!authUser) {
        router.push('/login');
      } else {
        fetchDashboardData(authUser);
      }
    }
  }, [authUser, authLoading, router, fetchDashboardData]);

  const handleTaskCompletion = useCallback(async () => {
    if (authUser) {
      await fetchDashboardData(authUser);
    }
  }, [authUser, fetchDashboardData]);

  const isLoading = authLoading || dataLoading;

  return (
    <Suspense fallback={<LoadingFallback />}>
        {isLoading ? (
            <LoadingFallback />
        ) : user ? (
            <DashboardClient 
                user={user} 
                initialTasks={tasks}
                onTaskCompletion={handleTaskCompletion}
            />
        ) : (
            <AppLayout>
                <p>Foydalanuvchi topilmadi. Tizimga qaytadan kiring.</p>
            </AppLayout>
        )}
    </Suspense>
  );
}
