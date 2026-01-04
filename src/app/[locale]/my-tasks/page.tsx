'use client';
import AppLayout from '@/components/layout/app-layout';
import { useAuth } from '@/context/auth-context';
import { useRouter, Link } from '@/navigation';
import { useEffect, useState, useCallback, useTransition } from 'react';
import type { PersonalTask, UserTask } from '@/lib/types';
import { getPersonalTasksForUser, deletePersonalTask } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, PlusCircle, Eye, EyeOff } from 'lucide-react';
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
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [tasks, setTasks] = useState<PersonalTask[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [viewingTask, setViewingTask] = useState<UserTask | null>(null);

    const fetchTasks = useCallback(async (userId: string) => {
        setLoadingTasks(true);
        try {
            const userTasks = await getPersonalTasksForUser(userId);
            setTasks(userTasks);
        } catch (error) {
            console.error("Failed to fetch personal tasks", error);
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
    
    const handleViewTask = (task: PersonalTask) => {
        setViewingTask({
            ...task,
            taskType: 'personal',
            isCompleted: false, // Not relevant for detail view from this page
            coins: 1 // Silver coin
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
            </div>
             {viewingTask && (
                <TaskDetailDialog 
                    task={viewingTask}
                    isOpen={!!viewingTask}
                    onClose={() => setViewingTask(null)}
                />
            )}
        </AppLayout>
    );
}
