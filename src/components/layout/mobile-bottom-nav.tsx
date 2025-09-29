'use client';

import { Link, usePathname } from '@/navigation';
import {
  LayoutDashboard,
  Users,
  Trophy,
  UserCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function MobileBottomNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const currentUserId = 'user-1';

  const navItems = [
    { href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
    { href: '/groups', labelKey: 'groups', icon: Users },
    { href: '/leaderboard', labelKey: 'leaderboard', icon: Trophy },
    { href: `/profile/${currentUserId}`, labelKey: 'profile', icon: UserCircle },
  ];

  return (
    <div className="sm:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t">
      <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex flex-col items-center justify-center px-5 group ${
              pathname.startsWith(item.href)
                ? 'text-primary'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-xs">{t(item.labelKey)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
