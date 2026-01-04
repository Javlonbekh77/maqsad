'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { createPersonalTask } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Clock, CalendarIcon, Smile, CalendarDays } from 'lucide-react';
import type { DayOfWeek, TaskSchedule, PersonalTask } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useTransition, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

const scheduleSchema = z.object({
  type: z.enum(['one-time', 'date-range', 'recurring']),
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  days: z.array(z.string()).optional(),
}).refine(data => {
    if (data.type === 'one-time') return !!data.date;
    if (data.type === 'date-range') return !!data.startDate && !!data.endDate;
    if (data.type === 'recurring') return !!data.days && data.days.length > 0;
    return false;
}, {
    message: "Iltimos sana, sanalar oralig'i yoki takrorlanuvchi kunlarni tanlang.",
    path: ['type'], 
});


const personalTaskSchema = z.object({
  title: z.string().min(3, { message: "Sarlavha kamida 3 belgidan iborat bo'lishi kerak." }),
  description: z.string().min(10, { message: "Tavsif kamida 10 belgidan iborat bo'lishi kerak." }),
  estimatedTime: z.string().optional(),
  satisfactionRating: z.number().min(1).max(10),
  schedule: scheduleSchema,
  visibility: z.enum(['public', 'private']),
});

const daysOfWeek: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface CreateTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: (newTask: PersonalTask) => void;
}

export default function CreatePersonalTaskDialog({ isOpen, onClose, onTaskCreated }: CreateTaskDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const dialogContentRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof personalTaskSchema>>({
    resolver: zodResolver(personalTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      estimatedTime: '',
      satisfactionRating: 5,
      schedule: {
        type: 'recurring',
        days: [],
      },
      visibility: 'private',
    },
  });

  const onSubmit = (values: z.infer<typeof personalTaskSchema>) => {
    if (!user) return;

    startTransition(async () => {
        try {
        const newTask = await createPersonalTask({
            ...values,
            userId: user.id,
            schedule: values.schedule as TaskSchedule,
        });
        toast({
            title: "Shaxsiy Vazifa Yaratildi!",
            description: "Yangi odatingiz muvaffaqiyatli qo'shildi.",
        });
        onTaskCreated(newTask);
        form.reset();
        onClose();
        } catch (error) {
        console.error("Failed to create personal task", error);
        toast({
            title: "Xatolik",
            description: "Vazifani yaratishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
            variant: "destructive",
        });
        }
    });
  };

  const scheduleType = form.watch('schedule.type');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl" ref={dialogContentRef}>
            <DialogHeader>
                <DialogTitle>Shaxsiy Vazifa / Odat Yaratish</DialogTitle>
                <DialogDescription>
                    Yangi odatlarni shakllantirish orqali o'z maqsadingiz sari intiling.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
                  <ScrollArea className="max-h-[60vh] p-1">
                    <div className="space-y-6 px-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Sarlavha</FormLabel>
                                <FormControl>
                                    <Input placeholder="masalan, Har kuni ertalab yugurish" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Tavsif</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Bu odatning maqsadi va foydalari haqida batafsilroq..." {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField
                                control={form.control}
                                name="estimatedTime"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Clock className="h-4 w-4" /> Taxminiy Vaqt (ixtiyoriy)</FormLabel>
                                    <FormControl>
                                    <Input placeholder="masalan, 30 daqiqa" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="satisfactionRating"
                                render={({ field: { onChange, value } }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Smile className="h-4 w-4" /> Qoniqish Reytingi: {value}</FormLabel>
                                    <FormDescription>Bu vazifani bajarish siz uchun qanchalik muhim yoki yoqimli?</FormDescription>
                                    <FormControl>
                                        <Slider
                                            defaultValue={[value]}
                                            onValueChange={(values) => onChange(values[0])}
                                            max={10}
                                            min={1}
                                            step={1}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-4 rounded-lg border p-4">
                            <h3 className="flex items-center gap-2 font-semibold"><CalendarDays className="h-5 w-5" /> Vazifa Jadvali</h3>
                             <FormField
                                control={form.control}
                                name="schedule.type"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Jadval Turi</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Jadval turini tanlang" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent container={dialogContentRef.current}>
                                            <SelectItem value="recurring">Haftalik Takrorlanuvchi</SelectItem>
                                            <SelectItem value="one-time">Bir Martalik</SelectItem>
                                            <SelectItem value="date-range">Sana Oralig'i</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            {scheduleType === 'recurring' && (
                                    <FormField
                                        control={form.control}
                                        name="schedule.days"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Hafta Kunlari</FormLabel>
                                            <FormControl>
                                                <ToggleGroup
                                                    type="multiple"
                                                    variant="outline"
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    className="flex-wrap justify-start"
                                                >
                                                    {daysOfWeek.map(day => (
                                                        <ToggleGroupItem key={day} value={day} aria-label={day}>{day.slice(0,3)}</ToggleGroupItem>
                                                    ))}
                                                </ToggleGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                )}

                                {scheduleType === 'one-time' && (
                                    <FormField
                                        control={form.control}
                                        name="schedule.date"
                                        render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Sana</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                    <Button variant={"outline"}>
                                                        {field.value ? format(new Date(field.value), "PPP") : <span>Sanani tanlang</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start" container={dialogContentRef.current}>
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value ? new Date(field.value) : undefined}
                                                        onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                )}

                                {scheduleType === 'date-range' && (
                                    <Controller
                                        control={form.control}
                                        name="schedule"
                                        render={({ field: { onChange, value } }) => {
                                            const dateRange: DateRange | undefined = value.startDate ? { from: new Date(value.startDate), to: value.endDate ? new Date(value.endDate) : undefined } : undefined;
                                            return (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Sana Oralig'i</FormLabel>
                                                <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant={"outline"}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {dateRange?.from ? (
                                                        dateRange.to ? (
                                                        <>
                                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                                            {format(dateRange.to, "LLL dd, y")}
                                                        </>
                                                        ) : (
                                                        format(dateRange.from, "LLL dd, y")
                                                        )
                                                    ) : (
                                                        <span>Oraliqni tanlang</span>
                                                    )}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start" container={dialogContentRef.current}>
                                                    <Calendar
                                                    initialFocus
                                                    mode="range"
                                                    defaultMonth={dateRange?.from}
                                                    selected={dateRange}
                                                    onSelect={(range) => {
                                                        onChange({
                                                            ...value,
                                                            startDate: range?.from ? format(range.from, 'yyyy-MM-dd') : undefined,
                                                            endDate: range?.to ? format(range.to, 'yyyy-MM-dd') : undefined,
                                                        })
                                                    }}
                                                    numberOfMonths={2}
                                                    />
                                                </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}}
                                    />
                                )}
                        </div>
                         
                         <FormField
                            control={form.control}
                            name="visibility"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                        Ommaviy Vazifa
                                    </FormLabel>
                                    <FormDescription>
                                        Yoqilgan bo'lsa, bu vazifa profilingizda boshqalarga ko'rinadi.
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                    checked={field.value === 'public'}
                                    onCheckedChange={(checked) => field.onChange(checked ? 'public' : 'private')}
                                    />
                                </FormControl>
                                </FormItem>
                            )}
                        />
                      </div>
                    </ScrollArea>
                    <DialogFooter className='pt-6'>
                         <DialogClose asChild>
                            <Button variant="outline" type="button">Bekor qilish</Button>
                        </DialogClose>
                         <Button type="submit" disabled={isPending}>
                            {isPending ? "Yaratilmoqda..." : "Vazifani Yaratish"}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
