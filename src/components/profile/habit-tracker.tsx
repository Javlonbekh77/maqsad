'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Task, User, DayOfWeek } from "@/lib/types";
import { format, subDays, isSameDay, parse } from 'date-fns';
import { Check, X } from "lucide-react";
import { useMemo, useEffect, useState, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTasksForUserGroups } from "@/lib/data";

interface HabitTrackerProps {
  user: User;
}

const getPastDates = (days: number): Date[] => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    dates.push(subDays(today, i));
  }
  return dates.reverse();
};

export default function HabitTracker({ user }: HabitTrackerProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  const dates = useMemo(() => getPastDates(14), []);
  const userSchedules = useMemo(() => user.taskSchedules || [], [user.taskSchedules]);

  const fetchUserTasks = useCallback(async () => {
      setLoading(true);
      if (user.groups && user.groups.length > 0) {
        const tasks = await getTasksForUserGroups(user.groups);
        const scheduledTaskIds = new Set(userSchedules.map(s => s.taskId));
        const scheduledTasks = tasks.filter(t => scheduledTaskIds.has(t.id));
        setUserTasks(scheduledTasks);
        if (scheduledTasks.length > 0 && !selectedTaskId) {
            setSelectedTaskId(scheduledTasks[0].id);
        }
      } else {
        setUserTasks([]);
      }
      setLoading(false);
  }, [user.groups, userSchedules, selectedTaskId]);

  useEffect(() => {
    fetchUserTasks();
  }, [fetchUserTasks]);
  
  const selectedTask = userTasks.find(task => task.id === selectedTaskId);
  const selectedSchedule = userSchedules.find(s => s.taskId === selectedTaskId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Habit Tracker</CardTitle>
        <CardDescription>Your progress on tasks over the last 14 days.</CardDescription>
        <div className="pt-4">
             <Select onValueChange={setSelectedTaskId} value={selectedTaskId} disabled={loading || userTasks.length === 0}>
                <SelectTrigger className="w-full md:w-[280px]">
                    <SelectValue placeholder={loading ? "Loading tasks..." : "Select a task to track"} />
                </SelectTrigger>
                <SelectContent>
                    {userTasks.map(task => (
                        <SelectItem key={task.id} value={task.id}>
                            {task.title}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent>
        {selectedTask && selectedSchedule ? (
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px] sm:w-[200px]">Task</TableHead>
                  {dates.map(date => (
                    <TableHead key={date.toISOString()} className="text-center w-12 p-1">
                      <div className="flex flex-col items-center text-xs">
                        <span>{format(date, 'EEE')}</span>
                        <span className="font-normal text-muted-foreground">{format(date, 'd')}</span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">{selectedTask.title}</TableCell>
                  {dates.map(date => {
                    const dayOfWeek = format(date, 'EEEE') as DayOfWeek;
                    const isTaskScheduledForThisDay = selectedSchedule.days.includes(dayOfWeek);

                    if (!isTaskScheduledForThisDay) {
                      return (
                        <TableCell key={date.toISOString()} className="text-center bg-muted/30">
                          <span className="text-muted-foreground text-lg">-</span>
                        </TableCell>
                      );
                    }

                    const completed = user.taskHistory.some(historyItem => 
                      historyItem.taskId === selectedTask.id && isSameDay(parse(historyItem.date, 'yyyy-MM-dd', new Date()), date)
                    );
                    return (
                      <TableCell key={date.toISOString()} className="text-center">
                        {completed ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
            <div className="text-center py-8 text-muted-foreground">
                <p>
                  {userTasks.length > 0 
                  ? "Select a task from the dropdown to see your progress."
                  : "You are not in any groups with tasks yet, or you haven't scheduled any tasks."}
                </p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
