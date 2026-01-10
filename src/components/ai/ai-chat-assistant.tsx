'use client';
import { useState, useRef, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Bot, User, CornerDownLeft, Loader2, ArrowUp } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { chatAssistant } from '@/ai/flows/chat-assistant-flow';
import type { ChatInput, ChatOutput } from '@/ai/flows/chat-assistant-flow';
import { useAuth } from '@/context/auth-context';
import { marked } from 'marked';
import { saveChatMessage, getChatHistory } from '@/lib/data';

type ChatMessage = {
  role: 'user' | 'model';
  content: string;
};

const CHAT_LOCAL_STORAGE_KEY = 'maqsadm_chat_history';
const MAX_LOCAL_MESSAGES = 50;
const MAX_FIREBASE_MESSAGES = 10;

export default function AiChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const initialMessage: ChatMessage = {
    role: 'model',
    content: "Salom! Men MaqsadM yordamchisiman. Bugun qanday vazifalarni rejalashtirishimiz mumkin?",
  };
  
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
        setTimeout(() => {
            if (scrollAreaRef.current) {
              scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
            }
        }, 0);
    }
  };


  // Load chat history from local storage and Firebase on sheet open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadChatHistory();
    }
  }, [isOpen, messages.length]);

  const loadChatHistory = async () => {
    setLoadingHistory(true);
    try {
      // 1. Load from local storage
      const localData = localStorage.getItem(CHAT_LOCAL_STORAGE_KEY);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            setLoadingHistory(false);
            scrollToBottom();
            return;
          }
        } catch (e) {
          console.error('Error parsing local chat history', e);
        }
      }

      // 2. Load from Firebase (fallback)
      if (user?.id) {
        const firebaseHistory = await getChatHistory(user.id, MAX_FIREBASE_MESSAGES);
        if (firebaseHistory.length > 0) {
          const converted = firebaseHistory.map(msg => ({
            role: msg.role,
            content: msg.content,
          }));
          setMessages(converted);
          // Save to local storage for next time
          localStorage.setItem(CHAT_LOCAL_STORAGE_KEY, JSON.stringify(converted));
          setLoadingHistory(false);
          scrollToBottom();
          return;
        }
      }

      // 3. Show initial message if no history
      setMessages([initialMessage]);
    } catch (e) {
      console.error('Error loading chat history', e);
      setMessages([initialMessage]);
    } finally {
      setLoadingHistory(false);
      scrollToBottom();
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingHistory]);

  const saveChatMessageToStorage = async (message: ChatMessage) => {
    // 1. Save to local storage
    const updated = [...messages, message];
    const trimmed = updated.slice(-MAX_LOCAL_MESSAGES);
    localStorage.setItem(CHAT_LOCAL_STORAGE_KEY, JSON.stringify(trimmed));

    // 2. Save to Firebase (async, don't block)
    if (user?.id) {
      try {
        // Only save last MAX_FIREBASE_MESSAGES to Firebase
        if (updated.length % 2 === 0) { // Save every 2nd message to Firebase (user + model)
          saveChatMessage(user.id, message).catch(e => 
            console.error('Error saving chat to Firebase', e)
          );
        }
      } catch (e) {
        console.error('Error saving to Firebase', e);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    await saveChatMessageToStorage(userMessage);

    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }));

      const response = await chatAssistant({
        history: chatHistory,
        message: currentInput,
        userId: user?.id,
      });

      const modelMessage: ChatMessage = { role: 'model', content: response.reply };
      setMessages(prev => [...prev, modelMessage]);
      await saveChatMessageToStorage(modelMessage);

    } catch (error) {
      console.error("AI chat error:", error);
      const errorMessage: ChatMessage = {
        role: 'model',
        content: "Kechirasiz, hozirda javob bera olmayman. Iltimos, keyinroq qayta urinib ko'ring.",
      };
      setMessages(prev => [...prev, errorMessage]);
      await saveChatMessageToStorage(errorMessage);
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
        className="fixed bottom-20 sm:bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50"
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
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
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
                  </>
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
