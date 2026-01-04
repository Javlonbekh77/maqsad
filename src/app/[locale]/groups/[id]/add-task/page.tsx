'use client';

import { useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createTask } from '@/lib/data';
import type { TaskSchedule } from '@/lib/types';
import GoBackButton from '@/components/go-back-button';
import GroupTaskForm, { type GroupTaskFormValues } from '@/components/forms/group-task-form';

export default function AddGroupTaskPage() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const handleAddTask = async (values: GroupTaskFormValues) => {
    startTransition(async () => {
      try {
        await createTask({ ...values, groupId, schedule: values.schedule as TaskSchedule });
        toast({
          title: "Vazifa Yaratildi!",
          description: "Yangi vazifa guruhga muvaffaqiyatli qo'shildi.",
        });
        router.push(`/groups/${groupId}`);
      } catch (error) {
        console.error("Failed to create task", error);
        toast({
          title: "Xatolik",
          description: "Vazifani yaratishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <GoBackButton />
        <Card>
          <CardHeader>
            <CardTitle>Yangi Guruh Vazifasi</CardTitle>
            <CardDescription>Guruh a'zolaringiz uchun yangi vazifa qo'shing.</CardDescription>
          </CardHeader>
          <CardContent>
            <GroupTaskForm 
              onSubmit={handleAddTask} 
              isPending={isPending}
              submitButtonText="Vazifani Yaratish"
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
