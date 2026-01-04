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

    const userRankData = useMemo(() => {
        if (!leaderboardData || !user) return null;
        
        const rank = leaderboardData.topUsers.findIndex(u => u.id === user.id) + 1;

        if (rank > 0) {
            if (rank === 1) {
                return { rank, message: "Siz peshqadamlar ro'yxatida 1-o'rindasiz! Ajoyib natija, shu ruhda davom eting!" };
            }
            const userAbove = leaderboardData.topUsers[rank - 2];
            const coinsNeeded = (userAbove.coins + 1) - user.coins;
            return { rank, message: `Siz ${rank}-o'rindasiz! Yuqoriroqqa ko'tarilish uchun yana atigi ${coinsNeeded} tanga kerak!` };
        }
        
        const totalUsersInLeaderboard = leaderboardData.topUsers.length;
        if (totalUsersInLeaderboard > 0) {
            const lastUserInLeaderboard = leaderboardData.topUsers[totalUsersInLeaderboard - 1];
            const coinsNeeded = (lastUserInLeaderboard.coins + 1) - user.coins;
            return { rank: 0, message: `Peshqadamlar ro'yxatiga kirish uchun yana ${coinsNeeded} tanga to'plang. Siz buni uddalaysiz!` };
        }

        return { rank: 0, message: "Peshqadamlar ro'yxatida birinchi bo'ling! Vazifalarni bajarib, tanga yig'ishni boshlang." };

    }, [leaderboardData, user]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reytingdagi O'rningiz</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                </CardContent>
            </Card>
        )
    }

    if (!userRankData) return null;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reytingdagi O'rningiz</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {userRankData.rank > 0 && <div className="text-2xl font-bold">{userRankData.rank}-o'rin</div>}
                <p className="text-xs text-muted-foreground">
                    {userRankData.message}
                </p>
                <Link href="/leaderboard">
                    <Button variant="link" className="px-0 h-auto mt-2 text-xs">
                        Ro'yxatni ko'rish <ArrowRight className="h-3 w-3 ml-1" />
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
