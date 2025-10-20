'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { WeeklyMeeting } from '@/lib/types';
import { useTransition, useEffect } from 'react';
import { createOrUpdateMeeting } from '@/lib/data';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const meetingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  day: z.string().min(1, 'Please select a day.'),
});

type MeetingFormValues = z.infer<typeof meetingSchema>;

interface CreateMeetingDialogProps {
    isOpen: boolean;
    onClose: () => void;
    groupId: string;
    onMeetingCreated: (meeting: WeeklyMeeting) => void;
    existingMeeting?: WeeklyMeeting | null;
}

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CreateMeetingDialog({ isOpen, onClose, groupId, onMeetingCreated, existingMeeting }: CreateMeetingDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!existingMeeting;

  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: '',
      day: '',
    },
  });
  
  useEffect(() => {
    if (isOpen) {
        form.reset(existingMeeting ? {
            title: existingMeeting.title,
            day: existingMeeting.day,
        } : {
            title: '',
            day: '',
        });
    }
  }, [isOpen, existingMeeting, form]);


  async function onSubmit(data: MeetingFormValues) {
    startTransition(async () => {
      try {
        const meetingData = { ...data, groupId };
        const savedMeeting = await createOrUpdateMeeting(meetingData, existingMeeting?.id);
        
        toast({
          title: isEditing ? 'Uchrashuv Yangilandi' : 'Uchrashuv Yaratildi',
          description: `Uchrashuv muvaffaqiyatli ${isEditing ? 'yangilandi' : 'yaratildi'}.`,
        });
        onMeetingCreated(savedMeeting);
        onClose();
      } catch (error) {
        console.error("Failed to save meeting:", error);
        toast({
          title: 'Error',
          description: 'Failed to save the meeting.',
          variant: 'destructive',
        });
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>{isEditing ? "Uchrashuvni Tahrirlash" : "Yangi Uchrashuv Yaratish"}</DialogTitle>
            <DialogDescription>
                {isEditing ? "Uchrashuv tafsilotlarini o'zgartiring." : "Guruh uchun yangi haftalik uchrashuv kunini belgilang."}
            </DialogDescription>
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
                          <Input placeholder="Haftalik Sinxronlash" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                     <FormField
                        control={form.control}
                        name="day"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Hafta Kuni</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Kunni tanlang" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {daysOfWeek.map(day => (
                                        <SelectItem key={day} value={day}>{day}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                  <DialogFooter>
                      <Button variant="outline" onClick={onClose} type="button">Bekor qilish</Button>
                      <Button type="submit" disabled={isPending || !form.formState.isDirty}>
                          {isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                      </Button>
                  </DialogFooter>
              </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
