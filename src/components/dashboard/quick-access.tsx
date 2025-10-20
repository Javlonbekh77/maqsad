'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Link } from "@/navigation";
import { Button } from "../ui/button";
import { ArrowRight, Trophy, Users } from "lucide-react";
import useSWR from "swr";
import { getUserGroups } from "@/lib/data";
import type { Group } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import Image from "next/image";
import { Skeleton } from "../ui/skeleton";

const fetcher = (userId: string) => getUserGroups(userId);

function QuickAccessGroupList() {
    const { user } = useAuth();
    // Fetch only a few groups for quick access
    const { data: groups, error, isLoading } = useSWR(user ? user.id : null, (id) => fetcher(id).then(g => g.slice(0, 5)));

    if (isLoading) {
        return (
             <div className="space-y-2">
                {Array.from({length: 3}).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                ))}
            </div>
        )
    }

    if (error || !groups || groups.length === 0) {
        return <p className="px-3 text-sm text-muted-foreground">You haven't joined any groups yet.</p>;
    }
    
    return (
        <div className="space-y-2">
            {groups.map(group => (
                 <Link key={group.id} href={{pathname: '/groups/[id]', params: {id: group.id}}} className="block">
                    <Button variant="ghost" className="w-full justify-start h-auto py-2">
                         <div className="h-8 w-8 relative rounded-md overflow-hidden mr-3 shrink-0">
                            <Image src={group.imageUrl} alt={group.name} fill className="object-cover" />
                        </div>
                        <span className="truncate font-normal">{group.name}</span>
                    </Button>
                 </Link>
            ))}
             <Link href="/groups" className="block pt-2">
                <Button variant="link" className="w-full">
                    Barcha guruhlar <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            </Link>
        </div>
    )
}

export default function QuickAccess({ userGroups }: { userGroups: string[] }) {
    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Guruhlaringiz
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <QuickAccessGroupList />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                         <Trophy className="h-5 w-5" />
                        Peshqadamlar
                    </CardTitle>
                     <CardDescription>
                        Kimlar yetakchilik qilayotganini ko'ring.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Link href="/leaderboard" className="block">
                        <Button variant="outline" className="w-full">
                            Ro'yxatni ko'rish
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </>
    )
}
