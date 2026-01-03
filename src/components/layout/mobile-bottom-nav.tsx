'use client';

import { Link, usePathname } from '@/navigation';
import {
  LayoutDashboard,
  Users,
  Trophy,
  UserCircle,
  PlusSquare,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useTranslations } from 'next-intl';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const t = useTranslations('nav');

  const navItems = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/groups', label: t('groups'), icon: Users },
    { href: '/create-task', label: 'Add Task', icon: PlusSquare },
    { href: '/leaderboard', label: t('leaderboard'), icon: Trophy },
    { href: `/profile/${user?.id}`, label: t('profile'), icon: UserCircle },
  ];

  return (
    <div className="sm:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background/80 border-t backdrop-blur-sm">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
        {navItems.map((item) => (
           // Don't render profile link if user is not loaded
          (item.label === 'Profile' && !user) ? null :
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex flex-col items-center justify-center px-2 group ${
              pathname === item.href
                ? 'text-primary'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
