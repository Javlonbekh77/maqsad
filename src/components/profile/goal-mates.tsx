
'use client';

import { getGoalMates } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { User } from "@/lib/types";

interface GoalMatesProps {
    userId: string;
}

export default function GoalMates({ userId }: GoalMatesProps) {
    const t = useTranslations('profile');
    const [goalMates, setGoalMates] = useState<User[]>([]);

    useEffect(() => {
        async function fetchGoalMates() {
            const mates = await getGoalMates(userId);
            setGoalMates(mates);
        }
        fetchGoalMates();
    }, [userId]);


    if (goalMates.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('goalMates')}</CardTitle>
                <CardDescription>
                    {t('goalMatesDescription', { count: goalMates.length })}
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
