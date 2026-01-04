'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Coins, Clock, CalendarIcon } from 'lucide-react';
import { useTransition, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { updateTask } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import type { Task, TaskSchedule, DayOfWeek } from '@/lib/types';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
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

interface EditTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onTaskUpdated: () => void;
}

const daysOfWeek: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function EditTaskDialog({ isOpen, onClose, task, onTaskUpdated }: EditTaskDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const dialogContentRef = useRef<HTMLDivElement>(null);


  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task.title,
      description: task.description,
      coins: task.coins,
      estimatedTime: task.estimatedTime || "",
      satisfactionRating: task.satisfactionRating || 5,
      schedule: task.schedule || { type: 'recurring', days: [] }
    },
  });

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description,
        coins: task.coins,
        estimatedTime: task.estimatedTime || "",
        satisfactionRating: task.satisfactionRating || 5,
        schedule: task.schedule || { type: 'recurring', days: [] }
      });
    }
  }, [task, form]);

  const onSubmit = (values: z.infer<typeof taskSchema>) => {
    startTransition(async () => {
      try {
        await updateTask(task.id, values);
        toast({
            title: "Task Updated!",
            description: "The task has been successfully updated.",
        });
        onTaskUpdated();
        onClose();
      } catch (error) {
        console.error("Failed to update task", error);
        toast({
            title: "Error",
            description: "Failed to update the task. Please try again.",
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
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Update the details for this task.</DialogDescription>
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
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Run 5km" {...field} />
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Add details about the task" {...field} />
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
                        <FormLabel className='flex items-center gap-1'><Coins className="h-4 w-4 text-amber-500" /> Coins</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 50" {...field} />
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
                        <FormLabel className='flex items-center gap-1'><Clock className="h-4 w-4" /> Taxminiy vaqt (ixtiyoriy)</FormLabel>
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

                  <div className="space-y-4 rounded-lg border p-4">
                      <h3 className="font-semibold">Vazifa Jadvali</h3>
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
              </div>
            </ScrollArea>

            <DialogFooter className="pt-4">
                <DialogClose asChild>
                    <Button variant="outline" type="button">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isPending || !form.formState.isDirty}>
                    {isPending ? "Updating..." : "Save Changes"}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
