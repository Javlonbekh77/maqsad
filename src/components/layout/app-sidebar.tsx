'use client';

import { Link, usePathname } from '@/navigation';
import Logo from '@/components/logo';
import {
  LayoutDashboard,
  Users,
  Trophy,
  UserCircle,
  MessageSquare,
  PlusSquare,
  ClipboardList,
  Clock,
  BookOpen,
  Compass
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Separator } from '../ui/separator';
import useSWR from 'swr';
import type { Group } from '@/lib/types';
import { getUnreadMessageCount, getUserGroups } from '@/lib/data';
import { Skeleton } from '../ui/skeleton';
import { ScrollArea } from '../ui/scroll-area';
import Image from 'next/image';
import { Badge } from '../ui/badge';
import { Timestamp } from 'firebase/firestore';


function UnreadCountBadge({ groupId }: { groupId: string }) {
    const { user } = useAuth();
    const lastReadTimestamp = user?.lastRead?.[groupId] || new Timestamp(0, 0);

    const { data: unreadCount } = useSWR(
        `unreadCount/${groupId}/${user?.id}`, 
        () => getUnreadMessageCount(groupId, lastReadTimestamp),
        { refreshInterval: 10000 } // Re-fetch every 10 seconds
    );

    if (!unreadCount || unreadCount === 0) {
        return null;
    }

    return (
        <Badge variant="destructive" className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
    );
}

function UserGroupList() {
    const { user } = useAuth();
    const { data: groups, error, isLoading } = useSWR(user ? `userGroups/${user.id}` : null, () => getUserGroups(user!.id));

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
                    <span className='truncate flex-1'>{group.name}</span>
                    <UnreadCountBadge groupId={group.id} />
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
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/my-tasks', label: 'Mening Vazifalarim', icon: ClipboardList },
    { href: '/explore', label: t('explore'), icon: Compass },
    { href: '/pomo-timer', label: 'Fokus Vaqti', icon: Clock },
    { href: '/kundalik', label: 'Kundalik', icon: BookOpen },
    { href: '/groups', label: 'Guruhlar', icon: Users },
    { href: '/leaderboard', label: 'Peshqadamlar', icon: Trophy },
    { href: `/profile/${user?.id}`, label: 'Profil', icon: UserCircle },
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
                        (item.label === 'Profil' && !user) ? null :
                        <li key={item.href}>
                            <Link
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                                pathname === item.href && 'bg-muted text-primary'
                            )}
                            >
                            <item.icon className="h-4 w-4" />
                            {item.label}
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
