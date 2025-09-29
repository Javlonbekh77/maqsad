
import AppLayout from "@/components/layout/app-layout";
import ProfileForm from "@/components/profile/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserById } from "@/lib/data";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export default async function SettingsPage() {
    const t = await getTranslations('profile');
    const tSettings = await getTranslations('settings');

    // In a real app, this would come from an auth context
    const currentUserId = 'user-1';
    const user = await getUserById(currentUserId);

    if (!user) {
        notFound();
    }

    return (
        <AppLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold font-display">{tSettings('title')}</h1>
                    <p className="text-muted-foreground">{tSettings('subtitle')}</p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('title')}</CardTitle>
                        <CardDescription>{t('subtitle')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ProfileForm user={user} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
