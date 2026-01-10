'use client';
import { Link } from '@/navigation';
import Logo from '@/components/logo';
import { Send } from 'lucide-react';

export default function AppFooter() {
    return (
        <footer className="mt-auto border-t bg-background/50">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4 py-8 sm:px-6 lg:px-8">
                <div>
                    <Logo className="mb-4" />
                    <p className="text-sm text-muted-foreground max-w-xs">
                        Birgalikda ko'proqqa erishing. Maqsadlaringizni aniqlang, kuchlarni birlashtiring va o'sing.
                    </p>
                </div>
                <div className="space-y-4">
                     <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Havolalar</h3>
                     <ul className="space-y-2 text-sm">
                        <li><Link href="/dashboard" className="text-muted-foreground hover:text-primary">Boshqaruv paneli</Link></li>
                        <li><Link href="/groups" className="text-muted-foreground hover:text-primary">Guruhlar</Link></li>
                        <li><Link href="/leaderboard" className="text-muted-foreground hover:text-primary">Peshqadamlar</Link></li>
                     </ul>
                </div>
                <div className="space-y-4">
                     <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Unity Team</h3>
                     <p className="text-sm text-muted-foreground">
                        Ilovamizni qo'llab-quvvatlayotgan hamkorimiz.
                     </p>
                     <a href="https://t.me/Javlonbekhs_Blog" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                        <Send className="h-4 w-4" />
                        Telegram kanaliga o'tish
                     </a>
                </div>
            </div>
             <div className="border-t border-border/50 py-4">
                <p className="text-center text-xs text-muted-foreground">
                    © 2024 MaqsadM. Barcha huquqlar himoyalangan.
                </p>
            </div>
        </footer>
    );
}
