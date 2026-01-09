'use client';
import AppLayout from '@/components/layout/app-layout';
import { useAuth } from '@/context/auth-context';
import { useRouter, Link } from '@/navigation';
import { useEffect, useState, useCallback, useTransition } from 'react';
import type { PersonalTask, UserTask } from '@/lib/types';
import { getPersonalTasksForUser, deletePersonalTask, getGroupTasksForUser, removeGroupTaskFromUserSchedule, getUser, updateGroupTaskSchedule, removeUserFromGroup } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, PlusCircle, Eye, EyeOff, Clock, Calendar, LogOut } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import TaskDetailDialog from '@/components/tasks/task-detail-dialog';


function MyTasksLoadingSkeleton() {
    return (
        <AppLayout>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div className='space-y-2'>
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-4 w-80" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
                <Card>
                    <CardContent className="p-6">
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}


export default function MyTasksPage() {
    const { user, loading: authLoading, refreshAuth } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [tasks, setTasks] = useState<PersonalTask[]>([]);
    const [groupTasks, setGroupTasks] = useState<UserTask[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [viewingTask, setViewingTask] = useState<UserTask | null>(null);
    const [editingScheduleTaskId, setEditingScheduleTaskId] = useState<string | null>(null);
    const [showScheduleEditDialog, setShowScheduleEditDialog] = useState(false);
    const [showLeaveDialog, setShowLeaveDialog] = useState(false);
    const [leaveGroupId, setLeaveGroupId] = useState<string | null>(null);
    const [leaveGroupName, setLeaveGroupName] = useState<string | null>(null);
    const [isLeaving, setIsLeaving] = useState(false);
    const [newScheduleType, setNewScheduleType] = useState<'one-time' | 'date-range' | 'recurring'>('one-time');
    const [newScheduleDate, setNewScheduleDate] = useState<string>('');
    const [newScheduleDays, setNewScheduleDays] = useState<string[]>([]);

    const fetchTasks = useCallback(async (userId: string) => {
        setLoadingTasks(true);
        try {
            const userDoc = await getUser(userId);
            if (!userDoc) {
                setTasks([]);
                setGroupTasks([]);
                return;
            }

            const [personal, groups] = await Promise.all([
                getPersonalTasksForUser(userId),
                getGroupTasksForUser(userDoc)
            ]);
            
            setTasks(personal);
            setGroupTasks(groups);

        } catch (error) {
            console.error("Failed to fetch tasks", error);
        } finally {
            setLoadingTasks(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
                return;
            }
            fetchTasks(user.id);
        }
    }, [user, authLoading, router, fetchTasks]);

    const handleDelete = (taskId: string) => {
        startTransition(async () => {
            try {
                await deletePersonalTask(taskId);
                toast({
                    title: "Vazifa o'chirildi",
                    description: "Sizning shaxsiy vazifangiz muvaffaqiyatli o'chirildi.",
                });
                setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
            } catch (error) {
                console.error("Failed to delete task", error);
                toast({
                    title: "Xatolik",
                    description: "Vazifani o'chirishda xatolik yuz berdi.",
                    variant: "destructive",
                });
            }
        });
    };

    const handleDeleteGroupTask = (taskId: string) => {
        startTransition(async () => {
            try {
                if (!user) return;
                await removeGroupTaskFromUserSchedule(user.id, taskId);
                toast({
                    title: "Guruh Vazifasi o'chirildi",
                    description: "Guruh vazifasi sizning rejangizdan muvaffaqiyatli o'chirildi.",
                });
                setGroupTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
            } catch (error) {
                console.error("Failed to delete group task", error);
                toast({
                    title: "Xatolik",
                    description: "Guruh vazifasini o'chirishda xatolik yuz berdi.",
                    variant: "destructive",
                });
            }
        });
    };

    const handleLeaveGroup = (task: UserTask) => {
        const gid = (task as any).groupId || null;
        setLeaveGroupId(gid);
        setLeaveGroupName(task.groupName || 'Guruh');
        setShowLeaveDialog(true);
    };

    const handleConfirmLeave = (removeTasks: boolean) => {
        if (!user || !leaveGroupId) return;
        startTransition(async () => {
            setIsLeaving(true);
            try {
                await removeUserFromGroup(user.id, leaveGroupId, removeTasks);
                // update local view
                setGroupTasks(prev => prev.filter(t => (t as any).groupId !== leaveGroupId));
                // refresh auth/user data
                if (refreshAuth) await refreshAuth();
                toast({ title: 'Guruh tark etildi', description: removeTasks ? 'Guruh vazifalari ham o\'chirildi.' : 'Guruhdan chiqildi.' });
            } catch (e) {
                console.error('Failed to leave group', e);
                toast({ title: 'Xatolik', description: 'Guruhni tark etishda xatolik yuz berdi.', variant: 'destructive' });
            } finally {
                setIsLeaving(false);
                setShowLeaveDialog(false);
                setLeaveGroupId(null);
                setLeaveGroupName(null);
            }
        });
    };
    
    const handleViewTask = (task: PersonalTask | UserTask) => {
        setViewingTask({
            ...task,
            taskType: (task as UserTask).taskType || 'personal',
            isCompleted: false, // Not relevant for detail view from this page
            coins: (task as UserTask).coins || 1, // Silver coin
            addedAt: (task as UserTask).addedAt || (task as PersonalTask).createdAt,
        });
    };

    const handleSaveScheduleEdit = async () => {
        if (!user || !editingScheduleTaskId) return;
        
        startTransition(async () => {
            try {
                const newSchedule = {
                    type: newScheduleType,
                    date: newScheduleType === 'one-time' ? newScheduleDate : undefined,
                    startDate: newScheduleType === 'date-range' ? newScheduleDate : undefined,
                    endDate: newScheduleType === 'date-range' ? undefined : undefined,
                    days: newScheduleType === 'recurring' ? newScheduleDays.map(d => d as any) : undefined,
                };

                await updateGroupTaskSchedule(user.id, editingScheduleTaskId, newSchedule);
                
                // Update local state
                setGroupTasks(prevTasks =>
                    prevTasks.map(task =>
                        task.id === editingScheduleTaskId
                            ? { ...task, schedule: newSchedule }
                            : task
                    )
                );

                toast({
                    title: "Jadval Yangilandi",
                    description: "Vazifaning jadavli muvaffaqiyatli yangilandi.",
                });
                
                setShowScheduleEditDialog(false);
                setEditingScheduleTaskId(null);
                setNewScheduleType('one-time');
                setNewScheduleDate('');
                setNewScheduleDays([]);
            } catch (error) {
                console.error("Failed to update schedule", error);
                toast({
                    title: "Xatolik",
                    description: "Jadvalni yangilashda xatolik yuz berdi.",
                    variant: "destructive",
                });
            }
        });
    };

    if (authLoading || loadingTasks) {
        return <MyTasksLoadingSkeleton />;
    }

    return (
        <AppLayout>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                     <div className="rounded-lg bg-background/50 backdrop-blur-sm p-6 border flex-1">
                        <h1 className="text-3xl font-bold font-display">Mening Vazifalarim</h1>
                        <p className="text-muted-foreground mt-1">
                           Shaxsiy vazifalaringizni boshqaring, tahrirlang yoki o'chiring.
                        </p>
                    </div>
                     <Button asChild>
                        <Link href="/my-tasks/add">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Yangi Vazifa Yaratish
                        </Link>
                    </Button>
                </div>

                {/* PERSONAL TASKS SECTION */}
                <Card>
                    <CardHeader>
                        <CardTitle>Barcha Shaxsiy Vazifalar</CardTitle>
                        <CardDescription>
                            Siz yaratgan barcha shaxsiy vazifalar va odatlar.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {tasks.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Sarlavha</TableHead>
                                            <TableHead>Ko'rinishi</TableHead>
                                            <TableHead className='text-right'>Amallar</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tasks.map(task => (
                                            <TableRow key={task.id}>
                                                <TableCell className="font-medium">
                                                    <div 
                                                        className="flex flex-col cursor-pointer hover:underline"
                                                        onClick={() => handleViewTask(task)}
                                                    >
                                                        <span>{task.title}</span>
                                                        <span className="text-xs text-muted-foreground line-clamp-1">{task.description}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {task.visibility === 'public' ? (
                                                        <span className='flex items-center gap-1.5 text-sm'><Eye className='h-4 w-4 text-primary' /> Ommaviy</span>
                                                    ) : (
                                                         <span className='flex items-center gap-1.5 text-sm text-muted-foreground'><EyeOff className='h-4 w-4' /> Shaxsiy</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                     <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/my-tasks/edit/${task.id}`}>
                                                            <Edit className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className='text-destructive hover:text-destructive'>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Haqiqatan ham o'chirmoqchimisiz?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Bu amalni ortga qaytarib bo'lmaydi. "{task.title}" vazifasi butunlay o'chiriladi.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDelete(task.id)}
                                                                    className='bg-destructive hover:bg-destructive/90'
                                                                    disabled={isPending}
                                                                >
                                                                    {isPending ? "O'chirilmoqda..." : "O'chirish"}
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">
                                Hozircha shaxsiy vazifalaringiz yo'q. Birinchisini yaratish vaqti keldi!
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* GROUP TASKS SECTION */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Guruh Vazifalarim
                        </CardTitle>
                        <CardDescription>
                            Siz qo'shilgan guruhlardagi vazifalar va ularning shaxsiy jadvallaringiz.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {groupTasks.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Guruh</TableHead>
                                            <TableHead>Sarlavha</TableHead>
                                            <TableHead className='text-right'>Amallar</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {groupTasks.map(task => (
                                            <TableRow key={task.id}>
                                                <TableCell className="font-medium text-sm">
                                                    {task.groupName || 'Noma\'lum Guruh'}
                                                </TableCell>
                                                <TableCell>
                                                    <div 
                                                        className="flex flex-col cursor-pointer hover:underline"
                                                        onClick={() => handleViewTask(task)}
                                                    >
                                                        <span>{task.title}</span>
                                                        <span className="text-xs text-muted-foreground line-clamp-1">{task.description}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right space-x-1">
                                                     <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        onClick={() => {
                                                            setEditingScheduleTaskId(task.id);
                                                            setNewScheduleType(task.schedule.type);
                                                            setNewScheduleDate(task.schedule.date || task.schedule.startDate || '');
                                                            setNewScheduleDays(task.schedule.days || []);
                                                            setShowScheduleEditDialog(true);
                                                        }}
                                                    >
                                                        <Clock className="h-4 w-4" />
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className='text-destructive hover:text-destructive'>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Guruh vazifasini o'chrmoqchimisiz?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Bu amalni ortga qaytarib bo'lmaydi. "{task.title}" guruh vazifasi sizning rejangizdan o'chiriladi.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDeleteGroupTask(task.id)}
                                                                    className='bg-destructive hover:bg-destructive/90'
                                                                    disabled={isPending}
                                                                >
                                                                    {isPending ? "O'chirilmoqda..." : "O'chirish"}
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" onClick={() => handleLeaveGroup(task)}>
                                                                <LogOut className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                          <AlertDialogHeader>
                                                            <AlertDialogTitle>Guruhni tark etish</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                "{leaveGroupName}" guruhini tark etmoqchimisiz? Guruh vazifalarini ham o'chirmoqchimisiz?
                                                            </AlertDialogDescription>
                                                          </AlertDialogHeader>
                                                          <AlertDialogFooter className='items-center gap-4'>
                                                            <AlertDialogCancel onClick={() => setShowLeaveDialog(false)}>Bekor qilish</AlertDialogCancel>
                                                            <Button onClick={() => handleConfirmLeave(false)} disabled={isLeaving} variant="outline">
                                                                Tark etish (vazifalarni saqlash)
                                                            </Button>
                                                            <AlertDialogAction onClick={() => handleConfirmLeave(true)} disabled={isLeaving} className='bg-destructive hover:bg-destructive/80'>
                                                                {isLeaving ? 'Jarayonda...' : 'Tark etish va vazifalarni o\'chirish'}
                                                            </AlertDialogAction>
                                                          </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">
                                Hozircha guruh vazifalaringiz yo'q. Biror guruha qo'shiling va ularning vazifalarini rejalashtiring!
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
             {viewingTask && (
                <TaskDetailDialog 
                    task={viewingTask}
                    isOpen={!!viewingTask}
                    onClose={() => setViewingTask(null)}
                />
            )}

            {/* Schedule Edit Dialog */}
            <Dialog open={showScheduleEditDialog} onOpenChange={setShowScheduleEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Jadvalini Tahrirlash</DialogTitle>
                        <DialogDescription>
                            Vazifaning yangi jadvalini belgilang - kunlarini yoki sanalarini o'zgartiring
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Schedule Type */}
                        <div>
                            <Label htmlFor="schedule-type">Jadval Turi</Label>
                            <Select value={newScheduleType} onValueChange={(value: any) => {
                                setNewScheduleType(value);
                                setNewScheduleDate('');
                                setNewScheduleDays([]);
                            }}>
                                <SelectTrigger id="schedule-type">
                                    <SelectValue placeholder="Jadval turini tanlang" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="one-time">Bir Marta</SelectItem>
                                    <SelectItem value="recurring">Takrorlanuvchi</SelectItem>
                                    <SelectItem value="date-range">Sana Oralig'i</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* One-time Date */}
                        {newScheduleType === 'one-time' && (
                            <div>
                                <Label htmlFor="date-input">Sana</Label>
                                <Input
                                    id="date-input"
                                    type="date"
                                    value={newScheduleDate}
                                    onChange={(e) => setNewScheduleDate(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Date Range */}
                        {newScheduleType === 'date-range' && (
                            <div>
                                <Label htmlFor="start-date">Boshlanish Sanasi</Label>
                                <Input
                                    id="start-date"
                                    type="date"
                                    value={newScheduleDate}
                                    onChange={(e) => setNewScheduleDate(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Recurring Days */}
                        {newScheduleType === 'recurring' && (
                            <div>
                                <Label>Kunlar</Label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                        <Button
                                            key={day}
                                            variant={newScheduleDays.includes(day) ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => {
                                                setNewScheduleDays(prev =>
                                                    prev.includes(day)
                                                        ? prev.filter(d => d !== day)
                                                        : [...prev, day]
                                                );
                                            }}
                                        >
                                            {day.slice(0, 3)}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowScheduleEditDialog(false);
                            setNewScheduleType('one-time');
                            setNewScheduleDate('');
                            setNewScheduleDays([]);
                        }}>
                            Bekor qilish
                        </Button>
                        <Button onClick={handleSaveScheduleEdit} disabled={isPending}>
                            {isPending ? "Saqlanmoqda..." : "Saqlash"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
