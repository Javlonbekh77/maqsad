'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Group } from '@/lib/types';
import { useTransition, useEffect, useState } from 'react';
import { updateGroupDetails, deleteGroup } from '@/lib/data';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Separator } from '../ui/separator';
import { Trash2 } from 'lucide-react';
import { useRouter } from '@/navigation';

const groupSettingsSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
});

type GroupSettingsFormValues = z.infer<typeof groupSettingsSchema>;

interface GroupSettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    group: Group;
    onGroupUpdated: () => void;
}

export default function GroupSettingsDialog({ isOpen, onClose, group, onGroupUpdated }: GroupSettingsDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const form = useForm<GroupSettingsFormValues>({
    resolver: zodResolver(groupSettingsSchema),
    defaultValues: {
      name: group.name,
      description: group.description,
    },
  });
  
  useEffect(() => {
    if (isOpen) {
        form.reset({
            name: group.name,
            description: group.description,
        });
    }
  }, [isOpen, group, form]);


  async function onSubmit(data: GroupSettingsFormValues) {
    startTransition(async () => {
      try {
        await updateGroupDetails(group.id, {
          name: data.name,
          description: data.description,
        });
        toast({
          title: 'Group Updated',
          description: 'The group details have been successfully updated.',
        });
        onGroupUpdated();
        onClose();
      } catch (error) {
        console.error("Failed to update group:", error);
        toast({
          title: 'Error',
          description: 'Failed to update group details.',
          variant: 'destructive',
        });
      }
    });
  }

  const handleDeleteGroup = async () => {
    startDeleteTransition(async () => {
      try {
        await deleteGroup(group.id);
        toast({
          title: "Guruh O'chirildi",
          description: `"${group.name}" guruhi muvaffaqiyatli o'chirildi.`
        });
        router.push('/groups');
      } catch (error) {
        console.error("Failed to delete group:", error);
        toast({
          title: "Xatolik",
          description: "Guruhni o'chirishda xatolik yuz berdi.",
          variant: "destructive",
        });
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Guruh Sozlamalari: {group.name}</DialogTitle>
            <DialogDescription>
                Guruh nomini va tavsifini yangilang.
            </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                   <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guruh Nomi</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Morning Runners" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tavsif</FormLabel>
                        <FormControl>
                          <Textarea placeholder="What is this group about?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                      <Button variant="outline" onClick={onClose} type="button">Bekor qilish</Button>
                      <Button type="submit" disabled={isPending || !form.formState.isDirty}>
                          {isPending ? 'Yangilanmoqda...' : "O'zgarishlarni Saqlash"}
                      </Button>
                  </DialogFooter>
              </form>
            </Form>

            <Separator className="my-6" />

            <div className="space-y-2">
                <h3 className="font-semibold text-destructive">Xavfli Hudud</h3>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Guruhni O'chirish
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Haqiqatan ham o'chirmoqchimisiz?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bu amalni ortga qaytarib bo'lmaydi. Bu guruh, uning barcha vazifalari va a'zolari bilan bog'liq ma'lumotlar butunlay o'chiriladi.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteGroup} disabled={isDeleting} className="bg-destructive hover:bg-destructive/80">
                        {isDeleting ? "O'chirilmoqda..." : "Ha, o'chirish"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
        </DialogContent>
    </Dialog>
  );
}