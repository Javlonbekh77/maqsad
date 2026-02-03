'use client';

import { useState, useEffect } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { Link, useRouter } from '@/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, ArrowRight, BrainCircuit, HandHelping, Users, Search, School, GraduationCap, UserCheck, BookOpen } from 'lucide-react';
import Logo from '@/components/logo';
import { AnimatePresence, motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';


const formSchema = z.object({
  // Step 1
  firstName: z.string().min(2, { message: "Ism kamida 2 harfdan iborat bo'lishi kerak." }),
  lastName: z.string().min(2, { message: "Familiya kamida 2 harfdan iborat bo'lishi kerak." }),
  email: z.string().email({ message: 'Yaroqsiz email manzili.' }),
  password: z.string().min(6, { message: 'Parol kamida 6 belgidan iborat bo\'lishi kerak.' }),
  
  // Step 2
  educationStatus: z.enum(['student', 'master', 'applicant', 'pupil', 'other']),
  institution: z.string().min(2, { message: "O'quv muassasasi nomini kiriting." }),
  fieldOfStudy: z.string().optional(),
  course: z.string().optional(),
  
  // Step 3
  status: z.enum(['open-to-help', 'searching-goalmates', 'open-to-learn', 'none']).default('none'),
  skillsToHelp: z.string().optional(),
  skillsToLearn: z.string().optional(),
  goalMateTopics: z.string().optional(),

  // Step 4
  occupation: z.string().optional(),
  telegram: z.string().optional(),
  interests: z.string().optional(),
});


type FormValues = z.infer<typeof formSchema>;

const steps = [
    { id: 'Step 1', name: 'Hisob ma\'lumotlari', fields: ['firstName', 'lastName', 'email', 'password'] },
    { id: 'Step 2', name: 'Ta\'lim', fields: ['educationStatus', 'institution', 'fieldOfStudy', 'course'] },
    { id: 'Step 3', name: 'Networking', fields: ['status', 'skillsToHelp', 'skillsToLearn', 'goalMateTopics']},
    { id: 'Step 4', name: 'Qo\'shimcha', fields: ['occupation', 'telegram', 'interests'] }
]

const skillOptions = ['Dasturlash', 'Dizayn', 'Marketing', 'Biznes', 'Matematika', 'Fizika', 'Tarix', 'Ingliz tili', 'Rus tili', 'Startup'];

const SkillCheckboxGroup = ({ name, label, description }: { name: keyof FormValues, label: string, description: string }) => {
  const { control } = useForm<FormValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormDescription>{description}</FormDescription>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2">
            {skillOptions.map((option) => {
              const currentValues = typeof field.value === 'string' ? field.value.split(',').map(s => s.trim()).filter(Boolean) : [];
              return (
                <FormItem key={option} className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={currentValues.includes(option)}
                      onCheckedChange={(checked) => {
                        const set = new Set(currentValues);
                        if (checked) {
                          set.add(option);
                        } else {
                          set.delete(option);
                        }
                        field.onChange(Array.from(set).join(', '));
                      }}
                    />
                  </FormControl>
                  <FormLabel className="font-normal text-sm">{option}</FormLabel>
                </FormItem>
              );
            })}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};


export default function SignupPage() {
  const { signup, user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { status: 'none' },
  });
  
  useEffect(() => {
    if (!loading && user) {
      router.push('/news');
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
      router.push('/news');
    } catch (err: any) {
       if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please log in or use a different email.');
      } else {
        setError(`An unexpected error occurred: ${err.message}`);
      }
    }
  }

  if (loading || user) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-secondary">
          <p>Yuklanmoqda...</p>
        </div>
    );
  }
  
  const statusOptions = [
      { value: 'open-to-learn', label: 'O\'rganishga ochiqman', icon: BrainCircuit },
      { value: 'open-to-help', label: 'Yordam berishga tayyorman', icon: HandHelping },
      { value: 'searching-goalmates', label: 'Maqsaddosh qidiryapman', icon: Search },
      { value: 'none', label: 'Hech biri', icon: UserCheck },
  ]
  
  const educationStatusOptions = [
      { value: 'student', label: 'Talaba', icon: GraduationCap },
      { value: 'master', label: 'Magistr', icon: GraduationCap },
      { value: 'applicant', label: 'Abituriyent', icon: BookOpen },
      { value: 'pupil', label: 'Maktab o\'quvchisi', icon: School },
      { value: 'other', label: 'Boshqa', icon: Users },
  ]

  const educationStatus = form.watch('educationStatus');
  const networkingStatus = form.watch('status');

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
            <form className="space-y-6">
             {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Ro'yxatdan o'tishda xatolik</AlertTitle>
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
                    className="min-h-[350px]"
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
                    <h3 className='font-semibold text-lg'>2. Ta'lim</h3>
                    <FormField control={form.control} name="educationStatus" render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Sizning hozirgi statusingiz?</FormLabel>
                             <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                {educationStatusOptions.map(opt => (
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
                    
                    {educationStatus === 'pupil' && (
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <FormField control={form.control} name="institution" render={({ field }) => (
                               <FormItem><FormLabel>Maktab Nomi</FormLabel><FormControl><Input placeholder="e.g., 5-maktab" {...field} /></FormControl><FormMessage /></FormItem>
                           )}/>
                           <FormField control={form.control} name="course" render={({ field }) => (
                               <FormItem><FormLabel>Sinf (raqam)</FormLabel><FormControl><Input type="number" placeholder="e.g., 10" {...field} /></FormControl><FormMessage /></FormItem>
                           )}/>
                       </div>
                    )}

                    {(educationStatus === 'student' || educationStatus === 'master' || educationStatus === 'applicant' || educationStatus === 'other') && (
                       <FormField control={form.control} name="institution" render={({ field }) => (
                          <FormItem><FormLabel>O'quv Muassasasi Nomi</FormLabel><FormControl><Input placeholder="e.g., TUIT, PDP Academy" {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                    )}

                    {(educationStatus === 'student' || educationStatus === 'master') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="fieldOfStudy" render={({ field }) => (
                                <FormItem><FormLabel>Mutaxassislik</FormLabel><FormControl><Input placeholder="e.g., Software Engineering" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="course" render={({ field }) => (
                                <FormItem><FormLabel>Kurs (raqam)</FormLabel><FormControl><Input type="number" placeholder="e.g., 3" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                    )}
                  </div>
              )}

              {currentStep === 2 && (
                  <div className="space-y-4">
                     <h3 className='font-semibold text-lg'>3. Networking Maqsadingiz</h3>
                     <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Qanday maqsadda hamjamiyatga qo'shilyapsiz?</FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                                {statusOptions.map(opt => (
                                     <FormItem key={opt.value}>
                                        <FormControl>
                                            <RadioGroupItem value={opt.value} id={`status-${opt.value}`} className="sr-only" />
                                        </FormControl>
                                        <label
                                            htmlFor={`status-${opt.value}`}
                                            className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer h-full", field.value === opt.value && "border-primary")}
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
                     
                     <AnimatePresence>
                      {networkingStatus === 'open-to-help' && (
                        <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
                            <SkillCheckboxGroup
                              name="skillsToHelp"
                              label="Yordam bera oladigan sohalaringiz"
                              description="Qaysi fanlar yoki sohalarda bilimingiz kuchli?"
                            />
                        </motion.div>
                      )}
                      {networkingStatus === 'open-to-learn' && (
                         <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
                            <SkillCheckboxGroup
                              name="skillsToLearn"
                              label="O'rganmoqchi bo'lgan sohalaringiz"
                              description="Qaysi yangi bilimlarni egallashni xohlaysiz?"
                            />
                        </motion.div>
                      )}
                      {networkingStatus === 'searching-goalmates' && (
                         <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
                            <SkillCheckboxGroup
                              name="goalMateTopics"
                              label="Maqsaddosh qidirayotgan yo'nalishlaringiz"
                              description="Qaysi umumiy maqsadlar yo'lida sheriklar qidiryapsiz?"
                            />
                        </motion.div>
                      )}
                     </AnimatePresence>
                  </div>
              )}

              {currentStep === 3 && (
                 <div className="space-y-4">
                    <h3 className='font-semibold text-lg'>4. Qo'shimcha Ma'lumotlar</h3>
                    <FormField control={form.control} name="occupation" render={({ field }) => (
                        <FormItem><FormLabel>Kasbingiz (ixtiyoriy)</FormLabel><FormControl><Input placeholder="e.g., Dasturchi, Marketolog" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="telegram" render={({ field }) => (
                        <FormItem><FormLabel>Telegram Username (ixtiyoriy)</FormLabel><FormControl>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">@</span>
                                <Input placeholder="username" {...field} className="pl-7"/>
                            </div>
                        </FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="interests" render={({ field }) => (
                        <FormItem><FormLabel>Qiziqishlaringiz (ixtiyoriy)</FormLabel><FormControl><Textarea placeholder="Qiziqishlaringizni vergul bilan ajratib yozing (masalan, Dasturlash, Kitob o'qish, Futbol)" {...field} /></FormControl><FormMessage /></FormItem>
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
                    <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={form.formState.isSubmitting}>
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
