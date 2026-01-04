'use client';

import { useState, useCallback, useMemo } from 'react';
import type { UserTask, DayOfWeek } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Coins, Clock, ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import TaskCompletionDialog from './task-completion-dialog';
import { useTranslations } from 'next-intl';
import { completeUserTask, isTaskScheduledForDate } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { addDays, format, isToday, isYesterday, isTomorrow, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';

interface TodayScheduleProps {
  tasks: UserTask[];
  userId: string;
  onTaskCompletion: () => void;
}

const toDate = (timestamp: Timestamp | Date): Date => {
    if (timestamp instanceof Date) {
        return timestamp;
    }
    return timestamp.toDate();
}

export default function TodaySchedule({ tasks, userId, onTaskCompletion }: TodayScheduleProps) {
  const t = useTranslations('todoList');
  const [selectedTask, setSelectedTask] = useState<UserTask | null>(null);
  const [displayDate, setDisplayDate] = useState(() => startOfDay(new Date()));

  const handleCompleteClick = useCallback((task: UserTask) => {
    setSelectedTask(task);
  }, []);

  const handleConfirmCompletion = useCallback(async () => {
    if (!selectedTask || !userId) return;
    
    await completeUserTask(userId, selectedTask);

    setSelectedTask(null);
    onTaskCompletion();
  }, [selectedTask, userId, onTaskCompletion]);

  const changeDay = (amount: number) => {
    setDisplayDate(prev => addDays(prev, amount));
  };

  const { activeTasks, completedTasks } = useMemo(() => {
    const displayDateStr = format(displayDate, 'yyyy-MM-dd');

    const tasksForDay = tasks.filter(task => isTaskScheduledForDate(task, displayDate));

    const active = tasksForDay.filter(t => {
      const history = (t as any).history || [];
      return !history.some((h: any) => h.date === displayDateStr);
    });

    const completed = tasksForDay.filter(t => {
       const history = (t as any).history || [];
       return history.some((h: any) => h.date === displayDateStr);
    });

    return { activeTasks: active, completedTasks: completed };

  }, [tasks, displayDate]);

  const dateTitle = useMemo(() => {
    if (isToday(displayDate)) return "Bugungi Reja";
    if (isYesterday(displayDate)) return "Kechagi Reja";
    if (isTomorrow(displayDate)) return "Ertangi Reja";
    return format(displayDate, 'MMMM d, yyyy');
  }, [displayDate]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{dateTitle}</CardTitle>
              <CardDescription>Sizning rejalashtirgan vazifalaringiz.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => changeDay(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => changeDay(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeTasks.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vazifa</TableHead>
                  <TableHead>Turi</TableHead>
                  <TableHead className="text-right">Mukofot</TableHead>
                  <TableHead className="text-right">Holat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                        {task.taskType === 'group' ? 
                            <Badge variant="outline">{task.groupName}</Badge> : 
                            <Badge variant="secondary">Shaxsiy</Badge>
                        }
                    </TableCell>
                    <TableCell className="text-right">
                         <div className={`flex items-center justify-end gap-1 font-semibold ${task.taskType === 'group' ? 'text-amber-500' : 'text-slate-500'}`}>
                            {task.taskType === 'group' ? <Coins className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
                            <span>{task.coins}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                       <Button size="sm" onClick={() => handleCompleteClick(task)} disabled={!isToday(displayDate)}>
                        <Check className="w-4 h-4 mr-2" />
                        {t('completeButton')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {activeTasks.length === 0 && completedTasks.length === 0 && (
            <div className="text-center py-8">
              <Check className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-2 text-lg font-medium">Ushbu kunga vazifalar yo'q</h3>
              <p className="mt-1 text-sm text-muted-foreground">Yoki barcha vazifalar bajarilgan!</p>
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
                     {task.taskType === 'group' ? 
                        <Badge variant="secondary" className="ml-auto">{task.groupName}</Badge> :
                        <Badge variant="default" className="ml-auto bg-blue-500/10 text-blue-700 border-blue-500/20 hover:bg-blue-500/20">Shaxsiy</Badge>
                    }
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
