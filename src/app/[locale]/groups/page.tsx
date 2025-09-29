
'use client';

import AppLayout from "@/components/layout/app-layout";
import { getGroups, getUsers } from "@/lib/data";
import GroupCard from "@/components/groups/group-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { Group, User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "@/navigation";

type GroupWithMembers = Group & { memberUsers: User[] };

export default function GroupsPage() {
  const t = useTranslations('groups');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [groupsWithMembers, setGroupsWithMembers] = useState<GroupWithMembers[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
        async function fetchGroupsAndMembers() {
            setLoading(true);
            const groupsData = await getGroups();
            const allUsers = await getUsers();
            const userMap = new Map(allUsers.map(u => [u.id, u]));
            
            const enrichedGroups = groupsData.map(group => {
                const memberUsers = group.members
                .map(memberId => userMap.get(memberId))
                .filter(Boolean) as User[];
                return { ...group, memberUsers };
            });
            
            setGroupsWithMembers(enrichedGroups);
            setLoading(false);
        }
        fetchGroupsAndMembers();
    }
  }, [user, authLoading, router]);

  const isLoading = authLoading || loading;

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
              />
            </div>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('createGroup')}
            </Button>
          </div>
        </div>
        {isLoading ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groupsWithMembers.map((group) => (
              <GroupCard key={group.id} group={group} members={group.memberUsers} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
