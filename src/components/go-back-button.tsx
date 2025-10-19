'use client';

import { useRouter } from '@/navigation';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function GoBackButton() {
  const router = useRouter();
  const t = useTranslations('actions');

  return (
    <Button variant="ghost" onClick={() => router.back()} className="pl-0">
      <ArrowLeft className="mr-2 h-4 w-4" />
      {t('goBack')}
    </Button>
  );
}
