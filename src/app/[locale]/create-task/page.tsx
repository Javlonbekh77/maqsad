'use client';
import AppLayout from '@/components/layout/app-layout';
import CreateTaskChat from '@/components/tasks/create-task-chat';


export default function CreatePersonalTaskPage() {
  return (
    <AppLayout>
       <div className="space-y-8">
        <div className="rounded-lg bg-background/50 backdrop-blur-sm p-6 border">
            <h1 className="text-3xl font-bold font-display">Suhbat orqali Vazifa Yaratish</h1>
            <p className="text-muted-foreground mt-1">
                AI yordamchisiga nima qilmoqchi ekanligingizni ayting va u siz uchun vazifani yaratadi.
            </p>
        </div>
        <CreateTaskChat />
      </div>
    </AppLayout>
  );
}
