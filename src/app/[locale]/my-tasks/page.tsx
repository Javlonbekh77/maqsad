'use client';
import AppLayout from '@/components/layout/app-layout';
import { useAuth } from '@/context/auth-context';
import { useRouter, Link } from '@/navigation';
import { useEffect, useState, useCallback, useTransition } from 'react';
import type { PersonalTask, UserTask, TaskSchedule, DayOfWeek } from '@/lib/types';
import { getPersonalTasksForUser, deletePersonalTask, getGroupTasksForUser, removeGroupTaskFromUserSchedule, getUser, updateGroupTaskSchedule, removeUserFromGroup } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, PlusCircle, Eye, EyeOff, Clock, LogOut, CalendarDays } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


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

const daysOfWeek: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];


export default function MyTasksPage() {
    const { user, loading: authLoading, refreshAuth } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [tasks, setTasks] = useState<PersonalTask[]>([]);
    const [groupTasks, setGroupTasks] = useState<UserTask[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [viewingTask, setViewingTask] = useState<UserTask | null>(null);
    const [editingScheduleTask, setEditingScheduleTask] = useState<UserTask | null>(null);
    const [showLeaveDialog, setShowLeaveDialog] = useState(false);
    const [leaveGroupId, setLeaveGroupId] = useState<string | null>(null);
    const [leaveGroupName, setLeaveGroupName] = useState<string | null>(null);
    const [isLeaving, setIsLeaving] = useState(false);

    // State for schedule editing
    const [newScheduleType, setNewScheduleType] = useState<TaskSchedule['type']>('one-time');
    const [newScheduleDate, setNewScheduleDate] = useState<string>('');
    const [newScheduleDays, setNewScheduleDays] = useState<string[]>([]);
    const [newScheduleDateRange, setNewScheduleDateRange] = useState<DateRange | undefined>(undefined);


    const fetchTasks = useCallback(async (userId: string) => {
        setLoadingTasks(true);
        try {
            const userDoc = await getUser(userId);
            if (userDoc) {
                const [personal, group] = await Promise.all([
                    getPersonalTasksForUser(userDoc.id),
                    getGroupTasksForUser(userDoc)
                ]);
                setTasks(personal);
                setGroupTasks(group);
            }
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
            isCompleted: false, // Not relevant for detail view from this page
            coins: task.taskType === 'personal' ? 1 : task.coins
        });
    };
    
    const openScheduleEditDialog = (task: UserTask) => {
        setEditingScheduleTask(task);
        const schedule = task.schedule || { type: 'one-time' };
        setNewScheduleType(schedule.type);

        if (schedule.type === 'one-time' && schedule.date) {
            setNewScheduleDate(schedule.date);
        } else {
            setNewScheduleDate('');
        }

        if (schedule.type === 'date-range' && schedule.startDate && schedule.endDate) {
            setNewScheduleDateRange({ from: new Date(schedule.startDate), to: new Date(schedule.endDate) });
        } else {
            setNewScheduleDateRange(undefined);
        }

        if (schedule.type === 'recurring' && schedule.days) {
            setNewScheduleDays(schedule.days as string[]);
        } else {
            setNewScheduleDays([]);
        }
    };

    const closeScheduleEditDialog = () => {
        setEditingScheduleTask(null);
    }

    const handleSaveScheduleEdit = async () => {
        if (!user || !editingScheduleTask) return;
        
        let newSchedule: TaskSchedule;

        switch (newScheduleType) {
            case 'one-time':
                if (!newScheduleDate) { toast({ variant: 'destructive', title: 'Sanani tanlang' }); return; }
                newSchedule = { type: 'one-time', date: newScheduleDate };
                break;
            case 'date-range':
                if (!newScheduleDateRange?.from || !newScheduleDateRange?.to) { toast({ variant: 'destructive', title: 'Sana oralig\'ini tanlang' }); return; }
                newSchedule = { type: 'date-range', startDate: format(newScheduleDateRange.from, 'yyyy-MM-dd'), endDate: format(newScheduleDateRange.to, 'yyyy-MM-dd') };
                break;
            case 'recurring':
                if (newScheduleDays.length === 0) { toast({ variant: 'destructive', title: 'Kunlarni tanlang' }); return; }
                newSchedule = { type: 'recurring', days: newScheduleDays as DayOfWeek[] };
                break;
            default:
                toast({ variant: 'destructive', title: 'Noto\'g\'ri jadval turi' });
                return;
        }

        startTransition(async () => {
            try {
                await updateGroupTaskSchedule(user.id, editingScheduleTask.id, newSchedule);
                
                // Update local state
                setGroupTasks(prevTasks =>
                    prevTasks.map(task =>
                        task.id === editingScheduleTask.id
                            ? { ...task, schedule: newSchedule }
                            : task
                    )
                );

                toast({
                    title: "Jadval Yangilandi",
                    description: "Vazifaning jadavli muvaffaqiyatli yangilandi.",
                });
                
                closeScheduleEditDialog();
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
                           Shaxsiy va guruh vazifalaringizni boshqaring.
                        </p>
                    </div>
                     <Button asChild>
                        <Link href="/my-tasks/add">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Yangi Vazifa Yaratish
                        </Link>
                    </Button>
                </div>

                <Tabs defaultValue="personal">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="personal">Shaxsiy Vazifalar</TabsTrigger>
                        <TabsTrigger value="group">Guruh Vazifalari</TabsTrigger>
                    </TabsList>
                    <TabsContent value="personal">
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
                    </TabsContent>
                    <TabsContent value="group">
                        <Card>
                            <CardHeader>
                                <CardTitle>Guruh Vazifalarim</CardTitle>
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
                                                            <Link href={`/groups/${(task as any).groupId}`} className="hover:underline">{task.groupName || 'Noma\'lum Guruh'}</Link>
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
                                                                onClick={() => openScheduleEditDialog(task)}
                                                            >
                                                                <CalendarDays className="h-4 w-4" />
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
                                                                            {isPending ? "O'chirilmoqda..." : "Rejadan O'chirish"}
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                            <Button variant="ghost" size="icon" onClick={() => handleLeaveGroup(task)}>
                                                                <LogOut className="h-4 w-4 text-red-600" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-muted-foreground">
                                        Hozircha guruh vazifalaringiz yo'q. Biror guruhga qo'shiling va ularning vazifalarini rejalashtiring!
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
             {viewingTask && (
                <TaskDetailDialog 
                    task={viewingTask}
                    isOpen={!!viewingTask}
                    onClose={() => setViewingTask(null)}
                />
            )}

            <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>"{leaveGroupName}" guruhini tark etish</AlertDialogTitle>
                        <AlertDialogDescription>
                           Bu guruhni tark etmoqchisiz. Guruh vazifalaringizni ham rejalaringizdan o'chirmoqchimisiz?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="sm:justify-start">
                        <AlertDialogCancel disabled={isLeaving}>Bekor qilish</AlertDialogCancel>
                        <Button onClick={() => handleConfirmLeave(false)} disabled={isLeaving} variant="outline">
                            Faqat Guruhni Tark Etish
                        </Button>
                        <Button onClick={() => handleConfirmLeave(true)} disabled={isLeaving} variant="destructive">
                            {isLeaving ? 'Jarayonda...' : 'Tark Etish va Vazifalarni O\'chirish'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={!!editingScheduleTask} onOpenChange={closeScheduleEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Jadvalini Tahrirlash: {editingScheduleTask?.title}</DialogTitle>
                        <DialogDescription>
                            Vazifaning yangi jadvalini belgilang - kunlarini yoki sanalarini o'zgartiring.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 pt-4">
                        <div>
                            <Label htmlFor="schedule-type">Jadval Turi</Label>
                            <Select value={newScheduleType} onValueChange={(value: any) => setNewScheduleType(value)}>
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

                        {newScheduleType === 'one-time' && (
                            <div className="space-y-2">
                                <Label htmlFor="date-input">Sana</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {newScheduleDate ? format(new Date(newScheduleDate), "PPP") : <span>Sanani tanlang</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={newScheduleDate ? new Date(newScheduleDate) : undefined} onSelect={(date) => setNewScheduleDate(date ? format(date, 'yyyy-MM-dd') : '')} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}

                        {newScheduleType === 'date-range' && (
                            <div className="space-y-2">
                                <Label>Sana Oralig'i</Label>
                                 <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {newScheduleDateRange?.from ? (
                                                newScheduleDateRange.to ? (
                                                <>
                                                    {format(newScheduleDateRange.from, "LLL dd, y")} -{" "}
                                                    {format(newScheduleDateRange.to, "LLL dd, y")}
                                                </>
                                                ) : (
                                                format(newScheduleDateRange.from, "LLL dd, y")
                                                )
                                            ) : (
                                                <span>Oraliqni tanlang</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar initialFocus mode="range" defaultMonth={newScheduleDateRange?.from} selected={newScheduleDateRange} onSelect={setNewScheduleDateRange} numberOfMonths={2} />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}

                        {newScheduleType === 'recurring' && (
                            <div>
                                <Label>Kunlar</Label>
                                <ToggleGroup type="multiple" variant="outline" className="flex-wrap justify-start pt-2" value={newScheduleDays} onValueChange={(days) => setNewScheduleDays(days)}>
                                    {daysOfWeek.map(day => (
                                        <ToggleGroupItem key={day} value={day}>{day.slice(0, 3)}</ToggleGroupItem>
                                    ))}
                                </ToggleGroup>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={closeScheduleEditDialog}>
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
