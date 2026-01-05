'use client';
import { useState, useRef, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Bot, User, CornerDownLeft, Loader2, ArrowUp, MoreHorizontal, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { chatAssistant } from '@/ai/flows/chat-assistant-flow';
import type { ChatInput, ChatOutput } from '@/ai/flows/chat-assistant-flow';
import { useAuth } from '@/context/auth-context';
import { marked } from 'marked';
import { saveChatMessage, getChatHistory, deleteChatMessage } from '@/lib/data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { getInitials, getAvatarColor } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


type ChatMessage = {
  id?: string;
  role: 'user' | 'model';
  content: string;
};

const CHAT_LOCAL_STORAGE_KEY = 'maqsadm_chat_history';
const MAX_LOCAL_MESSAGES = 50;

export default function AiChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { toast } = useToast();
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);


  const initialMessage: ChatMessage = {
    role: 'model',
    content: "Salom! Men MaqsadM yordamchisiman. Bugun qanday vazifalarni rejalashtirishimiz mumkin?",
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
            return;
          }
        } catch (e) {
          console.error('Error parsing local chat history', e);
        }
      }

      // 2. Load from Firebase (fallback)
      if (user?.id) {
        const firebaseHistory = await getChatHistory(user.id);
        if (firebaseHistory.length > 0) {
          const converted = firebaseHistory.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
          }));
          setMessages(converted);
          localStorage.setItem(CHAT_LOCAL_STORAGE_KEY, JSON.stringify(converted));
          setLoadingHistory(false);
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
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

 const saveAndSetMessages = (newMessages: ChatMessage[]) => {
    const trimmed = newMessages.slice(-MAX_LOCAL_MESSAGES);
    setMessages(trimmed);
    localStorage.setItem(CHAT_LOCAL_STORAGE_KEY, JSON.stringify(trimmed));
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !user) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    const tempModelMessage: ChatMessage = { role: 'model', content: '...' };
    
    // Optimistically update UI
    const newMessages = [...messages, userMessage, tempModelMessage];
    saveAndSetMessages(newMessages);

    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Save user message and get its ID
      const savedUserMsg = await saveChatMessage(user.id, userMessage);
      
      const chatHistory = newMessages.slice(0, -2).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }));

      const response = await chatAssistant({
        history: chatHistory,
        message: currentInput,
        userId: user?.id,
      });

      const modelMessage: ChatMessage = { role: 'model', content: response.reply };
      const savedModelMsg = await saveChatMessage(user.id, modelMessage);

      // Final update with real data
      saveAndSetMessages([...messages, { ...savedUserMsg, id: savedUserMsg.id }, { ...savedModelMsg, id: savedModelMsg.id }]);

    } catch (error) {
      console.error("AI chat error:", error);
      const errorMessage: ChatMessage = {
        role: 'model',
        content: "Kechirasiz, hozirda javob bera olmayman. Iltimos, keyinroq qayta urinib ko'ring.",
      };
      saveAndSetMessages([...messages, userMessage, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteDialog = (messageId: string) => {
    setDeletingMessageId(messageId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteMessage = async () => {
    if (!deletingMessageId || !user) return;

    try {
      await deleteChatMessage(user.id, deletingMessageId);
      saveAndSetMessages(messages.filter(m => m.id !== deletingMessageId));
      toast({ title: "Xabar o'chirildi" });
    } catch (error) {
      console.error("Error deleting message: ", error);
      toast({ title: "Xatolik", description: "Xabarni o'chirishda xatolik yuz berdi.", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingMessageId(null);
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
                        <div key={msg.id || `msg-${index}`} className={`flex items-start gap-2 group ${msg.role === 'user' ? 'justify-end' : ''}`}>
                          {msg.role === 'user' && msg.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity self-center">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => openDeleteDialog(msg.id!)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                  <Trash2 className="mr-2 h-4 w-4" /> O'chirish
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                           {msg.role === 'model' && (
                            <Avatar className="w-8 h-8 border">
                                <AvatarFallback><Bot size={20} /></AvatarFallback>
                            </Avatar>
                           )}
                           <div className={`rounded-lg p-3 max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                              {msg.content === '...' && isLoading ? 
                                <Loader2 className="h-5 w-5 animate-spin" /> : 
                                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={parseMarkdown(msg.content)} />
                              }
                           </div>
                           {msg.role === 'user' && (
                              <Avatar className="w-8 h-8 border" style={{ backgroundColor: getAvatarColor(user?.id || '') }}>
                                  <AvatarFallback>{getInitials(user?.fullName || 'U')}</AvatarFallback>
                              </Avatar>
                           )}
                           {msg.role === 'model' && msg.id && (
                             <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity self-center">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => openDeleteDialog(msg.id!)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                  <Trash2 className="mr-2 h-4 w-4" /> O'chirish
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                           )}
                        </div>
                    ))}
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
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Haqiqatan ham o'chirmoqchimisiz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu amalni ortga qaytarib bo'lmaydi. Xabar butunlay o'chiriladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingMessageId(null)}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMessage} className="bg-destructive hover:bg-destructive/90">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
