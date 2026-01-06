'use client';

import { useParams } from 'next/navigation';
import AppLayout from "@/components/layout/app-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Coins, Briefcase, Settings, Flame, Eye } from "lucide-react";
import HabitTracker from '@/components/profile/habit-tracker';
import type { User, Group, PersonalTask, UserTask } from "@/lib/types";
import { Separator } from '@/components/ui/separator';
import GoBackButton from '@/components/go-back-button';
import GoalMates from '@/components/profile/goal-mates';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useMemo, useCallback } from 'react';
import GroupCard from '@/components/groups/group-card';
import { useAuth } from '@/context/auth-context';
import { useRouter } from '@/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserProfileData } from '@/lib/data';
import TaskDetailDialog from '@/components/tasks/task-detail-dialog';
import { getInitials, getAvatarColor, avatarColors } from '@/lib/utils';
import { cn } from '@/lib/utils';


export default function ProfileClient() {
  const t = useTranslations('profile');
  const params = useParams();
  const userId = params.id as string;
  const router = useRouter();
  
  const { user: currentUser, loading: authLoading } = useAuth();
  
  const [user, setUser] = useState<User | null>(null);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [viewingTask, setViewingTask] = useState<UserTask | null>(null);

  const fetchData = useCallback(async (uid: string) => {
    if (!uid) return;
    setLoadingData(true);
    try {
      const profileData = await getUserProfileData(uid);
      if (profileData) {
        setUser(profileData.user);
        setUserGroups(profileData.userGroups);
        setAllUsers(profileData.allUsers);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
      setUser(null);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
     if (!authLoading) {
        if (!currentUser) {
            router.push('/login');
        } else if (userId) {
          fetchData(userId);
        }
    }
  }, [userId, authLoading, currentUser, router, fetchData]);
  

  const userMap = useMemo(() => new Map(allUsers.map(u => [u.id, u])), [allUsers]);

  const isLoading = authLoading || loadingData;
  const isCurrentUserProfile = userId === currentUser?.id;
  
  const profileColor = useMemo(() => {
    if (user?.profileColor) {
      return avatarColors.find(c => c.name === user.profileColor)?.color || getAvatarColor(user.id);
    }
    return user ? getAvatarColor(user.id) : '#f1f5f9';
  }, [user]);

  if (isLoading || !currentUser) {
    return (
        <AppLayout>
            <div className="space-y-8">
                <Skeleton className="h-8 w-24" />
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row gap-6">
                            <Skeleton className="w-32 h-32 rounded-full" />
                            <div className="flex flex-col justify-center gap-2">
                                <Skeleton className="h-8 w-48" />
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-8 w-40 mt-2" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Separator className="my-6" />
                        <div className="space-y-6">
                          <Skeleton className="h-24 w-full" />
                          <Skeleton className="h-24 w-full" />
                        </div>
                    </CardContent>
                </Card>
                <Skeleton className="h-64 w-full" />
                 <Skeleton className="h-64 w-full" />
            </div>
        </AppLayout>
    );
  }

  if (!user) {
      return (
        <AppLayout>
            <div className="text-center py-10">
                <p className="text-lg font-semibold">User not found</p>
                <p className="text-muted-foreground">The profile you are looking for does not exist.</p>
                <GoBackButton />
            </div>
        </AppLayout>
      );
  }

  return (
    <AppLayout>
      <div 
        className="absolute inset-x-0 top-0 h-48 -z-10" 
        style={{ backgroundColor: profileColor, opacity: 0.2 }}
      ></div>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
            <div className="rounded-lg bg-background/50 backdrop-blur-sm px-4 py-2 border">
                <GoBackButton />
            </div>
          {isCurrentUserProfile && (
            <Button variant="outline" onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              {t('settings.title')}
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-6">
                <Avatar className="w-32 h-32 border-4 border-background ring-4" style={{ 'ringColor': profileColor }}>
                   <AvatarFallback className="text-4xl" style={{ backgroundColor: getAvatarColor(user.id) }}>
                        {getInitials(user.fullName)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col justify-center gap-1">
                    <h2 className="text-3xl font-bold font-display">{user.fullName}</h2>
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <Briefcase className="h-5 w-5" />
                        <span className="text-lg">{user.occupation || 'Kasbi kiritilmagan'}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                            <Coins className="h-6 w-6 text-amber-500" />
                            <span className="text-2xl font-semibold">{user.coins || 0}</span>
                            <span className="text-muted-foreground text-sm">oltin</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <Flame className="h-6 w-6 text-slate-500" />
                            <span className="text-2xl font-semibold">{user.silverCoins || 0}</span>
                             <span className="text-muted-foreground text-sm">kumush</span>
                        </div>
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
              {userGroups.map(group => {
                  const memberUsers = group.members
                    .map(memberId => userMap.get(memberId))
                    .filter(Boolean) as User[];
                  return <GroupCard key={group.id} group={group} members={memberUsers} />;
              })}
            </CardContent>
          </Card>
        )}
        
        <HabitTracker user={user} isCurrentUserProfile={isCurrentUserProfile} />

        <GoalMates userId={user.id} />

      </div>
      {viewingTask && (
        <TaskDetailDialog
            task={viewingTask}
            isOpen={!!viewingTask}
            onClose={() => setViewingTask(null)}
        />
      )}
    </AppLayout>
  );
}
