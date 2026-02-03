'use client';

import AppLayout from "@/components/layout/app-layout";
import GroupCard from "@/components/groups/group-card";
import { Input } from "@/components/ui/input";
import { Compass, Search, User as UserIcon, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useMemo, useCallback } from "react";
import type { Group, User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { useRouter, Link } from "@/navigation";
import { getAllGroups, getAllUsers } from "@/lib/data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";


function UserCard({ user }: { user: User }) {
    return (
        <Link href={{ pathname: '/profile/[id]', params: { id: user.id } }} className="block">
            <Card className="h-full transition-all hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="p-4 flex items-center gap-4">
                     <Avatar className="h-14 w-14">
                        <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                        <AvatarFallback>{user.firstName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{user.fullName}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.occupation || user.institution || 'Status not set'}</p>
                        {user.status && user.status !== 'none' && (
                            <Badge variant="secondary" className="mt-1 text-xs">{user.status.replace('-', ' ')}</Badge>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}

export default function ExploreClient() {
  const t = useTranslations('explore');
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [groupsData, usersData] = await Promise.all([
        getAllGroups(),
        getAllUsers(),
      ]);
      setGroups(groupsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to fetch explore data:", error);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!authUser) {
        router.push('/login');
      } else {
        fetchData();
      }
    }
  }, [authUser, authLoading, router, fetchData]);

  const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return users;
    return users.filter(user => 
        user.fullName.toLowerCase().includes(term) ||
        (user.occupation && user.occupation.toLowerCase().includes(term)) ||
        (user.institution && user.institution.toLowerCase().includes(term)) ||
        (user.skillsToHelp && user.skillsToHelp.toLowerCase().includes(term)) ||
        (user.skillsToLearn && user.skillsToLearn.toLowerCase().includes(term)) ||
        (user.goalMateTopics && user.goalMateTopics.toLowerCase().includes(term))
    );
  }, [users, searchTerm]);
  
  const filteredGroups = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return groups;
    return groups.filter(group => 
        group.name.toLowerCase().includes(term) ||
        group.description.toLowerCase().includes(term)
    );
  }, [groups, searchTerm]);


  const isLoading = authLoading || loadingData;

  if (isLoading || !authUser) {
    return (
       <AppLayout>
         <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
              ))}
            </div>
         </div>
       </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="rounded-lg bg-background/50 backdrop-blur-sm p-6 border flex-1">
            <h1 className="text-3xl font-bold font-display flex items-center gap-2"><Compass/> {t('title')}</h1>
            <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>

        <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder={t('searchPlaceholder')}
                className="pl-8 w-full md:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        
        <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-2 md:w-96">
            <TabsTrigger value="users">
              <UserIcon className="mr-2 h-4 w-4" /> {t('usersTab')}
            </TabsTrigger>
            <TabsTrigger value="groups">
              <Users className="mr-2 h-4 w-4" /> {t('groupsTab')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-6">
             {filteredUsers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredUsers.map((user) => <UserCard key={user.id} user={user} />)}
                </div>
              ) : (
                <div className="text-center py-16">
                  <h3 className="text-xl font-semibold">Foydalanuvchilar Topilmadi</h3>
                  <p className="text-muted-foreground mt-2">
                    {searchTerm ? `"${searchTerm}" qidiruvingiz bo'yicha hech qanday foydalanuvchi topilmadi.` : "Hozircha foydalanuvchilar yo'q."}
                  </p>
                </div>
              )}
          </TabsContent>
          <TabsContent value="groups" className="mt-6">
            {filteredGroups.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredGroups.map((group) => {
                    const memberDetails = group.members
                      .map(memberId => userMap.get(memberId))
                      .filter(Boolean) as User[];
                    return <GroupCard key={group.id} group={group} members={memberDetails} />;
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <h3 className="text-xl font-semibold">Guruhlar Topilmadi</h3>
                  <p className="text-muted-foreground mt-2">
                     {searchTerm ? `"${searchTerm}" qidiruvingiz bo'yicha hech qanday guruh topilmadi.` : "Hozircha guruhlar yo'q."}
                  </p>
                </div>
              )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
