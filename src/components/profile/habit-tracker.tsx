'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { User, DayOfWeek, UserTask } from "@/lib/types";
import { format, add, startOfWeek, isSameDay, startOfDay, isToday, isBefore } from 'date-fns';
import { Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useEffect, useState } from "react";
import { isTaskScheduledForDate } from "@/lib/data";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import TaskDetailDialog from "../tasks/task-detail-dialog";

interface HabitTrackerProps {
  user: User;
  allTasks: UserTask[];
  onDataNeedsRefresh: () => void;
}

const getWeekDates = (start: Date): Date[] => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    dates.push(add(start, { days: i }));
  }
  return dates;
};

export default function HabitTracker({ user, allTasks, onDataNeedsRefresh }: HabitTrackerProps) {
  const [weekStartDate, setWeekStartDate] = useState(startOfWeek(new Date()));
  const [viewingTask, setViewingTask] = useState<UserTask | null>(null);
  
  const dates = useMemo(() => getWeekDates(weekStartDate), [weekStartDate]);
  
  useEffect(() => {
    if(onDataNeedsRefresh){
        onDataNeedsRefresh();
    }
  }, [user, onDataNeedsRefresh]);

  const tasksToDisplay = useMemo(() => {
    // Return an empty array if allTasks is not yet available to prevent errors.
    if (!allTasks) {
      return [];
    }
    // Filter tasks to show only those scheduled at least once in the current view week.
    return allTasks.filter(task => 
      dates.some(date => isTaskScheduledForDate(task, date))
    );
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
                <Button variant="outline" size="icon" onClick={() => setWeekStartDate(add(weekStartDate, { weeks: -1 }))}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium text-center w-32">
                    {format(weekStartDate, 'MMM d')} - {format(add(weekStartDate, { days: 6 }), 'MMM d')}
                </div>
                <Button variant="outline" size="icon" onClick={() => setWeekStartDate(add(weekStartDate, { weeks: 1 }))}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {tasksToDisplay.length > 0 ? (
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
                                        <Badge variant="outline" className="w-fit mt-1">{task.groupName}</Badge> : 
                                        <Badge variant="secondary" className="w-fit mt-1">Shaxsiy</Badge>
                                    }
                                </div>
                            </TableCell>
                            {dates.map(date => {
                                const isScheduled = isTaskScheduledForDate(task, date);
                                
                                // If not scheduled for this day, render a blank cell
                                if (!isScheduled) {
                                  return <TableCell key={date.toISOString()} className="text-center p-2 bg-muted/30">
                                     <span className="text-muted-foreground text-lg">-</span>
                                  </TableCell>
                                }

                                const completed = user.taskHistory.some(historyItem => 
                                  historyItem.taskId === task.id && isSameDay(new Date(historyItem.date), date)
                                );
                                
                                // Show 'X' only if the date is in the past and it was scheduled but not completed.
                                const isPastAndNotCompleted = isBefore(startOfDay(date), startOfDay(new Date())) && !completed;

                                return (
                                <TableCell key={date.toISOString()} className="text-center p-2">
                                    {completed ? (
                                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                                    ) : (
                                     isPastAndNotCompleted ? <X className="h-5 w-5 text-red-500 mx-auto" /> : <div className="h-5 w-5 mx-auto" />
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
