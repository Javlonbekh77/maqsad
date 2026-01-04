'use client';

import { useTransition, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getPersonalTask, updatePersonalTask } from '@/lib/data';
import type { PersonalTask } from '@/lib/types';
import GoBackButton from '@/components/go-back-button';
import PersonalTaskForm, { type PersonalTaskFormValues } from '@/components/forms/personal-task-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditPersonalTaskPage() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;

  const [task, setTask] = useState<PersonalTask | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (taskId) {
        getPersonalTask(taskId)
            .then(taskData => {
                if(taskData) {
                    setTask(taskData);
                } else {
                    toast({ title: "Xatolik", description: "Vazifa topilmadi.", variant: "destructive" });
                    router.back();
                }
            })
            .finally(() => setLoading(false));
    }
  }, [taskId, toast, router]);

  const handleEditTask = async (values: PersonalTaskFormValues) => {
    startTransition(async () => {
      try {
        const updatedData: Partial<PersonalTask> = values;
        await updatePersonalTask(taskId, updatedData);
        toast({
          title: "Vazifa Yangilandi!",
          description: "Vazifa muvaffaqiyatli yangilandi.",
        });
        router.push('/my-tasks');
      } catch (error) {
        console.error("Failed to update task", error);
        toast({
          title: "Xatolik",
          description: "Vazifani yangilashda xatolik yuz berdi.",
          variant: "destructive",
        });
      }
    });
  };
  
  if (loading) {
    return (
        <AppLayout>
            <div className="space-y-8">
                <GoBackButton />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/3" />
                        <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-8">
                         <Skeleton className="h-10 w-full" />
                         <Skeleton className="h-24 w-full" />
                         <Skeleton className="h-10 w-full" />
                         <Skeleton className="h-10 w-full" />
                         <div className='flex justify-end'>
                            <Skeleton className="h-10 w-24" />
                         </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <GoBackButton />
        <Card>
          <CardHeader>
            <CardTitle>Shaxsiy Vazifani Tahrirlash</CardTitle>
            <CardDescription>Ushbu vazifaning tafsilotlarini o'zgartiring.</CardDescription>
          </CardHeader>
          <CardContent>
            {task && (
                <PersonalTaskForm 
                    onSubmit={handleEditTask} 
                    isPending={isPending}
                    initialData={task}
                    submitButtonText="O'zgarishlarni Saqlash"
                />
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
