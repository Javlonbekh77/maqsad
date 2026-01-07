'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { createGroup } from '@/lib/data';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';

const groupImages = PlaceHolderImages.filter(p => p.id.startsWith('group'));

const groupSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  imageUrl: z.string().min(1, { message: "Please select an image for the group." }),
});

interface CreateGroupDialogProps {
    onGroupCreated: () => void;
}

export default function CreateGroupDialog({ onGroupCreated }: CreateGroupDialogProps) {
  const t = useTranslations('groups');
  const tActions = useTranslations('actions');
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof groupSchema>>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
    },
  });

  const onSubmit = (values: z.infer<typeof groupSchema>) => {
    if (!user) return;
    
    startTransition(async () => {
      try {
        const selectedImage = groupImages.find(img => img.imageUrl === values.imageUrl);
        if (!selectedImage) {
            throw new Error("Selected image not found.");
        }

        const groupData = { 
            name: values.name, 
            description: values.description, 
            imageUrl: selectedImage.imageUrl,
            imageHint: selectedImage.imageHint,
            adminId: user.id 
        };

        await createGroup(groupData, user.id);
        toast({
            title: "Group Created!",
            description: "Your new group is ready. Invite others to join!",
        });
        onGroupCreated();
        setOpen(false);
        form.reset();
      } catch (error) {
        console.error("Failed to create group", error);
        toast({
            title: "Error",
            description: "Failed to create the group. Please try again.",
            variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('createGroup')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('createGroup')}</DialogTitle>
          <DialogDescription>
            Create a new space for your team to collaborate and achieve goals.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-72 pr-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Choose Group Image</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-2 gap-4"
                        >
                          {groupImages.map(image => (
                              <FormItem key={image.id} className="flex items-center justify-center">
                                <FormControl>
                                  <RadioGroupItem value={image.imageUrl} id={image.id} className="sr-only" />
                                </FormControl>
                                <Label
                                  htmlFor={image.id}
                                  className={cn(
                                    "cursor-pointer rounded-lg overflow-hidden w-full h-32 border-4 border-transparent transition-all relative",
                                    field.value === image.imageUrl && "ring-4 ring-primary ring-offset-2 border-primary"
                                  )}
                                >
                                  <Image
                                    src={image.imageUrl}
                                    alt={image.description}
                                    fill
                                    className="object-cover"
                                  />
                                   <div className="absolute inset-0 bg-black/30 flex items-end p-2">
                                    <p className="text-white text-sm font-semibold">{image.imageHint}</p>
                                   </div>
                                </Label>
                              </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Name</FormLabel>
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="What is this group about?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">{tActions('cancel')}</Button>
                </DialogClose>
                <Button type="submit" disabled={isPending}>
                    {isPending ? "Creating..." : t('createGroup')}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
