'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback } from "react";
import type { User, Group } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

interface GoalMatesProps {
    userId: string;
}

export default function GoalMates({ userId }: GoalMatesProps) {
    const t = useTranslations('profile');
    const { user: authUser, loading: authLoading } = useAuth();
    const [goalMates, setGoalMates] = useState<User[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const fetchMates = useCallback(async (uid: string) => {
        setLoadingData(true);
        try {
            const userDocRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userDocRef);
            if (!userSnap.exists()) {
                setGoalMates([]);
                setLoadingData(false);
                return;
            }
            const currentUser = userSnap.data() as User;
            if (!currentUser.groups || currentUser.groups.length === 0) {
                 setGoalMates([]);
                 setLoadingData(false);
                 return;
            }

            const groupIds = currentUser.groups.slice(0, 30);
            if(groupIds.length === 0) {
                 setGoalMates([]);
                 setLoadingData(false);
                 return;
            }

            const groupsSnapshot = await getDocs(query(collection(db, 'groups'), where('__name__', 'in', groupIds)));
            const memberIds = new Set<string>();
            groupsSnapshot.forEach(doc => {
                const group = doc.data() as Group;
                group.members.forEach(memberId => {
                    if (memberId !== uid) {
                        memberIds.add(memberId);
                    }
                });
            });
            
            if (memberIds.size === 0) {
                setGoalMates([]);
                setLoadingData(false);
                return;
            };
            
            const memberIdChunks: string[][] = [];
            const ids = Array.from(memberIds);
            for (let i = 0; i < ids.length; i += 30) {
              memberIdChunks.push(ids.slice(i, i + 30));
            }

            const matesPromises = memberIdChunks.map(chunk => 
              getDocs(query(collection(db, 'users'), where('firebaseId', 'in', chunk)))
            );

            const snapshots = await Promise.all(matesPromises);
            const mates = snapshots.flatMap(snapshot => snapshot.docs.map(doc => doc.data() as User));
            setGoalMates(mates);
        } catch (error) {
            console.error("Failed to fetch goal mates:", error);
            setGoalMates([]);
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading && authUser) {
            fetchMates(userId);
        }
    }, [userId, authUser, authLoading, fetchMates]);

    const isLoading = authLoading || loadingData;

    if (isLoading) {
       return (
         <Card>
            <CardHeader>
                <CardTitle>{t('goalMates')}</CardTitle>
                <CardDescription>
                    {t('goalMatesDescription')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="group flex flex-col items-center gap-2 text-center">
                            <Skeleton className="h-20 w-20 rounded-full" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
       );
    }

    if (goalMates.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('goalMates')}</CardTitle>
                <CardDescription>
                    {t('goalMatesDescription')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {goalMates.map(mate => (
                        <Link href={{pathname: '/profile/[id]', params: {id: mate.id}}} key={mate.id} className="group flex flex-col items-center gap-2 text-center">
                            <Avatar className="h-20 w-20 ring-2 ring-offset-2 ring-offset-background ring-transparent group-hover:ring-primary transition-all">
                                <AvatarImage src={mate.avatarUrl} alt={mate.fullName} />
                                <AvatarFallback>{mate.firstName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="text-sm font-medium">{mate.fullName}</div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
