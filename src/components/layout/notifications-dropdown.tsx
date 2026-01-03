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
import { Bell, AlertCircle, CalendarClock, ListTodo, History, CheckCheck } from 'lucide-react';
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
  const { data, isLoading, mutate } = useSWR(
    ['notifications', user], 
    fetcher,
    {
      refreshInterval: 30000,
      dedupingInterval: 30000,
    }
  );
  
  useEffect(() => {
    if (data && data.overdueTasks.length > 0 && !hasShownOverdue) {
      showBrowserNotification("Vaqti o'tgan vazifalar mavjud!", {
        body: `${data.overdueTasks.length} ta vazifangizning vaqti o'tib ketgan.`,
        icon: '/logo.svg',
      });
      setHasShownOverdue(true); 
    } else if (data && data.overdueTasks.length === 0) {
      setHasShownOverdue(false);
    }
  }, [data, hasShownOverdue]);
  
  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.preventDefault();
    // In a real app, you'd call a function here to mark all as read on the backend.
    // For now, we'll just clear them on the client side for an immediate visual effect.
    mutate({ todayTasks: [], overdueTasks: [], todayMeetings: [] }, false);
  };

  const totalNotifications = data ? (data.todayTasks.length + data.overdueTasks.length + data.todayMeetings.length) : 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative">
          <Bell className="h-5 w-5" />
          {totalNotifications > 0 && (
             <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                {totalNotifications > 9 ? '9+' : totalNotifications}
            </span>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between pr-2">
            <DropdownMenuLabel>Bildirishnomalar</DropdownMenuLabel>
            {totalNotifications > 0 && (
                 <button onClick={handleMarkAllRead} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                    <CheckCheck className="h-3 w-3" />
                    Barchasini o'qish
                </button>
            )}
        </div>
        <DropdownMenuSeparator />
        {isLoading && !data ? (
          <div className="p-2 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : totalNotifications > 0 && data ? (
            <>
                {data.todayMeetings.length > 0 && (
                    <>
                        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-2"><CalendarClock className='h-4 w-4' /> Bugungi uchrashuvlar</DropdownMenuLabel>
                        {data.todayMeetings.map(meeting => (
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
                 {data.todayTasks.length > 0 && (
                    <>
                        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-2"><ListTodo className='h-4 w-4' /> Bugungi vazifalar</DropdownMenuLabel>
                        {data.todayTasks.map(task => (
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
                 {data.overdueTasks.length > 0 && (
                    <>
                        <DropdownMenuLabel className="text-xs font-semibold text-destructive flex items-center gap-2"><History className='h-4 w-4' /> Vaqti o'tgan vazifalar</DropdownMenuLabel>
                        {data.overdueTasks.map(task => (
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
