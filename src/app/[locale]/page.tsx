'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle, Trophy, Bot, BookOpen, Clock } from 'lucide-react';
import Logo from '@/components/logo';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import ThemeSwitcher from '@/components/theme-switcher';
import { getLeaderboardData } from '@/lib/data';
import useSWR from 'swr';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { getInitials, getAvatarColor } from '@/lib/utils';
import { Coins, Flame, Crown, Medal } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Medal className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
  return <span className="text-sm font-bold w-5 text-center">{rank}</span>;
};


function LandingLeaderboard() {
    const { data, error, isLoading } = useSWR('landingLeaderboard', getLeaderboardData, { revalidateOnFocus: false });

    if (isLoading) {
        return (
             <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-5xl">
                 {Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-72 w-full" />)}
            </div>
        )
    }

    if (error || !data) {
        return null; // Don't render if there's an error
    }

    const { topUsers, topSilverCoinUsers, topGroups } = data;

    return (
       <Tabs defaultValue="gold" className="w-full max-w-5xl">
          <TabsList className="grid w-full grid-cols-3 mx-auto max-w-md">
            <TabsTrigger value="gold"><Coins className="mr-2 h-4 w-4 text-amber-500" /> Oltin</TabsTrigger>
            <TabsTrigger value="silver"><Flame className="mr-2 h-4 w-4 text-slate-500" /> Kumush</TabsTrigger>
            <TabsTrigger value="groups"><Crown className="mr-2 h-4 w-4 text-primary" /> Guruhlar</TabsTrigger>
          </TabsList>
          <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-8 w-full mt-6">
            <TabsContent value="gold" className="mt-0">
              <Card>
                  <CardHeader className="flex flex-row items-center gap-2">
                      <Coins className="h-6 w-6 text-amber-500" />
                      <CardTitle>Eng Ko'p Oltin Tanga</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      {topUsers.slice(0,3).map((user, index) => (
                          <div key={user.id} className="flex items-center gap-3">
                              <RankIcon rank={index + 1} />
                              <Avatar className="h-9 w-9" style={{ backgroundColor: getAvatarColor(user.id) }}>
                                  <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                                  <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-semibold truncate">{user.fullName}</p>
                                <p className="text-xs text-muted-foreground">{user.coins} tanga</p>
                              </div>
                          </div>
                      ))}
                  </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="silver" className="mt-0">
              <Card>
                  <CardHeader className="flex flex-row items-center gap-2">
                      <Flame className="h-6 w-6 text-slate-500" />
                      <CardTitle>Eng Ko'p Kumush Tanga</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      {topSilverCoinUsers.slice(0,3).map((user, index) => (
                          <div key={user.id} className="flex items-center gap-3">
                              <RankIcon rank={index + 1} />
                              <Avatar className="h-9 w-9" style={{ backgroundColor: getAvatarColor(user.id) }}>
                                  <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                                  <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-semibold truncate">{user.fullName}</p>
                                <p className="text-xs text-muted-foreground">{user.silverCoins} tanga</p>
                              </div>
                          </div>
                      ))}
                  </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="groups" className="mt-0">
              <Card>
                  <CardHeader className="flex flex-row items-center gap-2">
                      <Crown className="h-6 w-6 text-primary" />
                      <CardTitle>Eng Ommabop Guruhlar</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      {topGroups.slice(0,3).map((group, index) => (
                          <div key={group.id} className="flex items-center gap-3">
                              <RankIcon rank={index + 1} />
                              <div className="h-9 w-9 relative rounded-md overflow-hidden shrink-0">
                                  <Image src={group.imageUrl} alt={group.name} fill className="object-cover" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold truncate">{group.name}</p>
                                <p className="text-xs text-muted-foreground">{group.members.length} a'zo</p>
                              </div>
                          </div>
                      ))}
                  </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
    )
}


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
     {
      icon: <Bot className="h-8 w-8 text-primary" />,
      title: 'Aqlli Yordamchi (AI)',
      description: "Maqsadlaringizni aniqlashtirish, ularni kichik, boshqariladigan vazifalarga bo'lish va samarali reja tuzishda sun'iy intellektdan yordam oling.",
    },
     {
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      title: 'Kundalik Yuritish',
      description: "Har kungi fikrlaringizni, yutuqlaringizni va mulohazalaringizni yozib boring. Har bir yozuv uchun kumush tanga ishlab oling va o'z-o'zingizni tahlil qiling.",
    },
     {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: 'Fokus Taymer',
      description: "Pomodoro texnikasidan foydalanib, ish vaqtingizni intervallarga bo'ling. Diqqatingizni jamlang, samaradorligingizni oshiring va chalg'ishlardan saqlaning.",
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
          </div>
        </section>
        
        <section id="leaderboard" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 flex flex-col items-center">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-display">Peshqadamlar Ro'yxati</h2>
              <p className="max-w-[900px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Jamiyatimizdagi eng faol ishtirokchilar va eng ommabop guruhlar bilan tanishing.
              </p>
            </div>
            <LandingLeaderboard />
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
