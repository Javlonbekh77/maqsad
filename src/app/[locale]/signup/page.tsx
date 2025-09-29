
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { Link, useRouter } from '@/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import Logo from '@/components/logo';

const formSchema = z.object({
  firstName: z.string().min(2, { message: 'Ism kamida 2 harfdan iborat bo\'lishi kerak.' }),
  lastName: z.string().min(2, { message: 'Familiya kamida 2 harfdan iborat bo\'lishi kerak.' }),
  email: z.string().email({ message: 'Yaroqsiz email manzili.' }),
  password: z.string().min(6, { message: 'Parol kamida 6 belgidan iborat bo\'lishi kerak.' }),
  university: z.string().min(2, { message: 'Iltimos, universitetingizni kiriting.' }),
  specialization: z.string().min(2, { message: 'Iltimos, mutaxassisligingizni kiriting.' }),
  course: z.string().min(1, { message: 'Iltimos, o\'qish yilingizni kiriting.' }),
  telegram: z.string().optional(),
});

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      university: '',
      specialization: '',
      course: '',
      telegram: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    try {
      await signup(values);
      router.push('/dashboard');
    } catch (err: any)
      {
      console.error("Signup failed with code:", err.code, "and message:", err.message);
      if (err.code === 'auth/email-already-in-use') {
        setError('Bu email allaqachon ro\'yxatdan o\'tgan. Iltimos, tizimga kiring.');
      } else if (err.code === 'permission-denied') {
        setError('Ma\'lumotlar bazasiga yozishda xatolik. Firebase Rules sozlamalarini tekshirishingiz kerak.');
      }
      else {
        setError('Kutilmagan xatolik yuz berdi. Iltimos, qaytadan urunib ko\'ring.');
      }
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="flex justify-center mb-4">
            <Logo />
          </Link>
          <CardTitle className="text-2xl font-bold">Hisob Yaratish</CardTitle>
          <CardDescription>Hamjamiyatga qo'shiling va maqsadlaringizga erishishni boshlang.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Ro'yxatdan o'tish muvaffaqiyatsiz</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-2 gap-4">
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parol</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
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
                      <Input placeholder="Masalan, TATU" {...field} />
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
                      <Input placeholder="Masalan, Dasturiy injiniring" {...field} />
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
                    <FormLabel>Kurs</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Masalan, 3" {...field} />
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
                    <FormLabel>Telegram Username <span className="text-muted-foreground">(Ixtiyoriy)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="masalan, johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Hisob yaratilmoqda...' : 'Ro\'yxatdan o\'tish'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Hisobingiz bormi?{' '}
            <Link href="/login" className="underline">
              Kirish
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
