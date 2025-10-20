'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Calendar, PlusCircle, Trash2, Edit } from "lucide-react";
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
            onUpdate();
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
                    <CardDescription>Guruhning rejalashtirilgan uchrashuv kunlari.</CardDescription>
                </div>
                {isAdmin && (
                    <Button onClick={() => { setEditingMeeting(null); setCreateDialogOpen(true); }}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Uchrashuv Belgilash
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
                                        <span>Har {meeting.day}</span>
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
                                                <AlertDialogTitle>Haqiqatan ham o'chirasizmi?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                   "{meeting.title}" uchrashuvini o'chirishni xohlaysizmi? Bu amalni ortga qaytarib bo'lmaydi.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(meeting.id)} className="bg-destructive hover:bg-destructive/90">
                                                    O'chirish
                                                </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </>
                                )}
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
