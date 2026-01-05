'use client';
import { Suspense, useEffect } from 'react';
import DashboardClient from "./dashboard-client";
import AppLayout from '@/components/layout/app-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { useRouter } from '@/navigation';

function LoadingFallback() {
    return (
      <AppLayout>
        <div className="grid gap-8">
          <div className="rounded-lg bg-background/50 backdrop-blur-sm p-6 border">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </div>
           <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          <div className="grid lg:grid-cols-3 gap-8 items-start">
             <div className="lg:col-span-2 space-y-8">
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="space-y-8">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
}

export default function DashboardPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // This page now only handles authentication checks and renders the client.
  // All data fetching logic is moved into DashboardClient.
  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/login');
    }
  }, [authLoading, authUser, router]);
  
  if (authLoading || !authUser) {
    return <LoadingFallback />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <DashboardClient />
    </Suspense>
  );
}
