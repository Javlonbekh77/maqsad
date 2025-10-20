'use client';
import { Suspense } from 'react';
import GroupDetailClient from './group-detail-client';
import AppLayout from '@/components/layout/app-layout';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

function LoadingFallback() {
    return (
         <AppLayout>
            <div className="space-y-8">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="w-full h-64 rounded-xl" />
                <div className="mt-8 flex items-center justify-between">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-10 w-28" />
                </div>
                 <div className="border-b">
                  <div className="flex h-10 items-center space-x-4">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
                 <Skeleton className="h-48 w-full" />
            </div>
        </AppLayout>
    );
}

export default function GroupDetailPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <GroupDetailClient />
        </Suspense>
    );
}
