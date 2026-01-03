'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { UserTask } from '@/lib/types';
import { Coins, Flame, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TaskCompletionDialogProps {
  task: UserTask;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function TaskCompletionDialog({ task, onConfirm, onCancel }: TaskCompletionDialogProps) {
  const t = useTranslations('taskCompletionDialog');
  const tActions = useTranslations('actions');
  const isPersonal = task.taskType === 'personal';

  return (
    <AlertDialog open onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('description', { taskTitle: task.title })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4 p-4 bg-secondary/50 rounded-lg border space-y-3">
            <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">{t('integrityTitle')}</h4>
            </div>
            <p className="text-sm text-muted-foreground">
                {t('integrityDescription')}
            </p>
            <div className={`flex items-center justify-end gap-2 text-lg font-bold pt-2 ${isPersonal ? 'text-blue-500' : 'text-amber-500'}`}>
                {t('earn')}
                {isPersonal ? <Flame className="h-5 w-5"/> : <Coins className="h-5 w-5"/>}
                <span>{t('coins', { count: task.coins })}</span>
            </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onCancel}>{tActions('cancel')}</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={onConfirm}>{t('confirmButton')}</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
