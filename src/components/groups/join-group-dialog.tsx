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
import type { Task, DayOfWeek, UserTaskSchedule } from '@/lib/types';
import { Coins } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ScrollArea } from '../ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from '../ui/badge';

interface JoinGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (schedules: UserTaskSchedule[]) => void;
  groupName: string;
  tasks: Task[];
}

const daysOfWeek: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayAbbreviations = {
    'Sunday': 'S',
    'Monday': 'M',
    'Tuesday': 'T',
    'Wednesday': 'W',
    'Thursday': 'T',
    'Friday': 'F',
    'Saturday': 'S'
};

export default function JoinGroupDialog({
  isOpen,
  onClose,
  onConfirm,
  groupName,
  tasks,
}: JoinGroupDialogProps) {
  const t = useTranslations('actions');
  const [schedules, setSchedules] = useState<Record<string, DayOfWeek[]>>({});

  const handleDaySelection = (taskId: string, newDays: DayOfWeek[]) => {
    setSchedules(prev => {
      const updated = { ...prev };
      if (newDays.length > 0) {
        updated[taskId] = newDays;
      } else {
        delete updated[taskId];
      }
      return updated;
    });
  };
  
  const isTaskSelected = (taskId: string) => schedules.hasOwnProperty(taskId);

  const handleConfirm = () => {
    const finalSchedules: UserTaskSchedule[] = Object.entries(schedules).map(([taskId, days]) => ({
      taskId,
      days,
    }));
    onConfirm(finalSchedules);
    setSchedules({}); // Reset for next time
  };
  
  const tasksToShow = useMemo(() => {
    // Show selected tasks first, then unselected
    return [...tasks].sort((a, b) => {
        const aSelected = isTaskSelected(a.id);
        const bSelected = isTaskSelected(b.id);
        if (aSelected === bSelected) return 0;
        return aSelected ? -1 : 1;
    });
  }, [tasks, schedules]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Join &quot;{groupName}&quot;</DialogTitle>
          <DialogDescription>
            Select tasks and schedule the days you plan to work on them.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-1">
            {tasks.length > 0 ? tasksToShow.map((task) => {
              const selectedDays = schedules[task.id] || [];
              const isSelected = selectedDays.length > 0;
              return (
                <div key={task.id} className="flex items-start gap-4 rounded-lg border p-4 transition-colors data-[selected=true]:bg-muted/50" data-selected={isSelected}>
                    <div className="grid gap-2.5 leading-none flex-1">
                        <div className="flex items-start justify-between">
                            <Label
                            htmlFor={`task-${task.id}`}
                            className="text-base font-medium flex items-center gap-3 cursor-pointer"
                            >
                                <Checkbox
                                    id={`task-${task.id}`}
                                    checked={isTaskSelected(task.id)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            handleDaySelection(task.id, daysOfWeek); // Select all days by default
                                        } else {
                                            handleDaySelection(task.id, []); // Deselect
                                        }
                                    }}
                                />
                                <span>{task.title}</span>
                            </Label>
                            <div className="flex items-center justify-end gap-1 font-semibold text-amber-500 text-sm">
                                <Coins className="w-4 h-4" />
                                <span>{task.coins}</span>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground pl-7">
                            {task.description}
                        </p>
                        {isTaskSelected(task.id) && (
                             <div className="pl-7 pt-2">
                                <ToggleGroup
                                    type="multiple"
                                    variant="outline"
                                    value={selectedDays}
                                    onValueChange={(days: DayOfWeek[]) => handleDaySelection(task.id, days)}
                                    aria-label="Days of the week"
                                    className="flex-wrap justify-start"
                                >
                                    {daysOfWeek.map(day => (
                                        <ToggleGroupItem key={day} value={day} className="w-9 h-9">
                                            {dayAbbreviations[day]}
                                        </ToggleGroupItem>
                                    ))}
                                </ToggleGroup>
                                <div className='mt-2'>
                                  {selectedDays.length === 7 && <Badge variant="secondary">Every Day</Badge>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}) : (
              <p className="text-muted-foreground text-center py-4">This group has no tasks yet.</p>
            )}
            </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={Object.keys(schedules).length === 0}>
            Join & Commit to Tasks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
