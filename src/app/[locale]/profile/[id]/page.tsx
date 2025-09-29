
'use client';

import { useParams, notFound, useRouter } from 'next/navigation';
import AppLayout from "@/components/layout/app-layout";
import { getUserById, getGroupsByUserId } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Coins, Briefcase, Settings } from "lucide-react";
import HabitTracker from '@/components/profile/habit-tracker';
import type { User, Group } from "@/lib/types";
import { Separator } from '@/components/ui/separator';
import GoBackButton from '@/components/go-back-button';
import GoalMates from '@/components/profile/goal-mates';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import GroupCard from '@/components/groups/group-card';
import { useAuth } from '@/context/auth-context';


export default function ProfilePage() {
  const t = useTranslations('profile');
  const params = useParams();
  const userId = params.id as string;
  const router = useRouter();
  
  const { user: currentUser, loading } = useAuth();
  const isCurrentUser = userId === currentUser?.id;
  
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [userGroups, setUserGroups] = useState<Group[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!userId) return;
      const userData = await getUserById(userId);
      if (!userData) {
        notFound();
      } else {
        setUser(userData);
        const groupsData = await getGroupsByUserId(userId);
        setUserGroups(groupsData);
      }
    }
    fetchData();
  }, [userId]);

  if (user === undefined || loading) {
    return <AppLayout><div>Loading...</div></AppLayout>;
  }

  if (!user) {
      return null;
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <GoBackButton />
          {isCurrentUser && (
            <Button variant="outline" onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Sozlamalar
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-6">
                <Avatar className="w-32 h-32 border-4 border-background ring-4 ring-primary">
                  <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                  <AvatarFallback className="text-4xl">{user.firstName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col justify-center gap-1">
                    <h2 className="text-3xl font-bold font-display">{user.fullName}</h2>
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <Briefcase className="h-5 w-5" />
                        <span className="text-lg">{user.occupation || 'Kasbi kiritilmagan'}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <Coins className="h-6 w-6 text-amber-500" />
                        <span className="text-2xl font-semibold">{user.coins}</span>
                        <span className="text-muted-foreground">{t('coinsEarned')}</span>
                    </div>
                </div>
            </div>
          </CardHeader>
          <CardContent>
             <Separator className="my-6" />
              <div className="space-y-6">
                  <div>
                      <h3 className="text-lg font-semibold">{t('myGoals')}</h3>
                      <p className="mt-1 text-muted-foreground">{user.goals || 'Foydalanuvchi hali maqsadlarini kiritmagan.'}</p>
                  </div>
                    <div>
                      <h3 className="text-lg font-semibold">{t('myHabits')}</h3>
                      <p className="mt-1 text-muted-foreground">{user.habits || 'Foydalanuvchi hali odatlarini kiritmagan.'}</p>
                  </div>
              </div>
          </CardContent>
        </Card>

        {userGroups.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-xl font-bold">A'zo bo'lgan guruhlar</h3>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {userGroups.map(group => (
                <GroupCard key={group.id} group={group} />
              ))}
            </CardContent>
          </Card>
        )}
        
        <HabitTracker user={user} />

        <GoalMates userId={user.id} />

      </div>
    </AppLayout>
  );
}
