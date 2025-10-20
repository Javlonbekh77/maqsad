"use client";

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import type { ChatMessage, User } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '../ui/skeleton';

interface GroupChatProps {
  groupId: string;
  members: User[];
}

export default function GroupChat({ groupId, members }: GroupChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
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
      }
    });

    setNewMessage('');
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
    <div className="flex flex-col h-[70vh]">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-6">
            {messages.map(msg => {
                const isSender = msg.senderId === user?.id;
                const sentAt = msg.createdAt ? (msg.createdAt as any).toDate() : new Date();

                return (
                <div key={msg.id} className={`flex items-end gap-3 ${isSender ? 'justify-end' : 'justify-start'}`}>
                    {!isSender && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={msg.user?.avatarUrl} />
                        <AvatarFallback>{msg.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    )}
                    <div className={`max-w-xs md:max-w-md p-3 rounded-xl ${isSender ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {!isSender && <p className="text-xs font-bold mb-1">{msg.user?.name}</p>}
                        <p>{msg.text}</p>
                        <p className={`text-xs mt-2 ${isSender ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>
                           {formatDistanceToNow(sentAt, { addSuffix: true })}
                        </p>
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
  );
}