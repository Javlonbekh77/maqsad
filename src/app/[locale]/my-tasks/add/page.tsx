
'use client';

import { useTransition } from 'react';
import { useRouter } from '@/navigation';
import AppLayout from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { createPersonalTask } from '@/lib/data';
import GoBackButton from '@/components/go-back-button';
import PersonalTaskForm, { type PersonalTaskFormValues } from '@/components/forms/personal-task-form';

export default function AddPersonalTaskPage() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  
  const handleAddTask = async (values: PersonalTaskFormValues) => {
    if(!user) {
        toast({ title: "Xatolik", description: "Foydalanuvchi topilmadi. Iltimos, qayta tizimga kiring.", variant: "destructive" });
        return;
    }

    startTransition(async () => {
      try {
        const taskData = {
          ...values,
          userId: user.id,
        };
        await createPersonalTask(taskData);
        toast({
          title: "Shaxsiy Vazifa Yaratildi!",
          description: "Yangi odatingiz muvaffaqiyatli qo'shildi.",
        });
        router.push('/my-tasks');
      } catch (error) {
        console.error("Failed to create personal task", error);
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
            <CardTitle>Yangi Shaxsiy Vazifa</CardTitle>
            <CardDescription>Yangi odatlarni shakllantirish orqali o'z maqsadingiz sari intiling.</CardDescription>
          </CardHeader>
          <CardContent>
            <PersonalTaskForm 
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
