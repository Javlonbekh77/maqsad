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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Task } from '@/lib/types';
import { Coins } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ScrollArea } from '../ui/scroll-area';

interface JoinGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedTaskIds: string[]) => void;
  groupName: string;
  tasks: Task[];
}

export default function JoinGroupDialog({
  isOpen,
  onClose,
  onConfirm,
  groupName,
  tasks,
}: JoinGroupDialogProps) {
  const t = useTranslations('actions');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const handleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedTaskIds);
    setSelectedTaskIds([]); // Reset for next time
    onClose(); // Close the dialog on confirmation
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join &quot;{groupName}&quot;</DialogTitle>
          <DialogDescription>
            Select the tasks you want to commit to. You can always change this later.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-72">
            <div className="space-y-4 p-1">
            {tasks.length > 0 ? tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-4 rounded-lg border p-4">
                    <Checkbox
                        id={`task-${task.id}`}
                        checked={selectedTaskIds.includes(task.id)}
                        onCheckedChange={() => handleTaskSelection(task.id)}
                        className="mt-1"
                    />
                    <div className="grid gap-1.5 leading-none">
                        <Label
                        htmlFor={`task-${task.id}`}
                        className="text-base font-medium flex items-center justify-between w-full"
                        >
                        <span>{task.title}</span>
                         <div className="flex items-center justify-end gap-1 font-semibold text-amber-500 text-sm">
                             <Coins className="w-4 h-4" />
                             <span>{task.coins}</span>
                          </div>
                        </Label>
                        <p className="text-sm text-muted-foreground">
                        {task.description}
                        </p>
                    </div>
                </div>
            )) : (
              <p className="text-muted-foreground text-center py-4">This group has no tasks yet.</p>
            )}
            </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button onClick={handleConfirm}>
            Join Group & Start Tasks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
