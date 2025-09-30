import type { Metadata } from "next";
import { NextIntlClientProvider, useMessages } from 'next-intl';
import { PT_Sans as PTSans } from 'next/font/google';
import { AuthProvider } from '@/context/auth-context';

import '../globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

const fontSans = PTSans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: "MaqsadM",
  description: "Achieve your goals together.",
};

interface RootLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default function RootLayout({
  children,
  params: {locale}
}: Readonly<RootLayoutProps>) {
  const messages = useMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
       <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
