'use client';

import type { User, UserTask } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Coins, CheckCircle, BarChart as BarChartIcon, TrendingUp, TrendingDown, ArrowRight, Flame, Trophy, BrainCircuit } from 'lucide-react';
import { Bar, XAxis, YAxis, CartesianGrid, BarChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { useMemo } from 'react';
import { format, subDays, startOfDay, isToday, getDay, formatISO, endOfDay } from 'date-fns';
import { getLeaderboardData, isTaskScheduledForDate } from '@/lib/data';
import useSWR from 'swr';
import { Skeleton } from '../ui/skeleton';
import { Link } from '@/navigation';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


interface DashboardStatsProps {
    user: User;
    tasks: UserTask[];
}

const chartConfig = {
  tasks: {
    label: "Vazifalar",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig


function WeeklyActivityChart({ user }: { user: User }) {
    const chartData = useMemo(() => {
        const today = endOfDay(new Date());
        const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, i)).reverse();

        return last7Days.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const completedCount = user.taskHistory.filter(h => h.date === dateStr).length;
            
            return {
                date: format(date, 'EEE'), // e.g., "Mon"
                tasks: completedCount,
            }
        });
    }, [user.taskHistory]);

    return (
         <Card>
            <CardHeader>
                <CardTitle>Haftalik Faollik</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-40 w-full">
                <BarChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="line" />}
                    />
                    <Bar dataKey="tasks" fill="var(--color-tasks)" radius={4} />
                </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

function LeaderboardMotivation({ user }: { user: User }) {
    const { data: leaderboardData, isLoading } = useSWR('leaderboardData', getLeaderboardData);

    const goldCoinRankData = useMemo(() => {
        if (!leaderboardData || !user) return null;
        
        const rank = leaderboardData.topUsers.findIndex(u => u.id === user.id) + 1;

        if (rank > 0) {
            if (rank === 1) {
                return { rank, message: "Siz peshqadamlar ro'yxatida 1-o'rindasiz! Ajoyib natija, shu ruhda davom eting!" };
            }
            const userAbove = leaderboardData.topUsers[rank - 2];
            const coinsNeeded = (userAbove.coins || 0) + 1 - (user.coins || 0);
            return { rank, message: `Siz ${rank}-o'rindasiz! Yuqoriroqqa ko'tarilish uchun yana atigi ${coinsNeeded} tanga kerak!` };
        }
        
        const totalUsers = leaderboardData.topUsers.length;
        if (totalUsers > 0) {
            const lastUser = leaderboardData.topUsers[totalUsers - 1];
            const coinsNeeded = (lastUser.coins || 0) + 1 - (user.coins || 0);
            return { rank: 0, message: `Peshqadamlar ro'yxatiga kirish uchun yana ${coinsNeeded} tanga to'plang. Siz buni uddalaysiz!` };
        }

        return { rank: 0, message: "Peshqadamlar ro'yxatida birinchi bo'ling! Vazifalarni bajarib, tanga yig'ishni boshlang." };

    }, [leaderboardData, user]);

    const silverCoinRankData = useMemo(() => {
        if (!leaderboardData || !user) return null;
        
        const rank = leaderboardData.topSilverCoinUsers.findIndex(u => u.id === user.id) + 1;

        if (rank > 0) {
            if (rank === 1) {
                return { rank, message: "Shaxsiy vazifalarni bajarishda 1-o'rindasiz! O'z-o'zingizni rivojlantirishda davom eting!" };
            }
            const userAbove = leaderboardData.topSilverCoinUsers[rank - 2];
            const coinsNeeded = (userAbove.silverCoins || 0) + 1 - (user.silverCoins || 0);
            return { rank, message: `Siz ${rank}-o'rindasiz! Keyingi pog'onaga chiqish uchun atigi ${coinsNeeded} kumush tanga yetmayapti!` };
        }
        
        const totalUsers = leaderboardData.topSilverCoinUsers.length;
        if (totalUsers > 0) {
            const lastUser = leaderboardData.topSilverCoinUsers[totalUsers - 1];
            const coinsNeeded = (lastUser.silverCoins || 0) + 1 - (user.silverCoins || 0);
            return { rank: 0, message: `Kumush tangalar reytingiga kirish uchun ${coinsNeeded} tanga to'plang. Olg'a!` };
        }

        return { rank: 0, message: "Shaxsiy vazifalarni bajarib, kumush tangalar reytingida birinchi bo'ling." };

    }, [leaderboardData, user]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className='pb-2'>
                <CardTitle className="text-base font-medium">Reytingdagi O'rningiz</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="gold">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="gold"><Coins className="mr-2 h-4 w-4 text-amber-500" /> Oltin</TabsTrigger>
                        <TabsTrigger value="silver"><Flame className="mr-2 h-4 w-4 text-slate-500" /> Kumush</TabsTrigger>
                    </TabsList>
                    <TabsContent value="gold" className="mt-4">
                        {goldCoinRankData && (
                            <>
                                {goldCoinRankData.rank > 0 && <div className="text-2xl font-bold">{goldCoinRankData.rank}-o'rin</div>}
                                <p className="text-xs text-muted-foreground h-10">
                                    {goldCoinRankData.message}
                                </p>
                            </>
                        )}
                    </TabsContent>
                    <TabsContent value="silver" className="mt-4">
                        {silverCoinRankData && (
                             <>
                                {silverCoinRankData.rank > 0 && <div className="text-2xl font-bold">{silverCoinRankData.rank}-o'rin</div>}
                                <p className="text-xs text-muted-foreground h-10">
                                    {silverCoinRankData.message}
                                </p>
                            </>
                        )}
                    </TabsContent>
                </Tabs>
                 <Link href="/leaderboard">
                    <Button variant="link" className="px-0 h-auto mt-2 text-xs">
                        To'liq ro'yxatni ko'rish <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    )
}

export default function DashboardStats({ user, tasks }: DashboardStatsProps) {
    return (
       <div className="space-y-8">
            <WeeklyActivityChart user={user} />
            <LeaderboardMotivation user={user} />
       </div>
    )
}
