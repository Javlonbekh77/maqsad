"use client";

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import type { ChatMessage, User } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '../ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { updateChatMessage, deleteChatMessage } from '@/lib/data';


interface GroupChatProps {
  groupId: string;
  members: User[];
}

export default function GroupChat({ groupId, members }: GroupChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const messagesQuery = query(collection(db, `groups/${groupId}/messages`), orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
      const msgs: ChatMessage[] = [];
      querySnapshot.forEach(doc => {
        msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching messages: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    await addDoc(collection(db, `groups/${groupId}/messages`), {
      text: newMessage,
      senderId: user.id,
      createdAt: serverTimestamp(),
      user: {
        name: user.fullName,
        avatarUrl: user.avatarUrl,
      },
      isEdited: false,
    });

    setNewMessage('');
  };
  
  const handleEdit = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setEditingText(message.text);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editingText.trim()) return;

    try {
      await updateChatMessage(groupId, editingMessageId, editingText);
      toast({ title: "Xabar tahrirlandi" });
      handleCancelEdit();
    } catch (error) {
      console.error("Error updating message: ", error);
      toast({ title: "Xatolik", description: "Xabarni tahrirlashda xatolik yuz berdi.", variant: "destructive" });
    }
  };

  const openDeleteDialog = (messageId: string) => {
    setDeletingMessageId(messageId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteMessage = async () => {
    if (!deletingMessageId) return;

    try {
      await deleteChatMessage(groupId, deletingMessageId);
      toast({ title: "Xabar o'chirildi" });
    } catch (error) {
      console.error("Error deleting message: ", error);
      toast({ title: "Xatolik", description: "Xabarni o'chirishda xatolik yuz berdi.", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingMessageId(null);
    }
  };


  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
    <div className="flex flex-col h-[70vh]">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-6">
            {messages.map(msg => {
                const isSender = msg.senderId === user?.id;
                const sentAt = msg.createdAt ? (msg.createdAt as any).toDate() : new Date();

                return (
                <div key={msg.id} className={`flex items-end gap-3 group ${isSender ? 'justify-end' : 'justify-start'}`}>
                    {!isSender && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={msg.user?.avatarUrl} />
                        <AvatarFallback>{msg.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    )}
                    <div className={`flex items-end gap-2 ${isSender ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`max-w-xs md:max-w-md p-3 rounded-xl ${isSender ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          {editingMessageId === msg.id ? (
                            <div className='space-y-2'>
                              <Textarea 
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className='bg-background text-foreground'
                              />
                              <div className='flex justify-end gap-2'>
                                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>Bekor qilish</Button>
                                <Button size="sm" onClick={handleSaveEdit}>Saqlash</Button>
                              </div>
                            </div>
                          ) : (
                            <>
                            {!isSender && <p className="text-xs font-bold mb-1">{msg.user?.name}</p>}
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            <div className={`text-xs mt-2 flex items-center gap-1 ${isSender ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>
                              <span>{formatDistanceToNow(sentAt, { addSuffix: true })}</span>
                              {msg.isEdited && <span className='text-xs'>(tahrirlandi)</span>}
                            </div>
                            </>
                          )}
                      </div>
                      {isSender && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleEdit(msg)}>
                              <Edit className="mr-2 h-4 w-4" /> Tahrirlash
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDeleteDialog(msg.id)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> O'chirish
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                     {isSender && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatarUrl} />
                        <AvatarFallback>{user?.firstName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    )}
                </div>
                );
            })}
            </div>
        </ScrollArea>
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
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
