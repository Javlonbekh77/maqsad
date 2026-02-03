'use client';

import { useState, useEffect } from 'react';
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
import { AlertCircle, ArrowLeft, ArrowRight, BrainCircuit, HandHelping, Users, Search } from 'lucide-react';
import Logo from '@/components/logo';
import { AnimatePresence, motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  firstName: z.string().min(2, { message: "Ism kamida 2 harfdan iborat bo'lishi kerak." }),
  lastName: z.string().min(2, { message: "Familiya kamida 2 harfdan iborat bo'lishi kerak." }),
  email: z.string().email({ message: 'Yaroqsiz email manzili.' }),
  password: z.string().min(6, { message: 'Parol kamida 6 belgidan iborat bo\'lishi kerak.' }),
  occupation: z.string().optional(),
  university: z.string().optional(),
  specialization: z.string().optional(),
  course: z.string().optional(),
  telegram: z.string().optional(),
  interests: z.string().optional(),
  status: z.enum(['open-to-help', 'searching-goalmates', 'open-to-learn', 'none']).default('none'),
});

type FormValues = z.infer<typeof formSchema>;

const steps = [
    { id: 'Step 1', name: 'Hisob ma\'lumotlari', fields: ['firstName', 'lastName', 'email', 'password'] },
    { id: 'Step 2', name: 'Ta\'lim va Kasb', fields: ['university', 'specialization', 'course', 'occupation'] },
    { id: 'Step 3', name: 'Networking', fields: ['telegram', 'interests', 'status'] }
]

export default function SignupPage() {
  const { signup, user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      occupation: '',
      university: '',
      specialization: '',
      course: '',
      telegram: '',
      interests: '',
      status: 'none',
    },
  });
  
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  type FieldName = keyof FormValues;

  const next = async () => {
    const fields = steps[currentStep].fields;
    const output = await form.trigger(fields as FieldName[], { shouldFocus: true });
    if (!output) return;

    if (currentStep < steps.length - 1) {
      setCurrentStep(step => step + 1);
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(step => step - 1);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    try {
      await signup(values);
      router.push('/dashboard');
    } catch (err: any) {
       if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please log in or use a different email.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/password sign-up is not enabled. Please check your Firebase Console settings.');
      }
      else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else if (err.code === 'auth/configuration-not-found') {
         setError('Firebase configuration is missing or incorrect. Please contact support.');
      }
      else {
        setError(`An unexpected error occurred: ${err.message}`);
      }
    }
  }

  if (loading || user) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-secondary">
          <p>Loading...</p>
        </div>
    );
  }
  
  const statusOptions = [
      { value: 'open-to-learn', label: 'O\'rganishga ochiqman', icon: BrainCircuit },
      { value: 'open-to-help', label: 'Yordam berishga tayyorman', icon: HandHelping },
      { value: 'searching-goalmates', label: 'Maqsaddosh qidiryapman', icon: Search },
  ]

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary py-12 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <Link href="/" className="flex justify-center mb-4">
            <Logo />
          </Link>
          <CardTitle className="text-2xl font-bold text-center">MaqsadM 2.0 ga Xush Kelibsiz!</CardTitle>
          <CardDescription className="text-center">Hamjamiyatga qo'shiling va o'z maqsaddoshlaringizni toping.</CardDescription>
           <Progress value={(currentStep + 1) / steps.length * 100} className="mt-4" />
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
             {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Signup Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            
            <AnimatePresence mode="wait">
                 <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                >

              {currentStep === 0 && (
                <div className="space-y-4">
                    <h3 className='font-semibold text-lg'>1. Hisob Ma'lumotlari</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="firstName" render={({ field }) => (
                            <FormItem><FormLabel>Ism</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="lastName" render={({ field }) => (
                            <FormItem><FormLabel>Familiya</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                    </div>
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="name@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem><FormLabel>Parol</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
              )}

              {currentStep === 1 && (
                  <div className="space-y-4">
                    <h3 className='font-semibold text-lg'>2. Ta'lim va Kasb</h3>
                     <FormField control={form.control} name="university" render={({ field }) => (
                        <FormItem><FormLabel>Universitet</FormLabel><FormControl><Input placeholder="e.g., TUIT" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <FormField control={form.control} name="specialization" render={({ field }) => (
                            <FormItem><FormLabel>Mutaxassislik</FormLabel><FormControl><Input placeholder="e.g., Software Engineering" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                         <FormField control={form.control} name="course" render={({ field }) => (
                            <FormItem><FormLabel>Kurs (raqam)</FormLabel><FormControl><Input type="number" placeholder="e.g., 3" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                    </div>
                     <FormField control={form.control} name="occupation" render={({ field }) => (
                        <FormItem><FormLabel>Kasbingiz</FormLabel><FormControl><Input placeholder="e.g., Dasturchi, Marketolog" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                  </div>
              )}

              {currentStep === 2 && (
                  <div className="space-y-4">
                     <h3 className='font-semibold text-lg'>3. Networking</h3>
                     <FormField control={form.control} name="telegram" render={({ field }) => (
                        <FormItem><FormLabel>Telegram Username</FormLabel><FormControl>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">@</span>
                                <Input placeholder="username" {...field} className="pl-7"/>
                            </div>
                        </FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="interests" render={({ field }) => (
                        <FormItem><FormLabel>Qiziqishlaringiz</FormLabel><FormControl><Textarea placeholder="Qiziqishlaringizni vergul bilan ajratib yozing (masalan, Dasturlash, Kitob o'qish, Futbol)" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Sizning hozirgi maqsadingiz qanday?</FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {statusOptions.map(opt => (
                                     <FormItem key={opt.value}>
                                        <FormControl>
                                            <RadioGroupItem value={opt.value} id={opt.value} className="sr-only" />
                                        </FormControl>
                                        <label
                                            htmlFor={opt.value}
                                            className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer", field.value === opt.value && "border-primary")}
                                        >
                                            <opt.icon className="h-6 w-6 mb-2" />
                                            {opt.label}
                                        </label>
                                     </FormItem>
                                ))}
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                     )}/>
                  </div>
              )}
               </motion.div>
            </AnimatePresence>

              <div className="mt-8 pt-4 flex justify-between items-center">
                <Button type="button" variant="ghost" onClick={prev} disabled={currentStep === 0}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Ortga
                </Button>
                
                {currentStep < steps.length - 1 ? (
                    <Button type="button" onClick={next}>
                        Keyingisi <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Ro\'yxatdan o\'tilmoqda...' : 'Ro\'yxatdan O\'tish'}
                    </Button>
                )}
              </div>
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
