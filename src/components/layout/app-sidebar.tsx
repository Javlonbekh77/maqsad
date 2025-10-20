'use client';

import { Link, usePathname } from '@/navigation';
import Logo from '@/components/logo';
import {
  LayoutDashboard,
  Users,
  Trophy,
  UserCircle,
  MessageSquare,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Separator } from '../ui/separator';
import useSWR from 'swr';
import type { Group } from '@/lib/types';
import { getUserGroups } from '@/lib/data';
import { Skeleton } from '../ui/skeleton';
import { ScrollArea } from '../ui/scroll-area';
import Image from 'next/image';

const fetcher = (userId: string) => getUserGroups(userId);

function UserGroupList() {
    const { user } = useAuth();
    const { data: groups, error, isLoading } = useSWR(user ? user.id : null, fetcher);

    if (isLoading) {
        return (
             <div className="px-4 space-y-2">
                {Array.from({length: 3}).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
                        <Skeleton className="h-5 w-5 rounded-md" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                ))}
            </div>
        )
    }

    if (error || !groups || groups.length === 0) {
        return <p className="px-7 text-xs text-muted-foreground">You haven't joined any groups yet.</p>;
    }

    return (
        <div className="grid items-start px-4 text-sm font-medium">
            {groups.map((group) => (
                <Link
                    key={group.id}
                    href={{ pathname: '/groups/[id]', params: { id: group.id }, query: { tab: 'chat' } }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                    <div className="h-5 w-5 relative rounded-md overflow-hidden">
                        <Image src={group.imageUrl} alt={group.name} fill className="object-cover" />
                    </div>
                    <span className='truncate'>{group.name}</span>
                </Link>
            ))}
        </div>
    );
}


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
        <div className="flex h-16 shrink-0 items-center border-b px-6">
             <Link href="/" className="flex items-center gap-2 font-semibold">
                <Logo />
            </Link>
        </div>
        <ScrollArea className="flex-1">
            <nav className="py-4">
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
            <Separator className="my-4" />
            <div className="space-y-4">
                 <h3 className="px-7 text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2"><MessageSquare className='h-4 w-4' />Group Chats</h3>
                <UserGroupList />
            </div>
        </ScrollArea>
    </aside>
  );
}
