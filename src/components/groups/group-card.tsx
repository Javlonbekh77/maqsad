
'use client';

import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Group, User } from "@/lib/types";
import { getUserById } from "@/lib/data";
import { ArrowRight, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { useEffect, useState } from "react";

export default function GroupCard({ group }: { group: Group }) {
  const t = useTranslations('groupCard');
  const [members, setMembers] = useState<(User | undefined)[]>([]);

  useEffect(() => {
    async function fetchMembers() {
      const memberPromises = group.members.map(id => getUserById(id));
      const membersData = await Promise.all(memberPromises);
      setMembers(membersData.filter(Boolean));
    }
    fetchMembers();
  }, [group.members]);

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          <Image
            src={group.imageUrl}
            alt={group.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            data-ai-hint={group.imageHint}
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-6">
        <CardTitle className="font-display text-xl mb-2">{group.name}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-3">{group.description}</p>
      </CardContent>
      <CardFooter className="p-6 pt-0 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 overflow-hidden">
            {members.slice(0, 3).map((member) => (
              member &&
              <Avatar key={member.id} className="inline-block h-6 w-6 rounded-full ring-2 ring-background">
                <AvatarImage src={member.avatarUrl} />
                <AvatarFallback>{member.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="text-xs font-medium text-muted-foreground">{t('members', { count: group.members.length })}</span>
        </div>
        <Button variant="outline" size="sm" asChild>
          {/* We now use the original ID for the link, not the Firebase ID */}
          <Link href={`/groups/${group.id}`}>
            {t('view')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
