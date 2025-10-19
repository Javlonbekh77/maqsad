
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
import { useTransition, useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { Edit } from 'lucide-react';

const profileFormSchema = z.object({
  goals: z
    .string()
    .max(300, { message: 'Goals must not be longer than 300 characters.' })
    .min(10, { message: 'Please describe your goals in at least 10 characters.'}).optional().or(z.literal('')),
  habits: z
    .string()
    .max(300, { message: 'Habits must not be longer than 300 characters.' })
    .min(10, { message: 'Please describe your habits in at least 10 characters.'}).optional().or(z.literal('')),
  avatar: z.any().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfileForm({ user }: { user: User }) {
  const t = useTranslations('profile');
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      goals: user.goals || '',
      habits: user.habits || '',
    },
    mode: 'onChange',
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue('avatar', file);
    }
  };

  async function onSubmit(data: ProfileFormValues) {
    let profileUpdated = false;
    startTransition(async () => {
        try {
            await updateUserProfile(user.id, {
              goals: data.goals,
              habits: data.habits,
              avatarFile: data.avatar,
            });
            profileUpdated = true; // Mark as updated only on success
            toast({
              title: t('toast.title'),
              description: t('toast.description'),
            });
            
            form.reset({
              ...form.getValues(),
              avatar: null,
            });
    
          } catch (error) {
             console.error("Failed to update profile:", error);
             toast({
              title: 'Error',
              description: 'Failed to update profile.',
              variant: 'destructive',
            });
          } finally {
            setAvatarPreview(null);
            if (profileUpdated) {
                // Refresh the page to show the new avatar
                router.refresh();
            }
          }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="avatar"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">Avatar</FormLabel>
              <FormControl>
                <div className="flex items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarPreview || user.avatarUrl} alt={user.fullName} />
                    <AvatarFallback>{user.firstName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Change Photo
                  </Button>
                  <Input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/png, image/jpeg, image/gif"
                    onChange={handleAvatarChange}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
            <Button type="submit" disabled={isPending}>
              {isPending ? "Yangilanmoqda..." : t('updateButton')}
            </Button>
        </div>
      </form>
    </Form>
  );
}
