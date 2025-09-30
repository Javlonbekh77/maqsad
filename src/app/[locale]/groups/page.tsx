
'use client';

import AppLayout from "@/components/layout/app-layout";
import { getGroups, getUsers } from "@/lib/data";
import GroupCard from "@/components/groups/group-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useMemo } from "react";
import type { Group, User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "@/navigation";

type GroupWithMembers = Group & { memberDetails: User[] };

export default function GroupsPage() {
  const t = useTranslations('groups');
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!authUser) {
        router.push('/login');
      } else {
        async function fetchGroupsAndMembers() {
            setLoading(true);
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
              setLoading(false);
            }
        }
        fetchGroupsAndMembers();
      }
    }
  }, [authUser, authLoading, router]);

  const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

  const filteredGroupsWithMembers = useMemo(() => {
    return groups
      .filter(group => group.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(group => {
        const memberDetails = group.members
          .map(memberId => userMap.get(memberId))
          .filter(Boolean) as User[];
        return { ...group, memberDetails };
      });
  }, [groups, userMap, searchTerm]);

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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
              <Skeleton key={i} className="h-80 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGroupsWithMembers.map((group) => (
              <GroupCard key={group.id} group={group} members={group.memberDetails} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
