'use client';
import { Suspense } from 'react';
import NewsClient from './news-client';
import AppLayout from '@/components/layout/app-layout';
import { Skeleton } from '@/components/ui/skeleton';

function LoadingFallback() {
    return (
         <AppLayout>
            <div className="space-y-8">
                <Skeleton className="h-48 w-full" />
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        <Skeleton className="h-96 w-full" />
                        <Skeleton className="h-96 w-full" />
                    </div>
                    <div className="space-y-8">
                        <Skeleton className="h-64 w-full" />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

export default function NewsPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <NewsClient />
        </Suspense>
    );
}
