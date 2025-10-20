'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Calendar, Clock, Video, PlusCircle, Trash2, Edit } from "lucide-react";
import { Link } from "@/navigation";
import type { WeeklyMeeting } from "@/lib/types";
import CreateMeetingDialog from "./create-meeting-dialog";
import { deleteMeeting } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";

interface WeeklyMeetingsProps {
    groupId: string;
    initialMeetings: WeeklyMeeting[];
    isAdmin: boolean;
    onUpdate: () => void;
}

export default function WeeklyMeetings({ groupId, initialMeetings, isAdmin, onUpdate }: WeeklyMeetingsProps) {
    const { toast } = useToast();
    const [meetings, setMeetings] = useState(initialMeetings);
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<WeeklyMeeting | null>(null);

    const handleMeetingCreated = (newMeeting: WeeklyMeeting) => {
        setMeetings(prev => [...prev, newMeeting]);
        onUpdate();
    }
    
    const handleMeetingUpdated = (updatedMeeting: WeeklyMeeting) => {
        setMeetings(prev => prev.map(m => m.id === updatedMeeting.id ? updatedMeeting : m));
        onUpdate();
    }

    const handleDelete = async (meetingId: string) => {
        try {
            await deleteMeeting(meetingId);
            setMeetings(prev => prev.filter(m => m.id !== meetingId));
            toast({
                title: "Uchrashuv o'chirildi",
                description: "Rejalashtirilgan uchrashuv bekor qilindi.",
            });
        } catch (error) {
            console.error("Failed to delete meeting", error);
            toast({
                title: "Xatolik",
                description: "Uchrashuvni o'chirishda xatolik yuz berdi.",
                variant: "destructive",
            });
        }
    }


    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Haftalik Uchrashuvlar</CardTitle>
                    <CardDescription>Guruhning navbatdagi sinxronlash nuqtalari.</CardDescription>
                </div>
                {isAdmin && (
                    <Button onClick={() => setCreateDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Uchrashuv Yaratish
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                 {meetings.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Bu guruh uchun rejalashtirilgan uchrashuvlar mavjud emas.</p>
                 ) : (
                    meetings.map(meeting => (
                        <div key={meeting.id} className="p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex-1">
                                <h3 className="font-semibold">{meeting.title}</h3>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
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
                            <div className="flex items-center gap-2">
                                {isAdmin && (
                                    <>
                                        <Button variant="ghost" size="icon" onClick={() => setEditingMeeting(meeting)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                   "{meeting.title}" uchrashuvini o'chirishni xohlaysizmi? Bu amalni ortga qaytarib bo'lmaydi.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(meeting.id)} className="bg-destructive hover:bg-destructive/90">
                                                    Delete
                                                </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </>
                                )}
                                <Button asChild>
                                    <Link href={meeting.url} target="_blank">
                                        <Video className="mr-2 h-4 w-4" />
                                        Qo'shilish
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    ))
                 )}
            </CardContent>
            {isAdmin && (
                <>
                    <CreateMeetingDialog
                        isOpen={isCreateDialogOpen}
                        onClose={() => setCreateDialogOpen(false)}
                        groupId={groupId}
                        onMeetingCreated={handleMeetingCreated}
                    />
                    {editingMeeting && (
                        <CreateMeetingDialog
                            isOpen={!!editingMeeting}
                            onClose={() => setEditingMeeting(null)}
                            groupId={groupId}
                            onMeetingCreated={handleMeetingUpdated}
                            existingMeeting={editingMeeting}
                        />
                    )}
                </>
            )}
        </Card>
    );
}
