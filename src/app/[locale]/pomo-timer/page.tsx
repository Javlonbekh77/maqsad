'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { useTimer } from '@/context/timer-context';
import { format } from 'date-fns';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

const POMO_DURATIONS = [
  { label: '15 min', value: 15 },
  { label: '25 min', value: 25 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
];

export default function PomoTimerPage() {
  const { startTimer, pauseTimer, resumeTimer, stopTimer, activeTimer } = useTimer();
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [customDuration, setCustomDuration] = useState(25);
  const [isMuted, setIsMuted] = useState(false);

  const handleStartPomo = () => {
    const task = {
      id: 'pomo-' + Date.now(),
      title: `Pomodoro (${selectedDuration} min)`,
      description: 'Focus session',
      coins: 0,
      taskType: 'personal',
      schedule: { type: 'one-time', date: format(new Date(), 'yyyy-MM-dd') },
      isCompleted: false,
      history: [],
      createdAt: Timestamp.now(),
      userId: '',
      visibility: 'private',
    } as any;
    
    startTimer(task, selectedDuration);
  };

  const displayTime = activeTimer ? '00:00' : `${String(selectedDuration).padStart(2, '0')}:00`;
  const timerStatus = activeTimer ? (activeTimer.paused ? 'Pauza' : 'Ishlayapti') : 'Tayyor';

  return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-180px)]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Fokus Vaqti</h1>
            <p className="text-muted-foreground">Pomodoro texnikasi bilan vaqt boshqaring</p>
          </div>

          <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl w-64 h-64 mx-auto flex items-center justify-center mb-8 border border-primary/20">
            <div className="text-center">
              <div className="text-7xl font-bold font-mono">{displayTime}</div>
              <div className="text-sm text-muted-foreground mt-2">{timerStatus}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-8">
            {POMO_DURATIONS.map((item) => (
              <Button
                key={item.value}
                variant={selectedDuration === item.value && !activeTimer ? 'default' : 'outline'}
                disabled={!!activeTimer}
              >
                {item.label}
              </Button>
            ))}
          </div>

          <div className="mb-8 flex gap-2">
            <input
              type="number"
              min="1"
              max="180"
              value={customDuration}
              disabled={!!activeTimer}
              className="flex-1 px-3 py-2 border rounded-md bg-background text-foreground"
              placeholder="Minut"
            />
            <span className="flex items-center text-sm text-muted-foreground">min</span>
          </div>

          <div className="flex gap-4 justify-center mb-8">
            {!activeTimer || activeTimer.paused ? (
              <Button size="lg" className="w-24 h-24 rounded-full">
                <Play className="w-8 h-8" />
              </Button>
            ) : (
              <Button size="lg" variant="secondary" className="w-24 h-24 rounded-full">
                <Pause className="w-8 h-8" />
              </Button>
            )}
            <Button variant="outline" size="lg" className="w-24 h-24 rounded-full">
              <RotateCcw className="w-8 h-8" />
            </Button>
            <Button variant="outline" size="lg" className="w-24 h-24 rounded-full">
              {isMuted ? <VolumeX className="w-8 h-8" /> : <Volume2 className="w-8 h-8" />}
            </Button>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg text-center text-sm text-muted-foreground">
            <p className="mb-2">💡 Maslahat:</p>
            <ul className="text-left space-y-1 text-xs">
              <li>• 25 daqiqali Pomodoro</li>
              <li>• Her 4 sessiyadan keyin dam oling</li>
              <li>• Fokusni saqlang</li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
