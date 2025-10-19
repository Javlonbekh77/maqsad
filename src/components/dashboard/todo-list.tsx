'use client';

import { useState, useEffect } from 'react';
import type { UserTask } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Coins, Info } from 'lucide-react';
import TaskCompletionDialog from './task-completion-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { completeUserTask } from '@/lib/data';

interface TodoListProps {
  initialTasks: UserTask[];
  userId: string;
  onTaskCompletion: (userId: string) => void;
}

export default function TodoList({ initialTasks, userId, onTaskCompletion }: TodoListProps) {
  const t = useTranslations('todoList');
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTask, setSelectedTask] = useState<UserTask | null>(null);
  
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const handleCompleteClick = (task: UserTask) => {
    setSelectedTask(task);
  };

  const handleConfirmCompletion = async () => {
    if (!selectedTask || !userId) return;
    
    await completeUserTask(userId, selectedTask.id, selectedTask.coins);

    setSelectedTask(null);
    onTaskCompletion(userId); // Re-fetch all data to ensure consistency
  };

  const activeTasks = tasks.filter(t => !t.isCompleted);
  const completedTasks = tasks.filter(t => t.isCompleted);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {activeTasks.length > 0 ? (
            <ul className="space-y-4">
              <AnimatePresence>
                {activeTasks.map((task, index) => (
                  <motion.li
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50, transition: { duration: 0.3 } }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border"
                  >
                    <div className="flex-1 pr-4">
                      <p className="font-semibold">{task.title}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Info className="w-3 h-3"/>
                        {task.groupName}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 font-semibold text-amber-500">
                        <Coins className="w-4 h-4" />
                        <span>{task.coins}</span>
                      </div>
                      <Button size="sm" onClick={() => handleCompleteClick(task)}>
                        <Check className="w-4 h-4 mr-2" />
                        {t('completeButton')}
                      </Button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
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
