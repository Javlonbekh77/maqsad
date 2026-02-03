'use client';

import { Link, usePathname } from '@/navigation';
import {
  LayoutDashboard,
  Users,
  Trophy,
  UserCircle,
  ClipboardList,
  Clock,
  BookOpen,
  Compass,
  Newspaper
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '../ui/button';


export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const t = useTranslations('nav');

  const mainNavItems = [
    { href: '/news', label: t('news'), icon: Newspaper },
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/groups', label: t('groups'), icon: Users },
    { href: '/my-tasks', label: 'Vazifalar', icon: ClipboardList },
  ];

  const moreNavItems = [
    { href: '/explore', label: t('explore'), icon: Compass },
    { href: '/leaderboard', label: t('leaderboard'), icon: Trophy },
    { href: '/pomo-timer', label: 'Fokus Vaqti', icon: Clock },
    { href: '/kundalik', label: 'Kundalik', icon: BookOpen },
    { href: `/profile/${user?.id}`, label: t('profile'), icon: UserCircle },
  ]

  return (
    <div className="sm:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background/80 border-t backdrop-blur-sm">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
        {mainNavItems.map((item) => {
          const isActive = item.href === '/dashboard' 
              ? pathname === item.href 
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'inline-flex flex-col items-center justify-center px-2 group',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:bg-muted/50'
              )}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] text-center">{item.label}</span>
            </Link>
          );
        })}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="inline-flex flex-col items-center justify-center px-2 text-muted-foreground hover:bg-muted/50 group"
                >
                    <MoreHorizontal className="w-5 h-5 mb-1" />
                    <span className="text-[10px]">Ko'proq</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="mb-2 w-48">
                 {moreNavItems.map((item) => {
                    if (item.label === t('profile') && !user) return null;
                     const isActive = pathname.startsWith(item.href);
                     return (
                        <DropdownMenuItem key={item.href} asChild>
                            <Link
                                href={item.href}
                                className={cn('flex items-center gap-3', isActive && 'bg-muted')}
                            >
                                <item.icon className="w-4 h-4" />
                                <span>{item.label}</span>
                            </Link>
                        </DropdownMenuItem>
                     )
                 })}
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
