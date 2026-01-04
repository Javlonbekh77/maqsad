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
import { useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { updatePersonalTask } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import type { PersonalTask } from '@/lib/types';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';


const taskSchema = z.object({
  title: z.string().min(3, { message: "Sarlavha kamida 3 belgidan iborat bo'lishi kerak." }),
  description: z.string().min(10, { message: "Tavsif kamida 10 belgidan iborat bo'lishi kerak." }),
  estimatedTime: z.string().optional(),
  satisfactionRating: z.number().min(1).max(10),
  visibility: z.enum(['public', 'private']),
});

interface EditTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: PersonalTask;
  onTaskUpdated: (updatedTask: PersonalTask) => void;
}

export default function EditPersonalTaskDialog({ isOpen, onClose, task, onTaskUpdated }: EditTaskDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task.title,
      description: task.description,
      estimatedTime: task.estimatedTime || "",
      satisfactionRating: task.satisfactionRating || 5,
      visibility: task.visibility || 'private',
    },
  });

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description,
        estimatedTime: task.estimatedTime || "",
        satisfactionRating: task.satisfactionRating || 5,
        visibility: task.visibility || 'private',
      });
    }
  }, [task, form]);

  const onSubmit = (values: z.infer<typeof taskSchema>) => {
    startTransition(async () => {
      try {
        const updatedTaskData = { ...task, ...values };
        await updatePersonalTask(task.id, values);
        toast({
            title: "Vazifa Yangilandi!",
            description: "Vazifa muvaffaqiyatli yangilandi.",
        });
        onTaskUpdated(updatedTaskData);
        onClose();
      } catch (error) {
        console.error("Failed to update task", error);
        toast({
            title: "Xatolik",
            description: "Vazifani yangilashda xatolik yuz berdi.",
            variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Shaxsiy Vazifani Tahrirlash</DialogTitle>
          <DialogDescription>Ushbu vazifa tafsilotlarini o'zgartiring.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
                    <Textarea placeholder="Bu odatning maqsadi va foydalari haqida..." {...field} />
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
                    <FormLabel>Taxminiy vaqt (ixtiyoriy)</FormLabel>
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
              name="visibility"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Ommaviy Vazifa</FormLabel>
                     <FormMessage />
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
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline" type="button">Bekor qilish</Button>
                </DialogClose>
                <Button type="submit" disabled={isPending || !form.formState.isDirty}>
                    {isPending ? "Yangilanmoqda..." : "O'zgarishlarni Saqlash"}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
