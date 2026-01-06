
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { User, DayOfWeek, PersonalTask, Task, UserTask, TaskSchedule } from "@/lib/types";
import { format, add, startOfWeek, isSameDay, isToday, startOfDay, isWithinInterval, parseISO } from 'date-fns';
import { Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useEffect, useState, useCallback } from "react";
import { getTasksForUserGroups, getPersonalTasksForUser, isTaskScheduledForDate, getGroupTasksForUser } from "@/lib/data";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { Timestamp } from "firebase/firestore";
import TaskDetailDialog from "../tasks/task-detail-dialog";

interface HabitTrackerProps {
  user: User;
  isCurrentUserProfile?: boolean;
}

const getWeekDates = (start: Date): Date[] => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    dates.push(add(start, { days: i }));
  }
  return dates;
};

const toDate = (timestamp: Timestamp | Date): Date => {
    if (timestamp instanceof Date) {
        return timestamp;
    }
    return timestamp.toDate();
}

export default function HabitTracker({ user, isCurrentUserProfile = true }: HabitTrackerProps) {
  const [weekStartDate, setWeekStartDate] = useState(startOfWeek(new Date()));
  const [allTasks, setAllTasks] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingTask, setViewingTask] = useState<UserTask | null>(null);
  
  const dates = useMemo(() => getWeekDates(weekStartDate), [weekStartDate]);
  const userSchedules = useMemo(() => user.taskSchedules || [], [user.taskSchedules]);

  const fetchUserTasks = useCallback(async () => {
      setLoading(true);
      
      const personalTasksPromise = getPersonalTasksForUser(user.id, !isCurrentUserProfile);
      const groupTasksPromise = getGroupTasksForUser(user);
      
      const [personalTasks, groupTasks] = await Promise.all([personalTasksPromise, groupTasksPromise]);
      
      const allPersonalTasks = personalTasks.map(t => ({...t, taskType: 'personal'}) as UserTask)

      const combinedTasks: UserTask[] = [...groupTasks, ...allPersonalTasks];

      setAllTasks(combinedTasks.map(task => {
          if (task.taskType === 'group') {
              const userSchedule = user.taskSchedules?.find(s => s.taskId === task.id);
              return { ...task, schedule: userSchedule ? userSchedule.schedule : task.schedule };
          }
          return task;
      }));

      setLoading(false);
  }, [user, isCurrentUserProfile]);

  useEffect(() => {
    fetchUserTasks();
  }, [fetchUserTasks]);

  const goToPreviousWeek = () => {
    setWeekStartDate(add(weekStartDate, { weeks: -1 }));
  };

  const goToNextWeek = () => {
    setWeekStartDate(add(weekStartDate, { weeks: 1 }));
  };
  
  const tasksToDisplay = useMemo(() => {
    return allTasks.filter(task => {
      // Check if the task is scheduled for any day in the current visible week
      return dates.some(date => isTaskScheduledForDate(task, date));
    });
  }, [allTasks, dates]);


  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
                <CardTitle>Odatlar Jadvali</CardTitle>
                <CardDescription>Tanlangan hafta uchun vazifalardagi yutuqlaringiz.</CardDescription>
            </div>
             <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium text-center w-32">
                    {format(weekStartDate, 'MMM d')} - {format(add(weekStartDate, { days: 6 }), 'MMM d')}
                </div>
                <Button variant="outline" size="icon" onClick={goToNextWeek}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
           <Skeleton className="h-40 w-full" />
        ) : tasksToDisplay.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px] sm:w-[200px]">Vazifa</TableHead>
                  {dates.map(date => (
                    <TableHead key={date.toISOString()} className="text-center w-12 p-1">
                      <div className={cn("flex flex-col items-center text-xs rounded-md p-1", isToday(date) && "bg-primary/10 text-primary font-bold")}>
                        <span>{format(date, 'EEE')}</span>
                        <span className="font-normal">{format(date, 'd')}</span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                 {tasksToDisplay.map(task => {
                    return (
                        <TableRow key={task.id}>
                            <TableCell 
                                className="font-medium cursor-pointer hover:underline"
                                onClick={() => setViewingTask(task)}
                            >
                                <div className="flex flex-col">
                                    <span>{task.title}</span>
                                    {task.taskType === 'group' ? 
                                        <Badge variant="outline" className="w-fit mt-1">Guruh</Badge> : 
                                        <Badge variant="secondary" className="w-fit mt-1">Shaxsiy</Badge>
                                    }
                                </div>
                            </TableCell>
                            {dates.map(date => {
                                const currentDate = startOfDay(date);
                                const isScheduled = isTaskScheduledForDate(task, currentDate);
                                
                                if (!isScheduled) {
                                  return <TableCell key={date.toISOString()} className="text-center p-2"></TableCell>
                                }

                                const completed = user.taskHistory.some(historyItem => 
                                historyItem.taskId === task.id && isSameDay(new Date(historyItem.date), date)
                                );
                                return (
                                <TableCell key={date.toISOString()} className="text-center p-2">
                                    {completed ? (
                                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                                    ) : (
                                     currentDate < startOfDay(new Date()) ? <X className="h-5 w-5 text-red-500 mx-auto" /> : <div className="h-5 w-5 mx-auto" />
                                    )}
                                </TableCell>
                                );
                            })}
                        </TableRow>
                    );
                 })}
              </TableBody>
            </Table>
          </div>
        ) : (
            <div className="text-center py-8 text-muted-foreground">
                <p>
                  Rejalashtirilgan vazifalar topilmadi.
                </p>
            </div>
        )}
      </CardContent>
    </Card>
    {viewingTask && (
        <TaskDetailDialog
            task={viewingTask}
            isOpen={!!viewingTask}
            onClose={() => setViewingTask(null)}
        />
    )}
    </>
  );
}
