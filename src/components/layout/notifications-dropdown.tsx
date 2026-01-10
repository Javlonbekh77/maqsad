'use client';

import { useState, useEffect } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuFooter,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bell, AlertCircle, History, CheckCheck } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import type { User, UserTask } from '@/lib/types';
import { getNotificationsData, updateUserProfile } from '@/lib/data';
import { useRouter } from '@/navigation';
import { Skeleton } from '../ui/skeleton';
import { Timestamp } from 'firebase/firestore';

type NotificationData = {
    overdueTasks: UserTask[];
};

const fetcher = ([, user]: [string, User | null]): Promise<NotificationData> => {
    if (!user) return Promise.resolve({ overdueTasks: [] });
    return getNotificationsData(user);
};

export default function NotificationsDropdown() {
  const { user, refreshAuth } = useAuth();
  const { mutate } = useSWRConfig();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  
  const { data, isLoading } = useSWR(
    user ? ['notifications', user] : null, 
    fetcher,
    {
      refreshInterval: 60000, 
      dedupingInterval: 60000,
    }
  );

  useEffect(() => {
    if (isOpen && user) {
      // When dropdown is opened, update the last checked time
      const now = Timestamp.now();
      updateUserProfile(user.id, { notificationsLastCheckedAt: now }).then(() => {
         // Optimistically update the user object in auth context
         refreshAuth();
      });
    }
  }, [isOpen, user, refreshAuth]);
  

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
        // Optimistically clear notifications on the client
        mutate(['notifications', user], { overdueTasks: [] }, false);
        // And update the timestamp on the backend
        await updateUserProfile(user.id, { notificationsLastCheckedAt: Timestamp.now() });
        await refreshAuth();
    }
  };

  const handleItemClick = (e: React.MouseEvent, path: string) => {
      e.preventDefault();
      router.push(path);
      setIsOpen(false);
  }

  const totalNotifications = data?.overdueTasks?.length || 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
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
        <DropdownMenuLabel>Bildirishnomalar</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading && !data ? (
          <div className="p-2 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : totalNotifications > 0 && data ? (
            <>
                 {data.overdueTasks && data.overdueTasks.length > 0 && (
                    <>
                        <DropdownMenuLabel className="text-xs font-semibold text-destructive flex items-center gap-2"><History className='h-4 w-4' /> Vaqti o'tgan vazifalar</DropdownMenuLabel>
                        {data.overdueTasks.map(task => (
                             <DropdownMenuItem key={task.id} onClick={(e) => handleItemClick(e, '/dashboard')} className="flex justify-between items-center cursor-pointer">
                                 <div>
                                    <p className="font-medium">{task.title}</p>
                                    {task.groupName && <p className="text-xs text-muted-foreground">{task.groupName}</p>}
                                </div>
                            </DropdownMenuItem>
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
        {totalNotifications > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuFooter>
              <Button variant="ghost" size="sm" className="w-full" onClick={handleMarkAllRead}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Barchasini o'qilgan deb belgilash
              </Button>
            </DropdownMenuFooter>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
