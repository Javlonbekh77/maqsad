
'use client';

import AppLayout from "@/components/layout/app-layout";
import LeaderboardTabs from "@/components/leaderboard/leaderboard-tabs";
import { useTranslations } from "next-intl";

export default function LeaderboardPage() {
  const t = useTranslations('leaderboard');
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
