
'use client';

import { getTopUsers, getTopGroups } from '@/lib/data';
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
import { Badge } from '../ui/badge';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Medal className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
  return <span className="text-sm font-bold w-5 text-center">{rank}</span>;
};

export default function LeaderboardTabs() {
  const { t } = useTranslation();
  const topUsers = getTopUsers();
  const topGroups = getTopGroups();

  return (
    <Tabs defaultValue="users">
      <TabsList className="grid w-full grid-cols-2 md:w-96">
        <TabsTrigger value="users">
          <Trophy className="mr-2 h-4 w-4" /> {t('leaderboard.topUsers')}
        </TabsTrigger>
        <TabsTrigger value="groups">
          <Crown className="mr-2 h-4 w-4" /> {t('leaderboard.topGroups')}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="users">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">{t('leaderboard.rank')}</TableHead>
                  <TableHead>{t('leaderboard.user')}</TableHead>
                  <TableHead className="text-right">{t('leaderboard.coins')}</TableHead>
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
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatarUrl} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
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
        </Card>
      </TabsContent>
      <TabsContent value="groups">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">{t('leaderboard.rank')}</TableHead>
                  <TableHead>{t('leaderboard.group')}</TableHead>
                  <TableHead className="text-right">{t('leaderboard.totalCoins')}</TableHead>
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
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md overflow-hidden relative">
                            <Image src={group.imageUrl} alt={group.name} fill className='object-cover' />
                        </div>
                        <span className="font-medium">{group.name}</span>
                      </div>
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
        </Card>
      </TabsContent>
    </Tabs>
  );
}
