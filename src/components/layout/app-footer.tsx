
import { Link } from '@/navigation';
import { Send, Target } from 'lucide-react';
import Logo from '../logo';

export default function AppFooter() {
  return (
    <footer className="bg-background border-t mt-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <Target className="h-6 w-6" />
            <span className="text-xl font-bold font-display">
              MaqsadM
            </span>
          </div>
          <p className="max-w-md mx-auto mt-4 text-sm text-muted-foreground">
            Maqsadlaringiz sari birgalikda harakat qiluvchi hamjamiyat. Unity Team tomonidan ishtiyoq bilan yaratilgan.
          </p>
          <div className="flex flex-col items-center mt-6">
            <a 
              href="https://t.me/Javlonbekhs_Blog"
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              aria-label="Unity Team Telegram"
            >
              <Send className="h-5 w-5" />
              <span>Murojaat uchun</span>
            </a>
          </div>
        </div>

        <hr className="my-6 border-muted" />

        <div className="flex flex-col items-center sm:flex-row sm:justify-between">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} MaqsadM. Barcha huquqlar himoyalangan.</p>
          <div className="flex mt-3 -mx-2 sm:mt-0">
            <Link href="#" className="mx-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              Shartlar
            </Link>
            <Link href="#" className="mx-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              Maxfiylik
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
