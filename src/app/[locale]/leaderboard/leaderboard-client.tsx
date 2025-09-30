
'use client';

import AppLayout from "@/components/layout/app-layout";
import LeaderboardTabs from "@/components/leaderboard/leaderboard-tabs";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "@/navigation";
import { useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardClient() {
  const t = useTranslations('leaderboard');
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (!user) {
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
        <LeaderboardTabs />
      </div>
    </AppLayout>
  );
}
