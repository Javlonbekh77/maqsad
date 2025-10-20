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
import { Coins } from 'lucide-react';
import { Link, useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '../language-switcher';
import { useAuth } from '@/context/auth-context';
import GlobalSearch from './global-search';
import NotificationsDropdown from './notifications-dropdown';

export default function AppHeader() {
  const t = useTranslations();
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
        {/* Skeleton loader can be added here */}
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
       <GlobalSearch />

      <div className="flex items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <LanguageSwitcher />
        <NotificationsDropdown />

        <div className="flex items-center gap-2 text-sm font-semibold text-amber-500">
            <Coins className="h-5 w-5"/>
            <span>{user?.coins || 0}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
                <AvatarFallback>{user?.firstName?.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('header.myAccount')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={user ? { pathname: '/profile/[id]', params: { id: user.id } } : '/login'}>{t('nav.profile')}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">{t('header.settings')}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>{t('header.logout')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
