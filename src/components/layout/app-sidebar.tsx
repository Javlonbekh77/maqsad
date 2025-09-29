
'use client';

import { Link, usePathname } from '@/navigation';
import Logo from '@/components/logo';
import {
  LayoutDashboard,
  Users,
  Trophy,
  UserCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';


export default function AppSidebar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { user } = useAuth();


  const navItems = [
    { href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
    { href: '/groups', labelKey: 'groups', icon: Users },
    { href: '/leaderboard', labelKey: 'leaderboard', icon: Trophy },
    { href: `/profile/${user?.id}`, labelKey: 'profile', icon: UserCircle },
  ];

  return (
     <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
        <div className="flex h-16 items-center border-b px-6">
             <Link href="/" className="flex items-center gap-2 font-semibold">
                <Logo />
            </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
            <ul className="grid items-start px-4 text-sm font-medium">
                 {navItems.map((item) => (
                    // Don't render profile link if user is not loaded
                    (item.labelKey === 'profile' && !user) ? null :
                    <li key={item.href}>
                        <Link
                        href={item.href}
                        className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                            pathname.startsWith(item.href) && 'bg-muted text-primary'
                        )}
                        >
                        <item.icon className="h-4 w-4" />
                        {t(item.labelKey)}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    </aside>
  );
}
