'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { useTranslations } from 'next-intl';
import { updateUserProfile } from '@/lib/data';
import { useRouter } from '@/navigation';
import { useTransition, useEffect } from 'react';

const profileFormSchema = z.object({
  firstName: z.string().min(2, "Ism kamida 2 belgidan iborat bo'lishi kerak."),
  lastName: z.string().min(2, "Familiya kamida 2 belgidan iborat bo'lishi kerak."),
  goals: z
    .string()
    .max(300, { message: 'Maqsadlar 300 belgidan oshmasligi kerak.' })
    .optional().or(z.literal('')),
  habits: z
    .string()
    .max(300, { message: 'Odatlar 300 belgidan oshmasligi kerak.' })
    .optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfileForm({ user }: { user: User }) {
  const t = useTranslations('profile');
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      goals: user.goals || '',
      habits: user.habits || '',
    },
    mode: 'onChange',
  });
  
  useEffect(() => {
    form.reset({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      goals: user.goals || '',
      habits: user.habits || '',
    });
  }, [user, form]);


  async function onSubmit(data: ProfileFormValues) {
    startTransition(async () => {
      try {
        await updateUserProfile(user.id, data);
        toast({
            title: t('toast.title'),
            description: t('toast.description'),
        });
        router.refresh();
      } catch (error) {
         console.error("Failed to update profile:", error);
         toast({
          title: 'Error',
          description: 'Failed to update profile.',
          variant: 'destructive',
        });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ism</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Familiya</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <FormField
          control={form.control}
          name="goals"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">{t('myGoals')}</FormLabel>
              <FormDescription>
                {t('myGoalsDescription')}
              </FormDescription>
              <FormControl>
                <Textarea
                  placeholder={t('myGoalsPlaceholder')}
                  className="resize-y min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="habits"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">{t('myHabits')}</FormLabel>
              <FormDescription>
                {t('myHabitsDescription')}
              </FormDescription>
              <FormControl>
                <Textarea
                  placeholder={t('myHabitsPlaceholder')}
                  className="resize-y min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
            <Button type="submit" disabled={isPending || !form.formState.isDirty}>
              {isPending ? "Yangilanmoqda..." : t('updateButton')}
            </Button>
        </div>
      </form>
    </Form>
  );
}
