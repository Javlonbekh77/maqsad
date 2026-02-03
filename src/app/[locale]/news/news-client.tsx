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
import PostCard from '@/components/news/post-card'; // Import the new component
import { useToast } from '@/hooks/use-toast';

// Sample data for posts
const samplePosts = [
    {
        author: {
            name: 'Javlonbek Xoldorov',
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500&h=500&fit=crop',
            username: 'javlonbekh',
        },
        content: '🚀 Men yangi maqsad sari qadamni boshladim! "MaqsadM 2.0" loyihasi ustida ishlayapman. Bu talabalar uchun O\'zbekistondagi eng kuchli networking platformasi bo\'ladi!',
        imageUrl: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800&h=450&fit=crop',
        imageHint: 'startup workspace',
        timestamp: '5m ago',
        tags: ['#maqsadm', '#startup', '#networking'],
    },
    {
        author: {
            name: 'Aziza Olimova',
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=500&fit=crop',
            username: 'aziza_dev',
        },
        content: '💡 Men yangi g\'oya o\'rgandim! React\'dagi "Server Components" haqida o\'qib, uning qanchalik kuchli ekanligini angladim. Kelajak loyihalarimda albatta ishlataman.',
        timestamp: '1h ago',
        tags: ['#react', '#webdev', '#learning'],
    },
    {
        author: {
            name: 'Sardor Komilov',
            avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=500&fit=crop',
            username: 'sardor_k',
        },
        content: '🎯 Men maqsaddosh qidiryapman. IELTS imtihoniga tayyorlanayotganlar bo\'lsa, birga shug\'ullansak bo\'lardi. Maqsadim 8.0+',
        imageUrl: 'https://images.unsplash.com/photo-1521790797524-1f44c0ebb37b?w=800&h=450&fit=crop',
        imageHint: 'study group books',
        timestamp: '3h ago',
        tags: ['#ielts', '#goalmates'],
    }
];

export default function NewsClient() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [postContent, setPostContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    const handleTemplateClick = (template: string) => {
        setPostContent(template);
    };

    const handlePost = async () => {
        if (!postContent.trim()) return;

        setIsPosting(true);
        // Simulate a network request
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast({
            title: "Post muvaffaqiyatli qo'shildi!",
            description: "Sizning fikringiz endi lentada.",
        });

        setPostContent('');
        setIsPosting(false);
    };

    if (loading || !user) {
        return (
             <AppLayout>
                <div className="space-y-8">
                    <Card>
                        <CardHeader><Skeleton className="h-24 w-full" /></CardHeader>
                        <CardContent><Skeleton className="h-10 w-full" /></CardContent>
                    </Card>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-8">
                           <Skeleton className="h-64 w-full" />
                           <Skeleton className="h-64 w-full" />
                        </div>
                        <div className="hidden md:block space-y-8">
                            <Skeleton className="h-48 w-full" />
                        </div>
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
                            <Button onClick={handlePost} disabled={!postContent.trim() || isPosting}>
                                {isPosting ? 'Post qilinmoqda...' : 'Post qilish'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Sample Posts */}
                    <div className="space-y-8">
                        {samplePosts.map((post, index) => (
                            <PostCard key={index} {...post} />
                        ))}
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
