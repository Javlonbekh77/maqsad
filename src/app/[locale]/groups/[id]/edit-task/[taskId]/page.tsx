'use client';

import { useTransition, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getTask, updateTask } from '@/lib/data';
import type { Task } from '@/lib/types';
import GoBackButton from '@/components/go-back-button';
import GroupTaskForm, { type GroupTaskFormValues } from '@/components/forms/group-task-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditGroupTaskPage() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const taskId = params.taskId as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (taskId) {
        getTask(taskId)
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

  const handleEditTask = async (values: GroupTaskFormValues) => {
    startTransition(async () => {
      try {
        await updateTask(taskId, values);
        toast({
          title: "Vazifa Yangilandi!",
          description: "Vazifa muvaffaqiyatli yangilandi.",
        });
        router.push(`/groups/${groupId}`);
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
            <CardTitle>Guruh Vazifasini Tahrirlash</CardTitle>
            <CardDescription>Ushbu vazifaning tafsilotlarini o'zgartiring.</CardDescription>
          </CardHeader>
          <CardContent>
            {task && (
                <GroupTaskForm 
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
