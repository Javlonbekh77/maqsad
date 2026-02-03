'use client';

import { useState, useEffect } from 'react';
import AppLayout from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "@/navigation";
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Rocket, Users } from 'lucide-react';

export default function NewsClient() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [postContent, setPostContent] = useState('');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    const handleTemplateClick = (template: string) => {
        setPostContent(template);
    };

    if (loading || !user) {
        return (
             <AppLayout>
                <div className="space-y-8">
                    <Card>
                        <CardHeader><Skeleton className="h-24 w-full" /></CardHeader>
                        <CardContent><Skeleton className="h-10 w-full" /></CardContent>
                    </Card>
                    <div className="text-center py-16">
                        <Skeleton className="h-32 w-full" />
                    </div>
                </div>
            </AppLayout>
        );
    }
    
    return (
        <AppLayout>
            <div className="grid md:grid-cols-3 gap-8 items-start">
                <div className="md:col-span-2 space-y-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Avatar>
                                <AvatarImage src={user.avatarUrl} />
                                <AvatarFallback>{user.firstName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className='flex-1'>
                                <Textarea
                                    placeholder={`${user.firstName}, nimalar bilan bandsiz?`}
                                    value={postContent}
                                    onChange={(e) => setPostContent(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleTemplateClick("🚀 Men yangi maqsad sari qadamni boshladim!")}>
                                    <Rocket className="h-4 w-4 mr-2" /> Yangi maqsad
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleTemplateClick("🎯 Men maqsaddosh qidiryapman.")}>
                                     <Users className="h-4 w-4 mr-2" /> Maqsaddosh
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleTemplateClick("💡 Men yangi g'oya o'rgandim!")}>
                                     <Brain className="h-4 w-4 mr-2" /> Yangi g'oya
                                </Button>
                            </div>
                            <Button disabled={!postContent.trim()}>
                                Post qilish
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <h3 className="text-xl font-semibold text-muted-foreground">Yangiliklar Lentasi</h3>
                        <p className="text-sm text-muted-foreground mt-2">Bu bo'lim tez kunda ishga tushadi!</p>
                    </div>
                </div>
                <div className="hidden md:block space-y-8">
                    {/* Placeholder for suggestions or other widgets */}
                     <Card>
                        <CardHeader>
                            <h3 className="font-semibold">Tavsiyalar</h3>
                        </CardHeader>
                        <CardContent>
                             <p className="text-sm text-muted-foreground">Tavsiya etilgan guruhlar va foydalanuvchilar shu yerda ko'rinadi.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
