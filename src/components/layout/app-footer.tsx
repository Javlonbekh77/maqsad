'use client';
import { Link } from '@/navigation';
import Logo from '@/components/logo';
import { Send } from 'lucide-react';

export default function AppFooter() {
    return (
        <footer className="mt-auto w-full bg-black text-white">
            <div className="container mx-auto flex flex-col items-center justify-center text-center gap-4 py-12 px-4">
                <Logo className="mb-2 text-white" />
                <p className="text-sm text-white/70 max-w-md">
                    Maqsadlaringiz sari birgalikda harakat qiluvchi hamjamiyat. Unity Team tomonidan ishtiyoq bilan yaratilgan.
                </p>
                <a href="https://t.me/Javlonbekhs_Blog" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-white hover:underline">
                    <Send className="h-4 w-4" />
                    Murojaat uchun
                </a>
            </div>
             <div className="border-t border-white/20">
                <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center text-xs text-white/60 gap-2 py-4 px-4">
                    <p>© 2026 MaqsadM. Barcha huquqlar himoyalangan.</p>
                    <div className="flex gap-4">
                        <Link href="#" className="hover:underline">Shartlar</Link>
                        <Link href="#" className="hover:underline">Maxfiylik Siyosati</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
