'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BrainCircuit, Send, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import type { ChatHistory } from '@/ai/schemas';
import { continueChat } from '@/ai/flows/chat-assistant-flow';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { marked } from 'marked';

export default function AiChatAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<ChatHistory[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [history]);
  
  const handleOpen = () => {
    setIsOpen(true);
    if(history.length === 0) {
        // Add an initial greeting from the model
        setHistory([{ role: 'model', content: "Salom! Men sizning yordamchingizman. Bo'sh vaqtingiz bo'yicha vazifalarni tavsiya qilishim mumkin. Masalan, 'Menda 30 daqiqa bor' deb yozing."}])
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const newHistory: ChatHistory[] = [...history, { role: 'user', content: input }];
    setHistory(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const result = await continueChat({
        userId: user.id,
        history: newHistory,
      });

      setHistory([...newHistory, { role: 'model', content: result.response }]);
    } catch (error) {
      console.error('AI chat error:', error);
      setHistory([
        ...newHistory,
        {
          role: 'model',
          content: 'Kechirasiz, hozir javob bera olmayman. Iltimos, birozdan so‘ng qayta urinib ko‘ring.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
   const parseMarkdown = (text: string) => {
    // Basic markdown for bolding text **text**
    const html = marked.parse(text);
    return { __html: html };
  };

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 flex items-center justify-center"
        onClick={handleOpen}
        aria-label="Open AI Assistant"
      >
        <BrainCircuit className="h-7 w-7" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg p-0">
          <DialogHeader className='p-6 pb-2'>
            <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Yordamchi
            </DialogTitle>
            <DialogDescription>
              Vazifalarni topishda va rejalashtirishda yordam beraman.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[50vh] p-6 pt-0" viewportRef={scrollAreaRef}>
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-start gap-3',
                    entry.role === 'user' && 'justify-end'
                  )}
                >
                  {entry.role === 'model' && (
                    <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                      <AvatarFallback><Sparkles className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'rounded-lg px-3 py-2 max-w-sm prose prose-sm',
                      entry.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                    dangerouslySetInnerHTML={parseMarkdown(entry.content)}
                  />
                  {entry.role === 'user' && user && (
                     <Avatar className="h-8 w-8">
                       <AvatarFallback>{user.firstName?.charAt(0)}</AvatarFallback>
                     </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                    <AvatarFallback><Sparkles className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                  <div className="rounded-lg bg-muted px-3 py-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex w-full items-center gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Savolingizni yozing..."
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
