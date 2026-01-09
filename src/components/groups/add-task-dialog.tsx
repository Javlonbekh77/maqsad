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
import type { Task, DayOfWeek, TaskSchedule } from '@/lib/types';
import { Coins } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from '../ui/badge';

interface AddTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (schedule: TaskSchedule) => void;
  task: Task;
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

export default function AddTaskDialog({
  isOpen,
  onClose,
  onConfirm,
  task,
}: AddTaskDialogProps) {
  const t = useTranslations('actions');
  
  // Initialize with task's default schedule if recurring, otherwise all days
  const defaultDays = task.schedule.type === 'recurring' && task.schedule.days 
    ? task.schedule.days 
    : daysOfWeek;
  
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(defaultDays);

  const handleConfirm = () => {
    const schedule: TaskSchedule = { 
      type: 'recurring', 
      days: selectedDays 
    };
    onConfirm(schedule);
    setSelectedDays(defaultDays); // Reset for next time
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Vazifani Rejangizga Qo'shish</DialogTitle>
          <DialogDescription>
            "{task.title}" vazifasini qaysi kunlarda bajarishni rejalashtiryapsiz?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium">{task.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
              </div>
              <div className="flex items-center justify-end gap-1 font-semibold text-amber-500 text-sm">
                <Coins className="w-4 h-4" />
                <span>{task.coins}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Hafta kunlari</label>
            <ToggleGroup
              type="multiple"
              variant="outline"
              value={selectedDays}
              onValueChange={(days: DayOfWeek[]) => setSelectedDays(days)}
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
              {selectedDays.length === 7 && <Badge variant="secondary">Har kuni</Badge>}
              {selectedDays.length === 0 && (
                <Badge variant="destructive">Kamida bitta kun tanlang</Badge>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={selectedDays.length === 0}>
            Rejangizga Qo'shish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
