'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle, Trophy, Bot, BookOpen, Clock } from 'lucide-react';
import Logo from '@/components/logo';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import ThemeSwitcher from '@/components/theme-switcher';
import SnowEffect from '@/components/layout/snow-effect';

export default function LandingPage() {
  const t = useTranslations('landing');

  const features = [
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: t('feature1Title'),
      description: t('feature1Desc'),
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-primary" />,
      title: t('feature2Title'),
      description: t('feature2Desc'),
    },
    {
      icon: <Trophy className="h-8 w-8 text-primary" />,
      title: t('feature3Title'),
      description: t('feature3Desc'),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SnowEffect />
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <Logo />
        </Link>
        <nav className="ml-auto flex gap-2 sm:gap-4 items-center">
          <ThemeSwitcher />
          <Button variant="ghost" asChild>
            <Link href="/login" prefetch={false}>
              {t('login')}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/signup" prefetch={false}>
              {t('signUp')}
            </Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="relative w-full pt-24 lg:pt-32 pb-12 md:pb-24 lg:pb-32">
          <div className="container px-4 md:px-6 text-center">
            <div className="flex flex-col items-center space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl font-display bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                {t('heroTitle')}
              </h1>
              <p className="mx-auto max-w-[700px] text-foreground/80 md:text-xl">
                {t('heroSubtitle')}
              </p>
              <div className="space-x-4 mt-6">
                <Button size="lg" asChild>
                  <Link href="/signup" prefetch={false}>
                    {t('getStarted')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-display">{t('whyTitle')}</h2>
              <p className="max-w-[900px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                {t('whySubtitle')}
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="bg-background border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1">
                  <CardHeader className="flex flex-col items-center text-center gap-4">
                    {feature.icon}
                    <CardTitle className="font-display">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center text-foreground/80">
                    {feature.description}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3 mt-12">
               <Card className="bg-background border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1">
                  <CardHeader className="flex flex-col items-center text-center gap-4">
                    <Bot className="h-8 w-8 text-primary" />
                    <CardTitle className="font-display">Aqlli Yordamchi (AI)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center text-foreground/80">
                    Maqsadlaringizni aniqlashtirish, ularni kichik, boshqariladigan vazifalarga bo'lish va samarali reja tuzishda sun'iy intellektdan yordam oling.
                  </CardContent>
                </Card>
                 <Card className="bg-background border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1">
                  <CardHeader className="flex flex-col items-center text-center gap-4">
                    <BookOpen className="h-8 w-8 text-primary" />
                    <CardTitle className="font-display">Kundalik Yuritish</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center text-foreground/80">
                    Har kungi fikrlaringizni, yutuqlaringizni va mulohazalaringizni yozib boring. Har bir yozuv uchun kumush tanga ishlab oling va o'z-o'zingizni tahlil qiling.
                  </CardContent>
                </Card>
                 <Card className="bg-background border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1">
                  <CardHeader className="flex flex-col items-center text-center gap-4">
                    <Clock className="h-8 w-8 text-primary" />
                    <CardTitle className="font-display">Fokus Taymer</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center text-foreground/80">
                    Pomodoro texnikasidan foydalanib, ish vaqtingizni intervallarga bo'ling. Diqqatingizni jamlang, samaradorligingizni oshiring va chalg'ishlardan saqlaning.
                  </CardContent>
                </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-background">
        <p className="text-xs text-foreground/60">{t('footerRights')}</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4 text-foreground/80" prefetch={false}>
            {t('footerTerms')}
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4 text-foreground/80" prefetch={false}>
            {t('footerPrivacy')}
          </Link>
        </nav>
      </footer>
    </div>
  );
}
