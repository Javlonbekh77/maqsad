
'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Bot, User, CornerDownLeft, Loader2, ArrowUp } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { type ChatMessage, chatAssistant, type ChatHistory } from '@/ai/flows/chat-assistant-flow';
import { useAuth } from '@/context/auth-context';
import { marked } from 'marked';

export default function AiChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const initialMessage: ChatMessage = {
    role: 'model',
    content: "Salom! Men MaqsadM yordamchisiman. Bugun qanday vazifalarni rejalashtirishimiz mumkin?",
  };

  useEffect(() => {
    if (isOpen) {
      setMessages([initialMessage]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chatHistory: ChatHistory = messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }));

      const response = await chatAssistant({
        history: chatHistory,
        message: input,
      });

      const modelMessage: ChatMessage = { role: 'model', content: response.reply };
      setMessages(prev => [...prev, modelMessage]);

    } catch (error) {
      console.error("AI chat error:", error);
      const errorMessage: ChatMessage = {
        role: 'model',
        content: "Kechirasiz, hozirda javob bera olmayman. Iltimos, keyinroq qayta urinib ko'ring.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const parseMarkdown = (text: string) => {
    const html = marked.parse(text, { breaks: true, gfm: true });
    return { __html: html };
  };

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50"
        onClick={() => setIsOpen(true)}
      >
        <Bot className="h-8 w-8" />
      </Button>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:w-[540px] flex flex-col p-0">
          <SheetHeader className="p-6 border-b">
            <SheetTitle className="flex items-center gap-2"><Bot /> AI Yordamchi</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1" viewportRef={scrollAreaRef}>
             <div className="p-6 space-y-6">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'model' && (
                        <Avatar className="w-8 h-8 border">
                            <AvatarFallback><Bot size={20} /></AvatarFallback>
                        </Avatar>
                    )}
                    <div className={`rounded-lg p-3 max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={parseMarkdown(msg.content)} />
                    </div>
                    {msg.role === 'user' && (
                        <Avatar className="w-8 h-8 border">
                             <AvatarFallback>{user?.firstName?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                    )}
                    </div>
                ))}
                {isLoading && (
                     <div className="flex items-start gap-4">
                        <Avatar className="w-8 h-8 border">
                             <AvatarFallback><Bot size={20} /></AvatarFallback>
                        </Avatar>
                        <div className="rounded-lg p-3 bg-muted flex items-center">
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                    </div>
                )}
            </div>
          </ScrollArea>
          <div className="p-4 border-t bg-background">
            <div className="relative">
              <Textarea
                placeholder="Savolingizni yozing..."
                className="pr-16 min-h-[60px]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <Button
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
