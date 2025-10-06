'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from '@/navigation';
import AppLayout from "@/components/layout/app-layout";
import TodoList from "@/components/dashboard/todo-list";
import type { User, UserTask, Group, Task } from "@/lib/types";
import { useTranslations } from "next-intl";
import HabitTracker from "@/components/profile/habit-tracker";
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';

export default function DashboardClient() {
  const t = useTranslations('dashboard');
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const getUserTasks = useCallback(async (user: User): Promise<UserTask[]> => {
    if (!user || !user.groups || user.groups.length === 0) {
      return [];
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Firestore 'in' query has a limit of 30 elements in the array.
    const groupIds = user.groups.slice(0, 30);
    if(groupIds.length === 0) return [];

    const tasksQuery = query(collection(db, 'tasks'), where('groupId', 'in', groupIds));
    const tasksSnapshot = await getDocs(tasksQuery);
    const tasksForUser = tasksSnapshot.docs.map(doc => doc.data() as Task);
    
    const allGroupsSnapshot = await getDocs(query(collection(db, 'groups'), where('__name__', 'in', groupIds)));
    const groupMap = new Map(allGroupsSnapshot.docs.map(doc => [doc.id, doc.data().name]));

    return tasksForUser.map(task => {
        const isCompletedToday = user.taskHistory.some(h => h.taskId === task.id && h.date === today);
        return {
            ...task,
            groupName: groupMap.get(task.groupId) || 'Unknown Group',
            isCompleted: isCompletedToday,
        };
    });
  }, []);

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
  }, [getUserTasks]);

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

  const handleTaskCompletion = () => {
    if(authUser) {
      // We need to re-fetch the authUser to get the latest taskHistory, then fetch tasks
      const userDocRef = doc(db, 'users', authUser.id);
      getDoc(userDocRef).then(docSnap => {
        if (docSnap.exists()) {
          const freshUser = { ...docSnap.data(), id: docSnap.id, firebaseId: docSnap.id } as User;
          fetchData(freshUser);
        }
      });
    }
  }

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
          <TodoList 
            initialTasks={tasks} 
            userId={authUser.id} 
            onTaskCompletion={handleTaskCompletion} 
          />
          <HabitTracker user={authUser} />
        </div>
      </div>
    </AppLayout>
  );
}
