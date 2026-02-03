'use client';

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Repeat } from "lucide-react";
import Image from "next/image";
import { Badge } from "../ui/badge";

type PostCardProps = {
    author: {
        name: string;
        avatarUrl: string;
        username: string;
    };
    content: string;
    imageUrl?: string;
    imageHint?: string;
    timestamp: string;
    tags?: string[];
};

export default function PostCard({ author, content, imageUrl, imageHint, timestamp, tags }: PostCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={author.avatarUrl} alt={author.name} />
                    <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                    <div className="font-semibold">{author.name}</div>
                    <div className="text-sm text-muted-foreground">@{author.username} · {timestamp}</div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap">{content}</p>
                {imageUrl && (
                    <div className="rounded-lg border overflow-hidden aspect-video relative">
                        <Image
                            src={imageUrl}
                            alt="Post image"
                            fill
                            className="object-cover"
                            data-ai-hint={imageHint}
                        />
                    </div>
                )}
                {tags && tags.length > 0 && (
                     <div className="flex flex-wrap gap-2">
                        {tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
                    <Heart className="h-4 w-4" /> 12
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
                    <MessageCircle className="h-4 w-4" /> 5
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
                    <Repeat className="h-4 w-4" /> 2
                </Button>
            </CardFooter>
        </Card>
    )
}
