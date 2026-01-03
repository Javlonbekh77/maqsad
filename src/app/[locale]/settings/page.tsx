'use client';

import AppLayout from "@/components/layout/app-layout";
import ProfileForm from "@/components/profile/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { useTranslations } from "next-intl";
import { useRouter } from "@/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import ThemeSwitcher from "@/components/theme-switcher";
import AvatarUpload from "@/components/profile/avatar-upload";

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
                <div>
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
                <div>
                    <h1 className="text-3xl font-bold font-display">{tProfile('settings.title')}</h1>
                    <p className="text-muted-foreground">{tSettings('subtitle')}</p>
                </div>
                
                 <Card>
                    <CardHeader>
                        <CardTitle>Profil Rasmi</CardTitle>
                        <CardDescription>
                            Profil rasmingizni yangilang.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AvatarUpload user={user} onUploadComplete={refreshAuth} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{tProfile('settings.title')}</CardTitle>
                        <CardDescription>{tSettings('subtitle')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ProfileForm user={user} />
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
