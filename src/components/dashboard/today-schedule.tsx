'use client';

import { useState, useCallback } from 'react';
import type { UserTask } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Coins, Clock, CalendarPlus } from 'lucide-react';
import TaskCompletionDialog from './task-completion-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { completeUserTask } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';

interface TodayScheduleProps {
  tasks: UserTask[];
  userId: string;
  onTaskCompletion: (userId: string) => void;
}

export default function TodaySchedule({ tasks, userId, onTaskCompletion }: TodayScheduleProps) {
  const t = useTranslations('todoList');
  const [selectedTask, setSelectedTask] = useState<UserTask | null>(null);

  const handleCompleteClick = useCallback((task: UserTask) => {
    setSelectedTask(task);
  }, []);

  const handleConfirmCompletion = useCallback(async () => {
    if (!selectedTask || !userId) return;
    
    await completeUserTask(userId, selectedTask.id, selectedTask.coins);

    setSelectedTask(null);
    onTaskCompletion(userId); // Re-fetch all data to ensure consistency
  }, [selectedTask, userId, onTaskCompletion]);
  
  const activeTasks = tasks.filter(t => !t.isCompleted);
  const completedTasks = tasks.filter(t => t.isCompleted);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Bugungi Reja</CardTitle>
          <CardDescription>Bugungi vazifalaringiz va ularning holati.</CardDescription>
        </CardHeader>
        <CardContent>
          {activeTasks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vazifa</TableHead>
                  <TableHead>Guruh</TableHead>
                  <TableHead>Vaqt</TableHead>
                  <TableHead className="text-right">Holat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                        <Badge variant="outline">{task.groupName}</Badge>
                    </TableCell>
                    <TableCell>
                        {task.time ? (
                            <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {task.time}
                            </div>
                        ) : (
                            <span className="text-muted-foreground">-</span>
                        )}
                    </TableCell>
                    <TableCell className="text-right">
                       <Button size="sm" onClick={() => handleCompleteClick(task)}>
                        <Check className="w-4 h-4 mr-2" />
                        {t('completeButton')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Check className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-2 text-lg font-medium">{t('allTasksCompleted')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t('allTasksCompletedSub')}</p>
            </div>
          )}

          {completedTasks.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">{t('completedTasksTitle')}</h3>
              <ul className="space-y-3">
                {completedTasks.map((task) => (
                   <li key={task.id} className="flex items-center p-3 rounded-lg bg-secondary/30 text-muted-foreground">
                    <Check className="w-5 h-5 mr-3 text-green-500" />
                    <span className="line-through">{task.title}</span>
                    <Badge variant="secondary" className="ml-auto">{task.groupName}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
      {selectedTask && (
        <TaskCompletionDialog
          task={selectedTask}
          onConfirm={handleConfirmCompletion}
          onCancel={() => setSelectedTask(null)}
        />
      )}
    </>
  );
}
