'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Coins, Clock, CalendarIcon } from 'lucide-react';
import { useState, useTransition, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { createTask } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import type { TaskSchedule, DayOfWeek } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Slider } from '../ui/slider';
import { ScrollArea } from '../ui/scroll-area';

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
    message: "Please select a date, date range, or recurring days.",
    path: ['type'], 
});


const taskSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  coins: z.coerce.number().min(1, { message: "Coins must be at least 1." }),
  estimatedTime: z.string().optional(),
  satisfactionRating: z.number().min(1).max(10),
  schedule: scheduleSchema,
});

interface CreateTaskDialogProps {
  groupId: string;
  onTaskCreated: () => void;
}

const daysOfWeek: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CreateTaskDialog({ groupId, onTaskCreated }: CreateTaskDialogProps) {
  const t = useTranslations('createTaskDialog');
  const tActions = useTranslations('actions');
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const dialogContentRef = useRef<HTMLDivElement>(null);


  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      coins: 10,
      estimatedTime: "",
      satisfactionRating: 5,
      schedule: {
          type: 'recurring',
          days: [],
      }
    },
  });

  const onSubmit = (values: z.infer<typeof taskSchema>) => {
    startTransition(async () => {
      try {
        await createTask({ ...values, groupId, schedule: values.schedule as TaskSchedule });
        toast({
            title: "Task Created!",
            description: "The new task has been added to the group.",
        });
        onTaskCreated();
        setOpen(false);
        form.reset();
      } catch (error) {
        console.error("Failed to create task", error);
        toast({
            title: "Error",
            description: "Failed to create the task. Please try again.",
            variant: "destructive",
        });
      }
    });
  };
  
  const scheduleType = form.watch('schedule.type');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('addTaskButton')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl" ref={dialogContentRef}>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="max-h-[70vh] p-1">
               <div className="space-y-6 px-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('titleLabel')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('titlePlaceholder')} {...field} />
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
                      <FormLabel>{t('descriptionLabel')}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t('descriptionPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="coins"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='flex items-center gap-1'><Coins className="h-4 w-4 text-amber-500" /> {t('coinsLabel')}</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder={t('coinsPlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="estimatedTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='flex items-center gap-1'><Clock className="h-4 w-4" /> Taxminiy Vaqt (ixtiyoriy)</FormLabel>
                        <FormControl>
                          <Input placeholder="masalan, 30 daqiqa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                    control={form.control}
                    name="satisfactionRating"
                    render={({ field: { onChange, value } }) => (
                      <FormItem>
                        <FormLabel>Qoniqish Reytingi: {value}</FormLabel>
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
                <FormField
                    control={form.control}
                    name="schedule.type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vazifa Jadvali</FormLabel>
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
                                        <ToggleGroupItem key={day} value={day}>{day.slice(0,3)}</ToggleGroupItem>
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
                                    <Button
                                        variant={"outline"}
                                    >
                                        {field.value ? (
                                        format(new Date(field.value), "PPP")
                                        ) : (
                                        <span>Sanani tanlang</span>
                                        )}
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
                        render={({ field: { onChange, value }}) => {
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
                            )
                        }}
                    />
                )}
               </div>
            </ScrollArea>
            <DialogFooter className="pt-4">
                <DialogClose asChild>
                    <Button variant="outline" type="button">{tActions('cancel')}</Button>
                </DialogClose>
                <Button type="submit" disabled={isPending}>
                    {isPending ? "Creating..." : t('createTaskButton')}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
