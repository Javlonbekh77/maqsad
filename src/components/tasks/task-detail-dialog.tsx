'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { UserTask, DayOfWeek } from '@/lib/types';
import { Coins, Flame, Calendar, Clock, Smile, Eye, EyeOff, Repeat } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface TaskDetailDialogProps {
  task: UserTask;
  isOpen: boolean;
  onClose: () => void;
}

const scheduleText = (schedule: UserTask['schedule']) => {
    if (!schedule) return "Jadval belgilanmagan";
    switch (schedule.type) {
        case 'one-time':
            return schedule.date ? `Bir martalik: ${format(parseISO(schedule.date), 'PPP')}` : "Bir martalik";
        case 'date-range':
            if (schedule.startDate && schedule.endDate) {
                return `Oraliq: ${format(parseISO(schedule.startDate), 'PPP')} - ${format(parseISO(schedule.endDate), 'PPP')}`;
            }
            return "Sana oralig'i";
        case 'recurring':
            if (schedule.days && schedule.days.length > 0) {
                 if(schedule.days.length === 7) return "Har kuni";
                 return `Har ${schedule.days.join(', ')} kunlari`;
            }
            return "Haftalik takrorlanuvchi";
        default:
            return "Jadval belgilanmagan";
    }
}

export default function TaskDetailDialog({ task, isOpen, onClose }: TaskDetailDialogProps) {
  if (!task) return null;

  const isPersonal = task.taskType === 'personal';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">{task.title}</DialogTitle>
          <DialogDescription>{task.description}</DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-4">
            <div className='flex justify-between items-center bg-muted/50 p-3 rounded-lg'>
                <div className="flex items-center gap-2 font-semibold">
                    {isPersonal ? <Flame className="h-5 w-5 text-slate-500" /> : <Coins className="h-5 w-5 text-amber-500" />}
                    <span>Mukofot</span>
                </div>
                <span className={`font-bold text-lg ${isPersonal ? 'text-slate-500' : 'text-amber-500'}`}>
                    {isPersonal ? '1 Kumush' : `${task.coins} Oltin`}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className='font-medium'>Turi:</span>
                    {isPersonal ? <Badge variant="secondary">Shaxsiy</Badge> : <Badge variant="outline">{task.groupName}</Badge>}
                </div>
                {task.estimatedTime && (
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className='font-medium'>Vaqti:</span>
                        <span>{task.estimatedTime}</span>
                    </div>
                )}
                 {task.satisfactionRating && (
                    <div className="flex items-center gap-2">
                        <Smile className="h-4 w-4 text-muted-foreground" />
                        <span className='font-medium'>Reyting:</span>
                        <span>{task.satisfactionRating}/10</span>
                    </div>
                )}
                {isPersonal && (
                    <div className="flex items-center gap-2">
                        {task.visibility === 'public' ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                        <span className='font-medium'>Ko'rinishi:</span>
                        <span>{task.visibility === 'public' ? "Ommaviy" : "Shaxsiy"}</span>
                    </div>
                )}
            </div>

            <div className='p-3 rounded-lg border'>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Repeat className='h-4 w-4'/>Jadval</h4>
                <p className='text-muted-foreground'>{scheduleText(task.schedule)}</p>
            </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Yopish</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
