import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { PT_Sans as PTSans, Playfair_Display as PlayfairDisplay } from 'next/font/google';
import { AuthProvider } from '@/context/auth-context';
import { TimerProvider } from '@/context/timer-context';

import '../globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { ThemeProvider } from "@/context/theme-provider";

const fontSans = PTSans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-sans',
});

const fontDisplay = PlayfairDisplay({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: "MaqsadM",
  description: "Achieve your goals together.",
};

interface RootLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

function Snowfall() {
    // Array to generate 200 snowflakes
    const snowflakes = Array.from({ length: 200 });
    return (
      <div className="snowfall">
        {snowflakes.map((_, i) => (
          <div key={i} className="snowflake"></div>
        ))}
      </div>
    );
}

export default async function RootLayout({
  children,
  params: {locale}
}: Readonly<RootLayoutProps>) {
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
       <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable, fontDisplay.variable)}>
        <NextIntlClientProvider locale={locale} messages={messages}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <AuthProvider>
                <TimerProvider>
                  <Snowfall />
                  <div className="relative z-10">
                    {children}
                  </div>
                  <Toaster />
                </TimerProvider>
              </AuthProvider>
            </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
