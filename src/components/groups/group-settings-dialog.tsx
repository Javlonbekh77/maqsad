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
import { useToast } from '@/hooks/use-toast';
import type { Group } from '@/lib/types';
import { useTransition, useState, useRef, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Edit } from 'lucide-react';
import { updateGroupImage } from '@/lib/data';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        setImagePreview(null);
        setImageFile(null);
    }
  }, [isOpen]);

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

  async function handleSubmit() {
    if (!imageFile) {
        toast({
            title: 'No Image Selected',
            description: 'Please select a new image to upload.',
            variant: 'destructive',
        });
        return;
    }

    startTransition(async () => {
      try {
        await updateGroupImage(group.id, imageFile);
        toast({
          title: 'Group Updated',
          description: 'The group image has been successfully updated.',
        });
        onGroupUpdated();
        onClose();
      } catch (error) {
        console.error("Failed to update group image:", error);
        toast({
          title: 'Error',
          description: 'Failed to update group image.',
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
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Group Image</label>
                    <div className="flex items-center gap-4">
                    <Avatar className="h-24 w-24 rounded-lg">
                        <AvatarImage src={imagePreview || group.imageUrl} alt={group.name} className="object-cover" />
                        <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        Change Photo
                    </Button>
                    <Input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/png, image/jpeg, image/gif"
                        onChange={handleImageChange}
                    />
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={isPending || !imageFile}>
                    {isPending ? 'Updating...' : 'Save Changes'}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
