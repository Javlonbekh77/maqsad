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
import { PlusCircle, Coins } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { createTask } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

const taskSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  coins: z.coerce.number().min(1, { message: "Coins must be at least 1." }),
});

interface CreateTaskDialogProps {
  groupId: string;
  onTaskCreated: () => void;
}

export default function CreateTaskDialog({ groupId, onTaskCreated }: CreateTaskDialogProps) {
  const t = useTranslations('createTaskDialog');
  const tActions = useTranslations('actions');
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      coins: 10,
    },
  });

  const onSubmit = (values: z.infer<typeof taskSchema>) => {
    startTransition(async () => {
      try {
        await createTask({ ...values, groupId });
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('addTaskButton')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">{tActions('cancel')}</Button>
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
