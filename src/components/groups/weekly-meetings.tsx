'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Calendar, Clock, Video } from "lucide-react";
import { Link } from "@/navigation";
import type { WeeklyMeeting } from "@/lib/types";

interface WeeklyMeetingsProps {
    groupId: string;
    meetings: WeeklyMeeting[];
}

export default function WeeklyMeetings({ groupId, meetings }: WeeklyMeetingsProps) {

    if (meetings.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Haftalik Uchrashuvlar</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Bu guruh uchun rejalashtirilgan uchrashuvlar mavjud emas.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Haftalik Uchrashuvlar</CardTitle>
                <CardDescription>Guruhning navbatdagi sinxronlash nuqtalari.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {meetings.map(meeting => (
                    <div key={meeting.id} className="p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="font-semibold">{meeting.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    <span>{meeting.day}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    <span>{meeting.time}</span>
                                </div>
                            </div>
                        </div>
                        <Button asChild>
                            <Link href={meeting.url} target="_blank">
                                <Video className="mr-2 h-4 w-4" />
                                Uchrashuvga qo'shilish
                            </Link>
                        </Button>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
