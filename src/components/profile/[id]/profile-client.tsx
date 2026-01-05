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
import { getInitials, getAvatarColor } from '@/lib/utils';

export default function ProfileClient() {
  const t = useTranslations('profile');
  const params = useParams();
  const userId = params.id as string;
  const router = useRouter();
  
  const { user: currentUser, loading: authLoading } = useAuth();
  
  const [user, setUser] = useState<User | null>(null);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [publicTasks, setPublicTasks] = useState<PersonalTask[]>([]);
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
        setPublicTasks(profileData.publicPersonalTasks);
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
  
  const handleViewTask = (task: PersonalTask) => {
    setViewingTask({
        ...task,
        taskType: 'personal',
        isCompleted: false, // Not relevant for this view
        coins: 1, // Silver coin
    });
  };

  const userMap = useMemo(() => new Map(allUsers.map(u => [u.id, u])), [allUsers]);

  const isLoading = authLoading || loadingData;
  const isCurrentUserProfile = userId === currentUser?.id;

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
                <Avatar className="w-32 h-32 border-4 border-background ring-4 ring-primary" style={{ backgroundColor: getAvatarColor(user.id) }}>
                  <AvatarFallback className="text-4xl">{getInitials(user.fullName)}</AvatarFallback>
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
        
        {publicTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Ommaviy Vazifalar</CardTitle>
              <CardDescription>{user.firstName}ning boshqalar bilan bo'lishgan vazifalari.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {publicTasks.map(task => (
                <div 
                    key={task.id} 
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewTask(task)}
                >
                    <p className="font-medium">{task.title}</p>
                    <Eye className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

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
        
        <HabitTracker user={user} />

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
