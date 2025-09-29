
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { useTranslation } from 'react-i18next';

const profileFormSchema = z.object({
  goals: z
    .string()
    .max(300, { message: 'Goals must not be longer than 300 characters.' })
    .min(10, { message: 'Please describe your goals in at least 10 characters.'}),
  habits: z
    .string()
    .max(300, { message: 'Habits must not be longer than 300 characters.' })
    .min(10, { message: 'Please describe your habits in at least 10 characters.'}),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfileForm({ user }: { user: User }) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      goals: user.goals || '',
      habits: user.habits || '',
    },
    mode: 'onChange',
  });

  function onSubmit(data: ProfileFormValues) {
    // In a real app, this would be an API call
    console.log('Updating profile:', data);
    toast({
      title: t('profile.toast.title'),
      description: t('profile.toast.description'),
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
              <FormLabel className="text-lg">{t('profile.myGoals')}</FormLabel>
              <FormDescription>
                {t('profile.myGoalsDescription')}
              </FormDescription>
              <FormControl>
                <Textarea
                  placeholder={t('profile.myGoalsPlaceholder')}
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
              <FormLabel className="text-lg">{t('profile.myHabits')}</FormLabel>
              <FormDescription>
                {t('profile.myHabitsDescription')}
              </FormDescription>
              <FormControl>
                <Textarea
                  placeholder={t('profile.myHabitsPlaceholder')}
                  className="resize-y min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
            <Button type="submit">{t('profile.updateButton')}</Button>
        </div>
      </form>
    </Form>
  );
}
