'use client';

import { useState } from 'react';
import AppLayout from "@/components/layout/app-layout";
import TodaySchedule from "@/components/dashboard/today-schedule";
import type { User, UserTask } from "@/lib/types";
import { useTranslations } from "next-intl";
import DashboardStats from '@/components/dashboard/dashboard-stats';
import QuickAccess from '@/components/dashboard/quick-access';
import HabitTracker from '@/components/profile/habit-tracker';

interface DashboardClientProps {
    user: User;
    initialTasks: UserTask[];
    onTaskCompletion: () => Promise<void>;
}

export default function DashboardClient({ user, initialTasks, onTaskCompletion }: DashboardClientProps) {
  const t = useTranslations('dashboard');
  const [tasks, setTasks] = useState<UserTask[]>(initialTasks);

  const handleTaskCompletion = async () => {
    await onTaskCompletion();
    // The parent `DashboardPage` will re-fetch and pass new props,
    // which will automatically update the `initialTasks` and re-render this component.
    // However, to see instant updates, we can optimistically update or just rely on the parent's re-render.
    // For simplicity, we let the parent handle the re-fetch and re-render.
  };

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
                    title="Bugungi Reja"
                    description="Sizning bugungi rejalashtirgan barcha vazifalaringiz."
                    tasks={tasks}
                    userId={user.id}
                    onTaskCompletion={handleTaskCompletion}
                />
                 <HabitTracker user={user} />
            </div>
            <div className="space-y-8">
                 <DashboardStats user={user} tasks={tasks} />
                <QuickAccess />
            </div>
        </div>
      </div>
    </AppLayout>
  );
}
