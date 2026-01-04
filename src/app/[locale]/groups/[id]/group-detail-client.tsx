'use client';

import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layout/app-layout';
import { addUserToGroup, getGroupAndDetails } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Crown, UserPlus, Settings, MessageSquare, Edit, PlusCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link, useRouter } from '@/navigation';
import GoBackButton from '@/components/go-back-button';
import { useEffect, useState, useCallback } from 'react';
import JoinGroupDialog from '@/components/groups/join-group-dialog';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WeeklyMeetings from '@/components/groups/weekly-meetings';
import type { Group, Task, User, WeeklyMeeting, UserTaskSchedule, UserTask } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import GroupSettingsDialog from '@/components/groups/group-settings-dialog';
import GroupChat from '@/components/groups/group-chat';
import TaskDetailDialog from '@/components/tasks/task-detail-dialog';


export default function GroupDetailClient() {
  const t = useTranslations('groupDetail');
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = params.id as string;
  const initialTab = searchParams.get('tab') || 'tasks';

  const { user: currentUser, loading: authLoading } = useAuth();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<WeeklyMeeting[]>([]);
  const [isJoinDialogOpen, setJoinDialogOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<UserTask | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const fetchGroupData = useCallback(async (groupId: string) => {
    if (!groupId) return;
    setLoadingData(true);
    try {
      const data = await getGroupAndDetails(groupId);
      if (data) {
        setGroup(data.group);
        setMembers(data.members);
        setTasks(data.tasks);
        setMeetings(data.meetings);
      } else {
        setGroup(null);
      }
    } catch (error) {
      console.error("Failed to fetch group data:", error);
      setGroup(null);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        router.push('/login');
      } else if (id) {
        fetchGroupData(id as string);
      }
    }
  }, [id, authLoading, currentUser, router, fetchGroupData]);

  const handleJoinGroup = useCallback(async (schedules: UserTaskSchedule[]) => {
    if (!currentUser || !group) return;
    try {
      await addUserToGroup(currentUser.id, group.id, schedules);
      setJoinDialogOpen(false);
      await fetchGroupData(id as string); // Re-fetch data to show the user as a new member
    } catch(error) {
      console.error("Failed to join group:", error);
    }
  }, [currentUser, group, id, fetchGroupData]);
  
  const handleViewTask = (task: Task) => {
    setViewingTask({
        ...task,
        taskType: 'group',
        groupName: group?.name,
        isCompleted: false, // Not relevant for this view
    });
  };

  const isLoading = authLoading || loadingData;
  const isMember = !!currentUser?.id && !!group?.members.includes(currentUser.id);
  const isAdmin = group?.adminId === currentUser?.id;
  const latestMeeting = meetings.length > 0 ? meetings[0] : null;


  if (isLoading || !currentUser) {
    return (
        <AppLayout>
            <div className="space-y-8">
                <GoBackButton />
                <Skeleton className="w-full h-64 rounded-xl" />
                <div className="mt-8 flex items-center justify-between">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-10 w-28" />
                </div>

                <div className="border-b">
                  <div className="flex h-10 items-center space-x-4">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>

                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-40 w-full" />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
  }

  if (!group) {
    return (
      <AppLayout>
        <div className="text-center py-10">
          <p className="text-lg font-semibold">Group not found</p>
          <p className="text-muted-foreground">The group you are looking for does not exist or has been removed.</p>
          <GoBackButton />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <GoBackButton />
        <header className="relative w-full h-64 rounded-xl overflow-hidden">
          <Image
            src={group.imageUrl}
            alt={group.name}
            fill
            className="object-cover"
            data-ai-hint={group.imageHint}
          />
          <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-8">
            <h1 className="text-4xl font-bold text-white font-display">{group.name}</h1>
            <p className="text-lg text-white/80 max-w-2xl mt-2">{group.description}</p>
          </div>
           <div className="absolute top-4 right-4 flex gap-2">
              {!isMember && currentUser && (
                <Button onClick={() => setJoinDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {t('joinGroup')}
                </Button>
              )}
              {isAdmin && (
                <Button variant="secondary" onClick={() => setSettingsOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Guruh Sozlamalari
                </Button>
              )}
            </div>
        </header>

        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tasks">{t('tasksTitle')}</TabsTrigger>
            <TabsTrigger value="members">{t('membersTitle', { count: members.length })}</TabsTrigger>
            <TabsTrigger value="meetings">Haftalik Uchrashuvlar</TabsTrigger>
            <TabsTrigger value="chat" disabled={!isMember}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Chat
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tasks">
             <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t('tasksTitle')}</CardTitle>
                  <CardDescription>{t('tasksDescription')}</CardDescription>
                </div>
                {isAdmin && (
                  <Button asChild>
                    <Link href={`/groups/${group.id}/add-task`}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Vazifa Qo'shish
                    </Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                 {tasks.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('taskColumn')}</TableHead>
                          <TableHead className='text-right'>{t('rewardColumn')}</TableHead>
                          {isAdmin && <TableHead className="w-12"></TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tasks.map(task => (
                          <TableRow key={task.id}>
                            <TableCell>
                              <div 
                                className="font-medium cursor-pointer hover:underline"
                                onClick={() => handleViewTask(task)}
                              >
                                {task.title}
                              </div>
                              <div className="text-sm text-muted-foreground hidden md:block">{task.description}</div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1 font-semibold text-amber-500">
                                <Coins className="w-4 h-4" />
                                <span>{task.coins}</span>
                              </div>
                            </TableCell>
                             {isAdmin && (
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/groups/${group.id}/edit-task/${task.id}`}>
                                    <Edit className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        This group has no tasks yet.
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>{t('membersTitle', { count: members.length })}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {members.length > 0 ? (
                  members.map(member => member && (
                    <div key={member.id} className="flex items-center justify-between">
                      <Link href={{pathname: '/profile/[id]', params: {id: member.id}}} className="flex items-center gap-3 hover:underline">
                        <Avatar>
                          <AvatarImage src={member.avatarUrl} alt={member.fullName} />
                          <AvatarFallback>{member.firstName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className='flex flex-col'>
                          <p className="font-medium">{member.fullName}</p>
                            {group.adminId === member.id && (
                              <Badge variant="secondary" className="gap-1 pl-1.5 w-fit">
                                <Crown className="h-3 w-3 text-amber-500" />
                                {t('adminBadge')}
                              </Badge>
                            )}
                        </div>
                      </Link>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Coins className="w-4 h-4 text-amber-500"/>
                          {member.coins}
                      </div>
                    </div>
                  ))
                ) : (
                   <div className="text-center py-10 text-muted-foreground">
                        This group has no members yet.
                    </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="meetings">
            <WeeklyMeetings 
                groupId={group.id} 
                initialMeetings={meetings}
                isAdmin={isAdmin}
                onUpdate={() => fetchGroupData(group.id)}
            />
          </TabsContent>
          <TabsContent value="chat">
            <Card>
                <CardContent>
                    <GroupChat groupId={group.id} members={members} latestMeeting={latestMeeting} />
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <JoinGroupDialog
        isOpen={isJoinDialogOpen}
        onClose={() => setJoinDialogOpen(false)}
        onConfirm={handleJoinGroup}
        groupName={group.name}
        tasks={tasks}
      />
      {isAdmin && (
         <GroupSettingsDialog
            isOpen={isSettingsOpen}
            onClose={() => setSettingsOpen(false)}
            group={group}
            onGroupUpdated={() => fetchGroupData(group.id)}
        />
      )}
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
