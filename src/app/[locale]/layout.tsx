import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { PT_Sans as PTSans } from 'next/font/google';
import { AuthProvider } from '@/context/auth-context';

import '../globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { ThemeProvider } from "@/context/theme-provider";

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

export default async function RootLayout({
  children,
  params: {locale}
}: Readonly<RootLayoutProps>) {
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
       <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
