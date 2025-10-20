'use client';

import { useState, useCallback } from 'react';
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
import { format, isSameDay, isPast, startOfDay } from 'date-fns';

type NotificationData = {
    todayTasks: UserTask[];
    overdueTasks: UserTask[];
    todayMeetings: (WeeklyMeeting & { groupName: string })[];
};

export default function NotificationsDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData>({
      todayTasks: [],
      overdueTasks: [],
      todayMeetings: [],
  });
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async (currentUser: User) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await getNotificationsData(currentUser);
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && user) {
      fetchNotifications(user);
    }
  };

  const totalNotifications = notifications.todayTasks.length + notifications.overdueTasks.length + notifications.todayMeetings.length;

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
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
        {loading ? (
          <DropdownMenuItem disabled>Yuklanmoqda...</DropdownMenuItem>
        ) : totalNotifications > 0 ? (
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
