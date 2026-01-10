'use client';
import { Link } from '@/navigation';
import Logo from '@/components/logo';
import { Send } from 'lucide-react';

export default function AppFooter() {
    return (
        <footer className="mt-auto w-full py-12">
            <div className="container mx-auto flex flex-col items-center justify-center text-center gap-4">
                <Logo className="mb-2" />
                <p className="text-sm text-muted-foreground max-w-md">
                    Maqsadlaringiz sari birgalikda harakat qiluvchi hamjamiyat. Unity Team tomonidan ishtiyoq bilan yaratilgan.
                </p>
                <a href="https://t.me/Javlonbekhs_Blog" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                    <Send className="h-4 w-4" />
                    Murojaat uchun
                </a>
            </div>
             <div className="border-t border-border/50 py-4 mt-8">
                <div className="container mx-auto flex justify-between items-center text-xs text-muted-foreground">
                    <p>© 2024 MaqsadM. Barcha huquqlar himoyalangan.</p>
                    <Link href="#" className="hover:underline">Shartlar</Link>
                </div>
            </div>
        </footer>
    );
}
