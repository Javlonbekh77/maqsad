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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

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
  occupation: z.string().optional().or(z.literal('')),
  university: z.string().optional().or(z.literal('')),
  specialization: z.string().optional().or(z.literal('')),
  course: z.string().optional().or(z.literal('')),
  telegram: z.string().optional().or(z.literal('')),
  interests: z.string().optional().or(z.literal('')),
  status: z.enum(['open-to-help', 'searching-goalmates', 'open-to-learn', 'none']).optional(),
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
      occupation: user.occupation || '',
      university: user.university || '',
      specialization: user.specialization || '',
      course: user.course || '',
      telegram: user.telegram || '',
      interests: user.interests || '',
      status: user.status || 'none',
    },
    mode: 'onChange',
  });
  
  useEffect(() => {
    form.reset({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      goals: user.goals || '',
      habits: user.habits || '',
      occupation: user.occupation || '',
      university: user.university || '',
      specialization: user.specialization || '',
      course: user.course || '',
      telegram: user.telegram || '',
      interests: user.interests || '',
      status: user.status || 'none',
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

  const statusOptions = [
      { value: 'none', label: 'Hech biri' },
      { value: 'open-to-learn', label: 'O\'rganishga ochiqman' },
      { value: 'open-to-help', label: 'Yordam berishga tayyorman' },
      { value: 'searching-goalmates', label: 'Maqsaddosh qidiryapman' },
  ]

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
            <FormField
              control={form.control}
              name="occupation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kasbingiz</FormLabel>
                   <FormControl>
                    <Input placeholder="e.g., Dasturchi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telegram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telegram Username</FormLabel>
                  <FormControl>
                     <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">@</span>
                        <Input placeholder="username" {...field} className="pl-7"/>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="university"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Universitet</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., TUIT" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mutaxassislik</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Software Engineering" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="course"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kurs (raqam)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Networking Statusi</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Statusingizni tanlang" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {statusOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         <FormDescription>
                            Bu profilingizda ko'rinadi va boshqalarga nima maqsadda ekanligingizni bildiradi.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
        </div>
         <FormField
          control={form.control}
          name="interests"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">Qiziqishlaringiz</FormLabel>
              <FormDescription>
                Qiziqishlaringizni vergul bilan ajratib yozing (masalan, Dasturlash, Kitob o'qish, Futbol).
              </FormDescription>
              <FormControl>
                <Textarea
                  placeholder="Qiziqishlaringizni shu yerga yozing..."
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
