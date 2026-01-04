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

const emailChangeSchema = z.object({
  newEmail: z.string().email({ message: "Yaroqsiz email manzili." }),
  currentPassword: z.string().min(1, { message: "Joriy parolni kiritish majburiy." }),
});

type EmailChangeFormValues = z.infer<typeof emailChangeSchema>;

export default function EmailChangeForm() {
  const { updateUserEmail, user } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<EmailChangeFormValues>({
    resolver: zodResolver(emailChangeSchema),
    defaultValues: {
      newEmail: '',
      currentPassword: '',
    },
  });

  const onSubmit = async (data: EmailChangeFormValues) => {
    setError(null);
    startTransition(async () => {
      try {
        await updateUserEmail(data.currentPassword, data.newEmail);
        toast({
          title: "Email Muvaffaqiyatli O'zgartirildi!",
          description: `Yangi email manzilingiz: ${data.newEmail}. Iltimos, qayta tizimga kiring.`,
        });
        // Optionally log the user out to force re-login with new email
        // logout();
        form.reset();
      } catch (err: any) {
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
             setError("Joriy parol noto'g'ri. Iltimos, tekshirib qayta urinib ko'ring.");
        } else if (err.code === 'auth/email-already-in-use') {
             setError("Ushbu email manzili allaqachon ro'yxatdan o'tgan.");
        }
        else {
             setError("Emailni o'zgartirishda kutilmagan xatolik yuz berdi.");
        }
        console.error(err);
      }
    });
  };
  
  if (!user) return null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Xatolik</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        <p className="text-sm text-muted-foreground">
          Joriy email: <span className="font-medium text-foreground">{user.email}</span>
        </p>
        <FormField
          control={form.control}
          name="newEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Yangi Email Manzili</FormLabel>
              <FormControl>
                <Input type="email" placeholder="yangi.email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending || !form.formState.isDirty}>
            {isPending ? "Yangilanmoqda..." : "Emailni Yangilash"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
