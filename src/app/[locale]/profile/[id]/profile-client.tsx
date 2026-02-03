'use client';

import { useParams, useRouter } from 'next/navigation';
import AppLayout from "@/components/layout/app-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Coins, Briefcase, Settings, Flame, BrainCircuit, HandHelping, Search, GraduationCap, Building, PencilRuler, BookOpen, Star, Sparkles, Link as LinkIcon, UserPlus, School, UserCheck } from "lucide-react";
import HabitTracker from '@/components/profile/habit-tracker';
import type { User, Group, PersonalTask, UserTask } from "@/lib/types";
import { Separator } from '@/components/ui/separator';
import GoBackButton from '@/components/go-back-button';
import GoalMates from '@/components/profile/goal-mates';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import GroupCard from '@/components/groups/group-card';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserProfileData, getScheduledTasksForUser } from '@/lib/data';
import TaskDetailDialog from '@/components/tasks/task-detail-dialog';
import useSWR from 'swr';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/navigation';


const profileDataFetcher = ([key, userId]: [string, string]) => getUserProfileData(userId);
const scheduledTasksFetcher = ([key, user]: [string, User]) => getScheduledTasksForUser(user);

const educationStatusMap = {
    student: { text: "Talaba", icon: GraduationCap },
    master: { text: "Magistr", icon: GraduationCap },
    applicant: { text: "Abituriyent", icon: BookOpen },
    pupil: { text: "Maktab o'quvchisi", icon: School },
    other: { text: "Boshqa", icon: UserCheck }
};

const SkillBadge = ({ skill }: { skill: string }) => (
    <Badge variant="secondary" className="text-sm">{skill.trim()}</Badge>
);

export default function ProfileClient() {
  const t = useTranslations('profile');
  const params = useParams();
  const userId = params.id as string;
  const router = useRouter();
  
  const { user: currentUser, loading: authLoading } = useAuth();

  const { data: profileData, error: profileError, isLoading: loadingProfile } = useSWR(userId ? ['profile', userId] : null, profileDataFetcher);

  const { user, userGroups, allUsers } = useMemo(() => {
    return {
      user: profileData?.user ?? null,
      userGroups: profileData?.userGroups ?? [],
      allUsers: profileData?.allUsers ?? [],
    };
  }, [profileData]);

  const { data: allScheduledTasks, mutate: mutateScheduledTasks } = useSWR(user ? ['scheduledTasks', user] : null, scheduledTasksFetcher);
  
  const [viewingTask, setViewingTask] = useState<UserTask | null>(null);

  const userMap = useMemo(() => new Map(allUsers.map(u => [u.id, u])), [allUsers]);

  const isLoading = authLoading || loadingProfile;
  const isCurrentUserProfile = !authLoading && userId === currentUser?.id;

  const tasksForHabitTracker = useMemo(() => {
    if (!allScheduledTasks) return [];
    if (!isCurrentUserProfile) {
      return allScheduledTasks.filter(task => {
        return task.taskType === 'group' || (task.taskType === 'personal' && (task as PersonalTask).visibility === 'public');
      });
    }
    return allScheduledTasks;
  }, [allScheduledTasks, isCurrentUserProfile]);

  const statusInfo = useMemo(() => {
    if (!user?.status || user.status === 'none') return null;

    const options = {
      'open-to-help': { text: 'Yordam berishga tayyor', icon: HandHelping, variant: 'secondary' as const, skills: user.skillsToHelp },
      'searching-goalmates': { text: 'Maqsaddosh qidirmoqda', icon: Search, variant: 'default' as const, skills: user.goalMateTopics },
      'open-to-learn': { text: 'O\'rganishga ochiq', icon: BrainCircuit, variant: 'secondary' as const, skills: user.skillsToLearn },
    };
    return options[user.status];
  }, [user]);

  const educationInfo = useMemo(() => {
    if (!user?.educationStatus) return null;
    return educationStatusMap[user.educationStatus];
  }, [user?.educationStatus]);

  const suggestedUsers = useMemo(() => {
    if (!allUsers || !user) return [];
    return allUsers
        .filter(u => u.id !== user.id) // Exclude current user
        .sort(() => 0.5 - Math.random()) // Simple random shuffle
        .slice(0, 5); // Take 5
  }, [allUsers, user]);


  if (isLoading) {
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

  if (!user || profileError) {
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
  
  const renderSkills = (skills: string | undefined, title: string) => {
    if (!skills) return null;
    const skillList = skills.split(',').filter(s => s.trim() !== '');
    if (skillList.length === 0) return null;
    
    return (
        <div className='mb-6'>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <div className="flex flex-wrap gap-2">
                {skillList.map((skill, index) => <SkillBadge key={index} skill={skill} />)}
            </div>
        </div>
    );
  }

  return (
    <AppLayout>
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
              <GoBackButton />
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
                  <Avatar className="w-32 h-32 border-4 border-background ring-4 ring-primary">
                    <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                    <AvatarFallback className="text-4xl">{user.firstName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col justify-center gap-1">
                      <h2 className="text-3xl font-bold font-display">{user.fullName}</h2>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-sm">
                        {user.occupation && <div className="flex items-center gap-2"><Briefcase className="h-4 w-4" /><span>{user.occupation}</span></div>}
                        {educationInfo && user.institution && <div className="flex items-center gap-2"><educationInfo.icon className="h-4 w-4" /><span>{user.institution}</span></div>}
                      </div>
                      {user.fieldOfStudy && <p className="text-sm">{user.fieldOfStudy} {user.course && `- ${user.course}-kurs`}</p>}

                      {statusInfo && (
                          <Badge variant={statusInfo.variant} className="w-fit my-2">
                              <statusInfo.icon className="mr-2 h-4 w-4" />
                              {statusInfo.text}
                          </Badge>
                      )}
                       <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-2">
                              <Coins className="h-5 w-5 text-amber-500" />
                              <span className="text-xl font-semibold">{user.coins || 0}</span>
                              <span className="text-muted-foreground text-xs">oltin</span>
                          </div>
                           <div className="flex items-center gap-2">
                              <Flame className="h-5 w-5 text-slate-500" />
                              <span className="text-xl font-semibold">{user.silverCoins || 0}</span>
                               <span className="text-muted-foreground text-xs">kumush</span>
                          </div>
                      </div>
                  </div>
              </div>
            </CardHeader>
            <CardContent>
               <Separator className="my-6" />
                {renderSkills(user.skillsToHelp, "Yordam bera oladigan sohalari")}
                {renderSkills(user.skillsToLearn, "O'rganmoqchi bo'lgan sohalari")}
                {renderSkills(user.goalMateTopics, "Maqsaddosh qidirayotgan yo'nalishlari")}
                {renderSkills(user.interests, "Qiziqishlari")}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
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
          
          <HabitTracker 
              user={user} 
              allTasks={tasksForHabitTracker} 
              onDataNeedsRefresh={mutateScheduledTasks} 
          />
          
          {userGroups.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-xl font-bold">A'zo bo'lgan guruhlar</h3>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {userGroups.map(group => {
                    const memberUsers = group.members
                      .map(memberId => userMap.get(memberId))
                      .filter(Boolean) as User[];
                    return <GroupCard key={group.id} group={group} members={memberUsers} />;
                })}
              </CardContent>
            </Card>
          )}

        </div>

        <div className="lg:col-span-1 space-y-8">
            <GoalMates userId={user.id} />
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className='h-5 w-5 text-primary' />
                        Siz Uchun Profillar
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {suggestedUsers.length > 0 ? (
                        suggestedUsers.map(sUser => (
                            <div key={sUser.id} className="flex items-center justify-between">
                                <Link href={{pathname: '/profile/[id]', params: {id: sUser.id}}} className="flex items-center gap-3 group">
                                    <Avatar>
                                        <AvatarImage src={sUser.avatarUrl} alt={sUser.fullName} />
                                        <AvatarFallback>{sUser.firstName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium group-hover:underline">{sUser.fullName}</p>
                                        <p className="text-xs text-muted-foreground line-clamp-1">{sUser.occupation || sUser.institution}</p>
                                    </div>
                                </Link>
                                <Button variant="outline" size="sm">
                                    <LinkIcon className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Hozircha tavsiyalar yo'q.</p>
                    )}
                </CardContent>
            </Card>

        </div>

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
