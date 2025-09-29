
'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Bell, Coins, Menu } from 'lucide-react';
import { Input } from '../ui/input';
import { getUserById } from '@/lib/data';
import { Link, usePathname } from '@/navigation';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '../language-switcher';
import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';

export default function AppHeader() {
  const t = useTranslations();
  const pathname = usePathname();
  // In a real app, this would come from an auth context
  const currentUserId = 'user-1';
  const [currentUser, setCurrentUser] = useState<User | null | undefined>(undefined);
  
  useEffect(() => {
    async function fetchUser() {
      const user = await getUserById(currentUserId);
      setCurrentUser(user);
    }
    fetchUser();
  }, [currentUserId]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
       <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t('header.searchPlaceholder')}
          className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-secondary"
        />
      </div>

      <div className="flex items-center gap-4 md:gap-2 lg:gap-4">
        <LanguageSwitcher />
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">{t('header.toggleNotifications')}</span>
        </Button>
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-500">
            <Coins className="h-5 w-5"/>
            <span>{currentUser?.coins || 0}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser?.avatarUrl} alt={currentUser?.fullName} />
                <AvatarFallback>{currentUser?.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('header.myAccount')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/profile/${currentUserId}`}>{t('nav.profile')}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>{t('header.settings')}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{t('header.logout')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
