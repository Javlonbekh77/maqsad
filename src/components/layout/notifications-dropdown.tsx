'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bell, AlertCircle, CalendarClock, ListTodo, History } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import type { UserTask, User, WeeklyMeeting } from '@/lib/types';
import { getNotificationsData } from '@/lib/data';
import { Link } from '@/navigation';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';

type NotificationData = {
    todayTasks: UserTask[];
    overdueTasks: UserTask[];
    todayMeetings: (WeeklyMeeting & { groupName: string })[];
};

const fetcher = ([, user]: [string, User | null]) => {
    if (!user) return Promise.resolve({ todayTasks: [], overdueTasks: [], todayMeetings: [] });
    return getNotificationsData(user);
};

function showBrowserNotification(title: string, options: NotificationOptions) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, options);
  }
}

export default function NotificationsDropdown() {
  const { user } = useAuth();
  const [hasShownOverdue, setHasShownOverdue] = useState(false);

  // Use SWR for automatic re-fetching every 30 seconds
  const { data: notifications, isLoading } = useSWR(
    ['notifications', user], 
    fetcher,
    {
      refreshInterval: 30000, // 30 seconds
      dedupingInterval: 30000,
    }
  );
  
  useEffect(() => {
    if (notifications && notifications.overdueTasks.length > 0 && !hasShownOverdue) {
      showBrowserNotification("Vaqti o'tgan vazifalar mavjud!", {
        body: `${notifications.overdueTasks.length} ta vazifangizning vaqti o'tib ketgan.`,
        icon: '/logo.svg', // Make sure you have a logo in /public/logo.svg
      });
      // Set flag to true to avoid spamming the user with notifications
      setHasShownOverdue(true); 
    } else if (notifications && notifications.overdueTasks.length === 0) {
      // Reset the flag if there are no more overdue tasks
      setHasShownOverdue(false);
    }
  }, [notifications, hasShownOverdue]);


  const totalNotifications = notifications ? (notifications.todayTasks.length + notifications.overdueTasks.length + notifications.todayMeetings.length) : 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative">
          <Bell className="h-5 w-5" />
          {totalNotifications > 0 && (
             <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                {totalNotifications}
            </span>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Bildirishnomalar</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading && !notifications ? (
          <div className="p-2 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : totalNotifications > 0 && notifications ? (
            <>
                {notifications.todayMeetings.length > 0 && (
                    <>
                        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-2"><CalendarClock className='h-4 w-4' /> Bugungi uchrashuvlar</DropdownMenuLabel>
                        {notifications.todayMeetings.map(meeting => (
                            <Link key={meeting.id} href={`/groups/${meeting.groupId}?tab=meetings`}>
                                <DropdownMenuItem className="flex justify-between items-center">
                                    <p className="font-medium">{meeting.title}</p>
                                    <Badge variant="secondary">{meeting.groupName}</Badge>
                                </DropdownMenuItem>
                            </Link>
                        ))}
                         <DropdownMenuSeparator />
                    </>
                )}
                 {notifications.todayTasks.length > 0 && (
                    <>
                        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-2"><ListTodo className='h-4 w-4' /> Bugungi vazifalar</DropdownMenuLabel>
                        {notifications.todayTasks.map(task => (
                             <Link key={task.id} href="/dashboard">
                                <DropdownMenuItem className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{task.title}</p>
                                        <p className="text-xs text-muted-foreground">{task.groupName}</p>
                                    </div>
                                    <Badge variant="outline">{task.coins} coins</Badge>
                                </DropdownMenuItem>
                            </Link>
                        ))}
                         <DropdownMenuSeparator />
                    </>
                )}
                 {notifications.overdueTasks.length > 0 && (
                    <>
                        <DropdownMenuLabel className="text-xs font-semibold text-destructive flex items-center gap-2"><History className='h-4 w-4' /> Vaqti o'tgan vazifalar</DropdownMenuLabel>
                        {notifications.overdueTasks.map(task => (
                             <Link key={task.id} href="/dashboard">
                                <DropdownMenuItem className="flex justify-between items-center">
                                     <div>
                                        <p className="font-medium">{task.title}</p>
                                        <p className="text-xs text-muted-foreground">{task.groupName}</p>
                                    </div>
                                </DropdownMenuItem>
                            </Link>
                        ))}
                    </>
                )}
            </>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
             <AlertCircle className="mx-auto h-8 w-8 mb-2" />
            <p>Hozircha yangi bildirishnomalar yo'q.</p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
