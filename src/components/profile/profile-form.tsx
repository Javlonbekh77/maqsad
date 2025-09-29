
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
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { Separator } from '../ui/separator';
import { useTranslations } from 'next-intl';
import { updateUserProfile } from '@/lib/data';
import { useRouter } from '@/navigation';
import { useTransition } from 'react';

const profileFormSchema = z.object({
  goals: z
    .string()
    .max(300, { message: 'Goals must not be longer than 300 characters.' })
    .min(10, { message: 'Please describe your goals in at least 10 characters.'}).optional().or(z.literal('')),
  habits: z
    .string()
    .max(300, { message: 'Habits must not be longer than 300 characters.' })
    .min(10, { message: 'Please describe your habits in at least 10 characters.'}).optional().or(z.literal('')),
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
      goals: user.goals || '',
      habits: user.habits || '',
    },
    mode: 'onChange',
  });

  function onSubmit(data: ProfileFormValues) {
    startTransition(async () => {
      try {
        await updateUserProfile(user.id, data);
        toast({
          title: t('toast.title'),
          description: t('toast.description'),
        });
        router.refresh();
      } catch (error) {
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
        <Separator className="my-6" />
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
            <Button type="submit" disabled={isPending}>{t('updateButton')}</Button>
        </div>
      </form>
    </Form>
  );
}
