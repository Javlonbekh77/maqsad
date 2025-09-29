
'use client';

import Image from 'next/image';
import { notFound, useParams } from 'next/navigation';
import AppLayout from '@/components/layout/app-layout';
import { getGroupById, getUserById, getTasksByGroupId, addUserToGroup, getMeetingsByGroupId } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Crown, UserPlus } from 'lucide-react';
import CreateTaskDialog from '@/components/groups/create-task-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from '@/navigation';
import GoBackButton from '@/components/go-back-button';
import { useEffect, useState } from 'react';
import JoinGroupDialog from '@/components/groups/join-group-dialog';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WeeklyMeetings from '@/components/groups/weekly-meetings';
import type { Group, Task, User, WeeklyMeeting } from '@/lib/types';
import { useAuth } from '@/context/auth-context';


export default function GroupDetailPage() {
  const t = useTranslations('groupDetail');
  const params = useParams();
  const id = params.id as string;
  const { user: currentUser, loading } = useAuth();
  const currentUserId = currentUser?.id;
  
  const [group, setGroup] = useState<Group | null | undefined>(undefined);
  const [members, setMembers] = useState<(User | undefined)[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<WeeklyMeeting[]>([]);
  const [isJoinDialogOpen, setJoinDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const groupData = await getGroupById(id);
      if (!groupData) {
        notFound();
        return;
      }
      setGroup(groupData);
      
      const memberPromises = groupData.members.map(id => getUserById(id));
      const membersData = await Promise.all(memberPromises);
      setMembers(membersData.filter(Boolean) as User[]);
      
      const tasksData = await getTasksByGroupId(groupData.id);
      setTasks(tasksData);

      const meetingsData = await getMeetingsByGroupId(groupData.id);
      setMeetings(meetingsData);
    }
    fetchData();
  }, [id]);

  if (group === undefined || loading) {
    // Loading state
    return <AppLayout><div>Loading...</div></AppLayout>;
  }

  if (!group) {
    // Not found will be triggered by useEffect, but this is a safeguard
    return null;
  }

  const isAdmin = group.adminId === currentUserId;
  const isMember = !!currentUserId && group.members.includes(currentUserId);

  const handleJoinGroup = async () => {
    if (!currentUserId) return;
    await addUserToGroup(currentUserId, group.id);
    const updatedGroupData = await getGroupById(id);
    setGroup(updatedGroupData);
    setJoinDialogOpen(false);
  };

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
           <div className="absolute top-4 right-4">
              {!isMember && currentUserId && (
                <Button onClick={() => setJoinDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {t('joinGroup')}
                </Button>
              )}
            </div>
        </header>

        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks">{t('tasksTitle')}</TabsTrigger>
            <TabsTrigger value="members">{t('membersTitle', { count: members.length })}</TabsTrigger>
            <TabsTrigger value="meetings">Haftalik Uchrashuvlar</TabsTrigger>
          </TabsList>
          <TabsContent value="tasks">
             <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t('tasksTitle')}</CardTitle>
                  <CardDescription>{t('tasksDescription')}</CardDescription>
                </div>
                {isAdmin && <CreateTaskDialog />}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('taskColumn')}</TableHead>
                      <TableHead className='text-right'>{t('rewardColumn')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map(task => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-muted-foreground hidden md:block">{task.description}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 font-semibold text-amber-500">
                             <Coins className="w-4 h-4" />
                             <span>{task.coins}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>{t('membersTitle', { count: members.length })}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {members.map(member => member && (
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
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="meetings">
            <WeeklyMeetings groupId={group.id} meetings={meetings} />
          </TabsContent>
        </Tabs>
      </div>
      <JoinGroupDialog
        isOpen={isJoinDialogOpen}
        onClose={() => setJoinDialogOpen(false)}
        onConfirm={() => handleJoinGroup()}
        groupName={group.name}
        tasks={tasks}
      />
    </AppLayout>
  );
}
