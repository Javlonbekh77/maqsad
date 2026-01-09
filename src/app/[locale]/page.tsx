'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Users, Trophy, Target, Zap, TrendingUp, Coins, Award, Sparkles, Calendar, MessageSquare, Crown, Medal, ArrowRight, Star } from 'lucide-react';
import Logo from '@/components/logo';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import ThemeSwitcher from '@/components/theme-switcher';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { getLeaderboardData } from '@/lib/data';
import type { User, Group } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function LandingPage() {
  const t = useTranslations('landing');
  const [topUsers, setTopUsers] = useState<User[]>([]);
  const [topGroups, setTopGroups] = useState<(Group & { coins: number })[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { topUsers, topGroups } = await getLeaderboardData();
        setTopUsers(topUsers.slice(0, 5)); // Show top 5
        setTopGroups(topGroups.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoadingLeaderboard(false);
      }
    };
    fetchLeaderboard();
  }, []);

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

  const additionalFeatures = [
    {
      icon: <Target className="h-6 w-6 text-primary" />,
      title: "Shaxsiy Maqsadlar",
      description: "O'z maqsadlaringizni belgilang va ularga erishish uchun rejalar tuzing."
    },
    {
      icon: <Calendar className="h-6 w-6 text-primary" />,
      title: "Rejalashtirish",
      description: "Kunlik, haftalik va oylik rejalar yarating va ularni samarali boshqaring."
    },
    {
      icon: <Zap className="h-6 w-6 text-primary" />,
      title: "Pomodoro Timer",
      description: "Fokuslanish va samaradorlikni oshirish uchun taymerdan foydalaning."
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-primary" />,
      title: "AI Yordamchi",
      description: "Sun'iy intellekt yordamchisi bilan vazifalaringizni optimallashtiring."
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
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
               <p className="font-semibold text-lg md:text-xl text-foreground max-w-2xl">
                "Bir maqsad yo'lida birlashganlar aql bovar qilmas kuchga ega!!!"
              </p>
              <div className="space-x-4">
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
          </div>
        </section>

        {/* Additional Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-display">Qo'shimcha Imkoniyatlar</h2>
              <p className="max-w-[900px] text-foreground/80 md:text-xl/relaxed">
                MaqsadM sizga maqsadlaringizga erishish uchun barcha kerakli vositalarni taqdim etadi
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-6 sm:grid-cols-2 md:gap-8 lg:max-w-none lg:grid-cols-4">
              {additionalFeatures.map((feature) => (
                <Card key={feature.title} className="bg-background border-border/50 hover:border-primary/30 transition-all hover:shadow-md">
                  <CardHeader className="flex flex-col items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 w-fit">
                      {feature.icon}
                    </div>
                    <CardTitle className="font-display text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-foreground/70">
                    {feature.description}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Leaderboard Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-display">Peshqadamlar Ro'yxati</h2>
              </div>
              <p className="max-w-[900px] text-foreground/80 md:text-xl/relaxed">
                Eng faol foydalanuvchilar va guruhlarni ko'ring va ularga qo'shiling
              </p>
            </div>
            
            <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
              {/* Top Users */}
              <Card className="bg-background border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Medal className="h-5 w-5 text-amber-500" />
                    <CardTitle className="font-display">Eng Yaxshi Foydalanuvchilar</CardTitle>
                  </div>
                  <CardDescription>Eng ko'p tanga to'plagan foydalanuvchilar</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingLeaderboard ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <Skeleton className="h-4 flex-1" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      ))}
                    </div>
                  ) : topUsers.length > 0 ? (
                    <div className="space-y-3">
                      {topUsers.map((user, index) => (
                        <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                            {index + 1}
                          </div>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                            <AvatarFallback>{user.firstName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{user.fullName}</p>
                            {index === 0 && <Badge variant="default" className="mt-1 text-xs">🏆 Yetakchi</Badge>}
                          </div>
                          <div className="flex items-center gap-1 text-amber-500 font-semibold">
                            <Coins className="h-4 w-4" />
                            <span>{user.coins}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Hozircha foydalanuvchilar yo'q</p>
                  )}
                </CardContent>
              </Card>

              {/* Top Groups */}
              <Card className="bg-background border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    <CardTitle className="font-display">Eng Yaxshi Guruhlar</CardTitle>
                  </div>
                  <CardDescription>Eng ko'p tanga to'plagan guruhlar</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingLeaderboard ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <Skeleton className="h-4 flex-1" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      ))}
                    </div>
                  ) : topGroups.length > 0 ? (
                    <div className="space-y-3">
                      {topGroups.map((group, index) => (
                        <div key={group.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                            {index + 1}
                          </div>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={group.imageUrl} alt={group.name} />
                            <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{group.name}</p>
                            {index === 0 && <Badge variant="default" className="mt-1 text-xs">👑 Yetakchi</Badge>}
                          </div>
                          <div className="flex items-center gap-1 text-amber-500 font-semibold">
                            <Coins className="h-4 w-4" />
                            <span>{group.coins}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Hozircha guruhlar yo'q</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 text-center">
              <Button size="lg" variant="outline" asChild>
                <Link href="/leaderboard" prefetch={false}>
                  To'liq Ro'yxatni Ko'rish
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-display">Qanday Ishlaydi?</h2>
              <p className="max-w-[900px] text-foreground/80 md:text-xl/relaxed">
                MaqsadM bilan muvaffaqiyatga erishish uchun 3 oddiy qadam
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl items-start gap-8 sm:grid-cols-3">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold font-display">Ro'yxatdan O'ting</h3>
                <p className="text-foreground/70">
                  Tez va oson ro'yxatdan o'ting va o'z profilingizni yarating
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold font-display">Guruhga Qo'shiling</h3>
                <p className="text-foreground/70">
                  O'z maqsadlaringizga mos guruh toping yoki yangi guruh yarating
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold font-display">Vazifalarni Bajarish</h3>
                <p className="text-foreground/70">
                  Vazifalarni bajarib, tangalar ishlab oling va peshqadamlar ro'yxatida yuqorilang
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10">
          <div className="container px-4 md:px-6 text-center">
            <div className="flex flex-col items-center space-y-6 max-w-2xl mx-auto">
              <Sparkles className="h-12 w-12 text-primary" />
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-display">
                Bugun O'z Maqsadingizga Qadam Qo'ying
              </h2>
              <p className="text-lg text-foreground/80 max-w-[600px]">
                MaqsadM jamoasiga qo'shiling va maqsadlaringizga erishishda birinchi qadamni tashlang. 
                Minglab foydalanuvchilar allaqachon o'z maqsadlariga erishmoqda!
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link href="/signup" prefetch={false}>
                    Bepul Ro'yxatdan O'tish
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login" prefetch={false}>
                    Kirish
                  </Link>
                </Button>
              </div>
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
