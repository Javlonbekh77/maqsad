'use client';

import AppLayout from "@/components/layout/app-layout";
import LeaderboardTabs from "@/components/leaderboard/leaderboard-tabs";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "@/navigation";
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { User, Group } from '@/lib/types';
import { getLeaderboardData } from '@/lib/data';

export default function LeaderboardClient() {
  const t = useTranslations('leaderboard');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [topUsers, setTopUsers] = useState<User[]>([]);
  const [topHabitUsers, setTopHabitUsers] = useState<User[]>([]);
  const [topGroups, setTopGroups] = useState<(Group & { coins: number })[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const { topUsers, topGroups, topHabitUsers } = await getLeaderboardData();
      setTopUsers(topUsers);
      setTopGroups(topGroups);
      setTopHabitUsers(topHabitUsers);
    } catch (error) {
      console.error("Failed to fetch leaderboard data:", error);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, router, fetchData]);

  const isLoading = authLoading || loadingData;

  if (isLoading || !user) {
    return (
      <AppLayout>
        <div className="space-y-8">
          <div>
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-4 w-1/2 mt-2" />
          </div>
          <Card>
            <CardContent className="p-6">
               <Skeleton className="h-96 w-full" />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <LeaderboardTabs topUsers={topUsers} topGroups={topGroups} topHabitUsers={topHabitUsers} isLoading={isLoading} />
      </div>
    </AppLayout>
  );
}
