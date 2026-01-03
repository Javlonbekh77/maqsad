'use client';

import type { User, UserTask } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Coins, CheckCircle, BarChart as BarChartIcon, TrendingUp, TrendingDown, ArrowRight, Flame, Trophy } from 'lucide-react';
import { Bar, XAxis, YAxis, CartesianGrid, BarChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { useMemo } from 'react';
import { format, subDays, startOfDay } from 'date-fns';
import { getLeaderboardData } from '@/lib/data';
import useSWR from 'swr';
import { Skeleton } from '../ui/skeleton';
import { Link } from '@/navigation';
import { Button } from '../ui/button';

interface DashboardStatsProps {
    user: User;
    tasks: UserTask[];
}

const chartConfig = {
  tasks: {
    label: "Tasks",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

function LeaderboardMotivation({ user }: { user: User }) {
    const { data: leaderboardData, isLoading } = useSWR('leaderboardData', getLeaderboardData);

    const userRankData = useMemo(() => {
        if (!leaderboardData || !user) return null;
        
        const rank = leaderboardData.topUsers.findIndex(u => u.id === user.id) + 1;
        const totalUsersInLeaderboard = leaderboardData.topUsers.length;

        if (rank > 0) {
            if (rank === 1) {
                return { rank, message: "Siz peshqadamlar ro'yxatida 1-o'rindasiz! Ajoyib natija, shu ruhda davom eting!" };
            }
            const userAbove = leaderboardData.topUsers[rank - 2];
            const coinsNeeded = (userAbove.coins + 1) - user.coins;
            return { rank, message: `Siz ${rank}-o'rindasiz! Yuqoriroqqa ko'tarilish uchun yana atigi ${coinsNeeded} tanga kerak!` };
        }

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

function MotivationalStat({ user }: { user: User }) {
    const { last7DaysCount, percentageChange, isPositive } = useMemo(() => {
        const today = startOfDay(new Date());
        
        const last7DaysStart = subDays(today, 6);
        const last14DaysStart = subDays(today, 13);
        
        const last7DaysCount = user.taskHistory.filter(h => {
            const hDate = new Date(h.date);
            return hDate >= last7DaysStart && hDate <= today;
        }).length;

        const previous7DaysCount = user.taskHistory.filter(h => {
            const hDate = new Date(h.date);
            return hDate >= last14DaysStart && hDate < last7DaysStart;
        }).length;

        let percentageChange = 0;
        if (previous7DaysCount > 0) {
            percentageChange = ((last7DaysCount - previous7DaysCount) / previous7DaysCount) * 100;
        } else if (last7DaysCount > 0) {
            percentageChange = 100; // From 0 to something is a 100% "increase" in this context
        }

        return {
            last7DaysCount,
            percentageChange: Math.round(percentageChange),
            isPositive: percentageChange >= 0
        };

    }, [user.taskHistory]);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Haftalik Motivatsiya</CardTitle>
              {isPositive ? <TrendingUp className="h-4 w-4 text-muted-foreground text-green-500" /> : <TrendingDown className="h-4 w-4 text-muted-foreground text-red-500" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{last7DaysCount} vazifa</div>
              <p className="text-xs text-muted-foreground">
                Oxirgi 7 kun ichida. Bu o'tgan haftadan 
                <span className={isPositive ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                     {' '}{Math.abs(percentageChange)}% {isPositive ? "ko'p" : "kam"}.
                </span>
              </p>
            </CardContent>
        </Card>
    );
}

export default function DashboardStats({ user, tasks }: DashboardStatsProps) {
    const completedTasksCount = useMemo(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return user.taskHistory.filter(h => h.date === today).length;
    }, [user.taskHistory]);

    const chartData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), i)).reverse();
        return last7Days.map(date => {
            const dateString = format(date, 'yyyy-MM-dd');
            const tasksCompleted = user.taskHistory.filter(h => h.date === dateString).length;
            return {
                date: format(date, 'MMM d'),
                tasks: tasksCompleted,
            };
        });
    }, [user.taskHistory]);

    return (
       <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <MotivationalStat user={user} />
            <LeaderboardMotivation user={user} />
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Haftalik Yutuqlar</CardTitle>
                    <BarChartIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pb-2">
                <ChartContainer config={chartConfig} className="h-[60px] w-full">
                    <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted-foreground/30" />
                        <YAxis hide={true} domain={[0, 'dataMax + 2']} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 3)}
                            />
                        <ChartTooltip 
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Bar dataKey="tasks" fill="var(--color-tasks)" radius={4} />
                    </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
       </div>
    )
}
