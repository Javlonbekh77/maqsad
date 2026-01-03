'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, BrainCircuit } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { continueTaskChat } from '@/ai/flows/create-task-chat-flow';
import { useRouter } from '@/navigation';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

const initialMessage: ChatMessage = {
  role: 'model',
  content: "Salom! Men sizning shaxsiy AI yordamchingizman. Qanday yangi odat yoki vazifa yaratishni xohlaysiz? Masalan: 'Har kuni 30 daqiqa kitob o'qish' yoki 'Haftada 3 marta mashq qilish'.",
};

export default function CreateTaskChat() {
  const { user, loading: userLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const chatHistory = [...messages, userMessage];
      const result = await continueTaskChat({ userId: user.id, history: chatHistory });
      
      const modelMessage: ChatMessage = { role: 'model', content: result.response };
      setMessages(prev => [...prev, modelMessage]);

      if (result.isTaskCreated) {
        toast({
            title: "Vazifa Muvaffaqiyatli Yaratildi!",
            description: "Yangi odatingiz profilingizga qo'shildi.",
        });
        // Redirect to profile to see the new task in the habit tracker
        router.push(`/profile/${user.id}`);
      }

    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage: ChatMessage = { role: 'model', content: 'Kechirasiz, hozir javob bera olmayman. Iltimos, birozdan so\'ng urinib ko\'ring.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return <Skeleton className="h-96 w-full" />
  }

  if (!user) {
    // This should be handled by the page's main logic, but as a fallback
    router.push('/login');
    return null;
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-0">
        <div className="flex flex-col h-[70vh]">
          <ScrollArea className="flex-1 p-6" viewportRef={scrollAreaRef}>
            <div className="space-y-6">
              {messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'model' && (
                    <Avatar className="w-8 h-8 border-2 border-primary/50">
                      <AvatarFallback>
                        <BrainCircuit className="h-4 w-4"/>
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`rounded-lg px-4 py-2 max-w-[80%] whitespace-pre-wrap ${msg.role === 'model' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                    {msg.content}
                  </div>
                   {msg.role === 'user' && (
                     <Avatar className="w-8 h-8">
                       <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                       <AvatarFallback>{user.firstName?.charAt(0)}</AvatarFallback>
                     </Avatar>
                   )}
                </div>
              ))}
              {loading && (
                 <div className="flex items-start gap-4">
                    <Avatar className="w-8 h-8 border-2 border-primary/50">
                      <AvatarFallback>
                        <BrainCircuit className="h-4 w-4 animate-pulse"/>
                      </AvatarFallback>
                    </Avatar>
                     <div className="rounded-lg px-4 py-2 bg-muted">
                        <Skeleton className="h-4 w-16" />
                     </div>
                 </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-4 border-t bg-background">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Xabar yozing..."
                autoComplete="off"
                disabled={loading}
              />
              <Button type="submit" size="icon" disabled={!input.trim() || loading}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
