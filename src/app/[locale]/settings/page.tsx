'use client';

import AppLayout from "@/components/layout/app-layout";
import ProfileForm from "@/components/profile/profile-form";
import EmailChangeForm from "@/components/profile/email-change-form";
import PasswordChangeForm from "@/components/profile/password-change-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { useTranslations } from "next-intl";
import { useRouter } from "@/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import ThemeSwitcher from "@/components/theme-switcher";

export default function SettingsPage() {
    const tSettings = useTranslations('settings');
    const tProfile = useTranslations('profile');
    const { user, loading, refreshAuth } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);


    if (loading || !user) {
       return (
        <AppLayout>
             <div className="space-y-8">
                <div className="rounded-lg bg-background/50 backdrop-blur-sm p-6 border">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/4" />
                        <Skeleton className="h-4 w-1/3 mt-1" />
                    </CardHeader>
                    <CardContent>
                         <Skeleton className="h-24 w-full" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/4" />
                        <Skeleton className="h-4 w-1/3 mt-1" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/4" />
                        <Skeleton className="h-4 w-1/3 mt-1" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-48" />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
       );
    }

    return (
        <AppLayout>
            <div className="space-y-8">
                <div className="rounded-lg bg-background/50 backdrop-blur-sm p-6 border">
                    <h1 className="text-3xl font-bold font-display">{tProfile('settings.title')}</h1>
                    <p className="text-muted-foreground mt-1">{tSettings('subtitle')}</p>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Shaxsiy Ma'lumotlar</CardTitle>
                        <CardDescription>Ism, familiya, universitet va boshqa ma'lumotlaringizni o'zgartiring.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ProfileForm user={user} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Email Manzilini O'zgartirish</CardTitle>
                        <CardDescription>Hisobingizga biriktirilgan email manzilini yangilang.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <EmailChangeForm />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Parolni Yangilash</CardTitle>
                        <CardDescription>Xavfsizlik uchun parolingizni muntazam o'zgartirib turing.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PasswordChangeForm />
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Display</CardTitle>
                        <CardDescription>
                            Turn on or off dark mode.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ThemeSwitcher />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
