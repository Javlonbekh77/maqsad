'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { useTransition } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle } from 'lucide-react';

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, { message: "Joriy parolni kiritish majburiy." }),
  newPassword: z.string().min(6, { message: "Yangi parol kamida 6 belgidan iborat bo'lishi kerak." }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Yangi parollar mos kelmadi.",
  path: ['confirmPassword'],
});

type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;

export default function PasswordChangeForm() {
  const { updateUserPassword } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: PasswordChangeFormValues) => {
    setError(null);
    startTransition(async () => {
      try {
        await updateUserPassword(data.currentPassword, data.newPassword);
        toast({
          title: "Parol Muvaffaqiyatli O'zgartirildi!",
          description: "Hisobingiz xavfsizligi oshirildi.",
        });
        form.reset();
      } catch (err: any) {
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
             setError("Joriy parol noto'g'ri. Iltimos, tekshirib qayta urinib ko'ring.");
        } else {
             setError("Parolni yangilashda kutilmagan xatolik yuz berdi.");
        }
        console.error(err);
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Xatolik</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Joriy Parol</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Yangi Parol</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Yangi Parolni Tasdiqlang</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending || !form.formState.isDirty}>
            {isPending ? "Yangilanmoqda..." : "Parolni Yangilash"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
