'use client';

import type { User, Group } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Coins, Crown, Medal, Trophy } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { Skeleton } from '../ui/skeleton';

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Medal className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
  return <span className="text-sm font-bold w-5 text-center">{rank}</span>;
};

const LoadingSkeleton = () => (
    <div className="space-y-4 p-1">
        {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-5 w-12 ml-auto" />
            </div>
        ))}
    </div>
);

interface LeaderboardTabsProps {
  topUsers: User[];
  topGroups: (Group & { coins: number })[];
  isLoading: boolean;
}

export default function LeaderboardTabs({ topUsers, topGroups, isLoading }: LeaderboardTabsProps) {
  const t = useTranslations('leaderboard');

  return (
    <Tabs defaultValue="users">
      <TabsList className="grid w-full grid-cols-2 md:w-96">
        <TabsTrigger value="users">
          <Trophy className="mr-2 h-4 w-4" /> {t('topUsers')}
        </TabsTrigger>
        <TabsTrigger value="groups">
          <Crown className="mr-2 h-4 w-4" /> {t('topGroups')}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="users">
        <Card>
            {isLoading ? <CardContent className="p-6"><LoadingSkeleton /></CardContent> : (
                <CardContent className="p-0">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-16 text-center">{t('rank')}</TableHead>
                        <TableHead>{t('user')}</TableHead>
                        <TableHead className="text-right">{t('coins')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {topUsers.map((user, index) => (
                        <TableRow key={user.id}>
                            <TableCell className="text-center">
                            <div className="flex justify-center">
                                <RankIcon rank={index + 1} />
                            </div>
                            </TableCell>
                            <TableCell>
                            <Link href={{pathname: '/profile/[id]', params: {id: user.id}}} className="flex items-center gap-3 hover:underline">
                                <Avatar>
                                <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                                <AvatarFallback>{user.firstName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{user.fullName}</span>
                            </Link>
                            </TableCell>
                            <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 font-semibold text-amber-500">
                                <Coins className="w-4 h-4" />
                                <span>{user.coins}</span>
                            </div>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </CardContent>
            )}
        </Card>
      </TabsContent>
      <TabsContent value="groups">
        <Card>
          {isLoading ? <CardContent className="p-6"><LoadingSkeleton /></CardContent> : (
              <CardContent className="p-0">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-16 text-center">{t('rank')}</TableHead>
                    <TableHead>{t('group')}</TableHead>
                    <TableHead className="text-right">{t('totalCoins')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {topGroups.map((group, index) => (
                    <TableRow key={group.id}>
                        <TableCell className="text-center">
                        <div className="flex justify-center">
                            <RankIcon rank={index + 1} />
                        </div>
                        </TableCell>
                        <TableCell>
                        <Link href={{pathname: '/groups/[id]', params: {id: group.id}}} className="flex items-center gap-3 hover:underline">
                            <div className="w-10 h-10 rounded-md overflow-hidden relative">
                                <Image src={group.imageUrl} alt={group.name} fill className='object-cover' />
                            </div>
                            <span className="font-medium">{group.name}</span>
                        </Link>
                        </TableCell>
                        <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 font-semibold text-amber-500">
                            <Coins className="w-4 h-4" />
                            <span>{group.coins}</span>
                        </div>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
              </CardContent>
             )}
        </Card>
      </TabsContent>
    </Tabs>
  );
}
