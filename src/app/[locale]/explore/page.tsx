'use client';
import { Suspense } from 'react';
import ExploreClient from './explore-client';
import AppLayout from '@/components/layout/app-layout';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

function LoadingFallback() {
    return (
         <AppLayout>
            <div className="space-y-8">
                <Skeleton className="h-20 w-full" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-40 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}

export default function ExplorePage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <ExploreClient />
        </Suspense>
    );
}
