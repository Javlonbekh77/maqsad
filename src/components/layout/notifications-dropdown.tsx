'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bell, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import type { UserTask, User } from '@/lib/types';
import { getUserTasks } from '@/lib/data';
import { Link } from '@/navigation';
import { Badge } from '../ui/badge';

export default function NotificationsDropdown() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTodaysTasks = useCallback(async (currentUser: User) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const userTasks = await getUserTasks(currentUser);
      const incompleteTasks = userTasks.filter(task => !task.isCompleted);
      setTasks(incompleteTasks);
    } catch (error) {
      console.error("Failed to fetch today's tasks:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && user) {
      fetchTodaysTasks(user);
    }
  };

  const incompleteCount = tasks.length;

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative">
          <Bell className="h-5 w-5" />
          {incompleteCount > 0 && (
             <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                {incompleteCount}
            </span>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Today&apos;s Pending Tasks</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
        ) : tasks.length > 0 ? (
          tasks.map(task => (
            <Link key={task.id} href="/dashboard">
                <DropdownMenuItem className="flex justify-between items-center">
                    <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.groupName}</p>
                    </div>
                    <Badge variant="outline">{task.coins} coins</Badge>
                </DropdownMenuItem>
            </Link>
          ))
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
             <AlertCircle className="mx-auto h-8 w-8 mb-2" />
            <p>No pending tasks for today. Great job!</p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
