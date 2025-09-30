
'use client';

import AppLayout from "@/components/layout/app-layout";
import { getGroups, getUsers } from "@/lib/data";
import GroupCard from "@/components/groups/group-card";
import CreateGroupDialog from "@/components/groups/create-group-dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useMemo, useCallback } from "react";
import type { Group, User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "@/navigation";

export default function GroupsClient() {
  const t = useTranslations('groups');
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [groupsData, usersData] = await Promise.all([
        getGroups(),
        getUsers()
      ]);
      setGroups(groupsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to fetch groups and users:", error);
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

  const filteredGroups = useMemo(() => {
    return groups.filter(group => group.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [groups, searchTerm]);

  const isLoading = authLoading || loadingData;

  if (isLoading || !authUser) {
    return (
       <AppLayout>
         <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-80 w-full rounded-xl" />
              ))}
            </div>
         </div>
       </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display">{t('title')}</h1>
            <p className="text-muted-foreground">{t('subtitle')}</p>
          </div>
          <div className="flex gap-2">
             <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('searchPlaceholder')}
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <CreateGroupDialog onGroupCreated={fetchData} />
          </div>
        </div>
        
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
            <h3 className="text-xl font-semibold">No Groups Found</h3>
            <p className="text-muted-foreground mt-2">
              {searchTerm ? `No groups match your search for "${searchTerm}".` : "There are no groups to display yet. Why not create one?"}
            </p>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
