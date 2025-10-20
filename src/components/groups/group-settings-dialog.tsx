'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Group } from '@/lib/types';
import { useTransition, useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Edit } from 'lucide-react';
import { updateGroupDetails } from '@/lib/data';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';

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
  const [isPending, startTransition] = useTransition();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<GroupSettingsFormValues>({
    resolver: zodResolver(groupSettingsSchema),
    defaultValues: {
      name: group.name,
      description: group.description,
    },
  });
  
  useEffect(() => {
    if (isOpen) {
        // Reset form and state when dialog opens
        form.reset({
            name: group.name,
            description: group.description,
        });
        setImagePreview(null);
        setImageFile(null);
    }
  }, [isOpen, group, form]);


  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setImageFile(file);
    }
  };

  async function onSubmit(data: GroupSettingsFormValues) {
    startTransition(async () => {
      try {
        await updateGroupDetails(group.id, {
          name: data.name,
          description: data.description,
          imageFile: imageFile,
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Group Settings: {group.name}</DialogTitle>
            <DialogDescription>
                Update your group's details here.
            </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <div className="space-y-2">
                      <FormLabel>Group Image</FormLabel>
                      <div className="flex items-center gap-4">
                      <Avatar className="h-24 w-24 rounded-lg">
                          <AvatarImage src={imagePreview || group.imageUrl} alt={group.name} className="object-cover" />
                          <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('image-input')?.click()}
                      >
                          <Edit className="mr-2 h-4 w-4" />
                          Change Photo
                      </Button>
                      <Input
                          id="image-input"
                          type="file"
                          className="hidden"
                          accept="image/png, image/jpeg, image/gif"
                          onChange={handleImageChange}
                      />
                      </div>
                  </div>
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
                  <DialogFooter>
                      <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
                      <Button type="submit" disabled={isPending || (!form.formState.isDirty && !imageFile)}>
                          {isPending ? 'Updating...' : 'Save Changes'}
                      </Button>
                  </DialogFooter>
              </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
