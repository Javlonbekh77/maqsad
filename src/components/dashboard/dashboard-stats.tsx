'use client';

import type { User, UserTask } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Coins, CheckCircle, BarChart as BarChartIcon, TrendingUp, TrendingDown, ArrowRight, Flame, Trophy, BrainCircuit } from 'lucide-react';
import { Bar, XAxis, YAxis, CartesianGrid, BarChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { useMemo } from 'react';
import { format, subDays, startOfDay } from 'date-fns';
import { getLeaderboardData } from '@/lib/data';
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
    label: "Tasks",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig


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

function WeeklyMotivation({ user, tasks }: { user: User, tasks: UserTask[] }) {
    const { message, percentageChange, Icon, periodTotal } = useMemo(() => {
        const today = new Date();
        const last7DaysStart = startOfDay(subDays(today, 6));
        const previous7DaysStart = startOfDay(subDays(today, 13));
        const previous7DaysEnd = startOfDay(subDays(today, 7));

        const completedLast7Days = user.taskHistory.filter(h => {
            const historyDate = new Date(h.date);
            return historyDate >= last7DaysStart && historyDate <= today;
        }).length;

        const completedPrevious7Days = user.taskHistory.filter(h => {
            const historyDate = new Date(h.date);
            return historyDate >= previous7DaysStart && historyDate <= previous7DaysEnd;
        }).length;

        let percentageChange = 0;
        if (completedPrevious7Days > 0) {
            percentageChange = Math.round(((completedLast7Days - completedPrevious7Days) / completedPrevious7Days) * 100);
        } else if (completedLast7Days > 0) {
            percentageChange = 100; // From 0 to something is 100% growth for simplicity
        }
        
        const percentageText = percentageChange !== 0 
            ? <span className={cn("font-bold", percentageChange > 0 ? "text-green-500" : "text-red-500")}>{Math.abs(percentageChange)}%</span>
            : null;

        let message;
        if (percentageChange > 0) {
            message = <>avvalgi 7 kundan {percentageText} ko'proq. Ajoyib natija!</>;
        } else if (percentageChange < 0) {
            message = <>avvalgi 7 kundan {percentageText} kam. Keyingi hafta yanada harakat qilamiz!</>;
        } else {
            message = "Natijangiz o'tgan haftadagi kabi. Barqarorlik - bu ham yutuq!";
        }

        return {
            message,
            percentageChange,
            Icon: percentageChange > 0 ? TrendingUp : (percentageChange < 0 ? TrendingDown : BarChartIcon),
            periodTotal: completedLast7Days,
        }
    }, [user.taskHistory]);


    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Oxirgi 7 kunlik Faollik</CardTitle>
               <Icon className={cn("h-4 w-4", percentageChange > 0 ? "text-green-500" : percentageChange < 0 ? "text-red-500" : "text-muted-foreground")} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{periodTotal} vazifa</div>
              <p className="text-xs text-muted-foreground">
                {message}
              </p>
            </CardContent>
        </Card>
    );
}

export default function DashboardStats({ user, tasks }: DashboardStatsProps) {
    const tasksToday = useMemo(() => tasks.filter(t => !t.isCompleted), [tasks]);

    return (
       <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Bugun Bajarilmagan Vazifalar
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">
                    {tasksToday.length}
                </div>
                <p className="text-xs text-muted-foreground">
                    {tasksToday.length > 0 ? "Qolgan vazifalarni bajaring" : "Bugungi barcha vazifalar bajarildi!"}
                </p>
                </CardContent>
            </Card>
            <WeeklyMotivation user={user} tasks={tasks} />
            <LeaderboardMotivation user={user} />
       </div>
    )
}
