'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/components/layout/app-layout';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { createPersonalTask } from '@/lib/data';
import type { DayOfWeek } from '@/lib/types';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useRouter } from '@/navigation';

const taskSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().optional(),
  schedule: z.array(z.string()).min(1, { message: "Please select at least one day." }),
});

const daysOfWeek: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const dayAbbreviations = {
    'Sunday': 'S',
    'Monday': 'M',
    'Tuesday': 'T',
    'Wednesday': 'W',
    'Thursday': 'T',
    'Friday': 'F',
    'Saturday': 'S'
};

export default function CreatePersonalTaskPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      schedule: [],
    },
  });

  async function onSubmit(values: z.infer<typeof taskSchema>) {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to create a task.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await createPersonalTask({
        userId: user.id,
        title: values.title,
        description: values.description || '',
        schedule: values.schedule as DayOfWeek[],
      });
      toast({
        title: "Shaxsiy Vazifa Yaratildi!",
        description: "Yangi odatingiz muvaffaqiyatli saqlandi.",
      });
      // Redirect to profile to see the new task in the habit tracker
      router.push(`/profile/${user.id}`);
    } catch (error) {
      console.error("Failed to create personal task:", error);
      toast({
        title: "Error",
        description: "Could not create the task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return <AppLayout><div>Loading...</div></AppLayout>;
  }
  
  if (!user) {
     router.push('/login');
     return null;
  }

  return (
    <AppLayout>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Yangi Shaxsiy Vazifa Yaratish</CardTitle>
          <CardDescription>
            Bu vazifa faqat siz uchun. O'z odatlaringiz va maqsadlaringizni kuzatib boring. Har bir bajarilgan vazifa uchun 1 Kumush Tanga olasiz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vazifa Sarlavhasi</FormLabel>
                    <FormControl>
                      <Input placeholder="Masalan, 30 daqiqa kitob o'qish" {...field} />
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
                    <FormLabel>Tavsif (Ixtiyoriy)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Maqsadingiz haqida batafsilroq ma'lumot qo'shing" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="schedule"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Qaysi kunlarda?</FormLabel>
                        <FormControl>
                             <ToggleGroup
                                type="multiple"
                                variant="outline"
                                value={field.value}
                                onValueChange={field.onChange}
                                aria-label="Days of the week"
                                className="flex-wrap justify-start"
                            >
                                {daysOfWeek.map(day => (
                                    <ToggleGroupItem key={day} value={day} className="w-10 h-10">
                                        {dayAbbreviations[day]}
                                    </ToggleGroupItem>
                                ))}
                            </ToggleGroup>
                        </FormControl>
                         <FormDescription>
                            Ushbu vazifani haftaning qaysi kunlari bajarishni rejalashtirayotganingizni tanlang.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Yaratilmoqda...' : 'Vazifani Yaratish'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
