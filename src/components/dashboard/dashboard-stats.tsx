'use client';

import type { User, UserTask } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Coins, CheckCircle, BarChart as BarChartIcon } from 'lucide-react';
import { Bar, XAxis, YAxis, CartesianGrid, BarChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { useMemo } from 'react';
import { format, subDays } from 'date-fns';


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
       <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bugun Bajarilgan Vazifalar</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasksCount}</div>
              <p className="text-xs text-muted-foreground">Bugungi rejadagi vazifalardan</p>
            </CardContent>
          </Card>
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
