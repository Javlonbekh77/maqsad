'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { useTimer } from '@/context/timer-context';
import { format } from 'date-fns';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Timer } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

const POMO_DURATIONS = [
  { label: '15 min', value: 15 },
  { label: '25 min', value: 25 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
];

function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function PomoTimerPage() {
  const { startTimer, pauseTimer, resumeTimer, stopTimer, activeTimer, timeRemaining, isRunning } = useTimer();
  const { user } = useAuth();
  
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [isMuted, setIsMuted] = useState(false);
  
  // Sync local duration with active timer if it exists
  useEffect(() => {
    if (activeTimer) {
      setSelectedDuration(activeTimer.duration / 60);
    }
  }, [activeTimer]);

  const handleStartPomo = useCallback(() => {
    if (!user) {
      alert("Please log in to start a timer.");
      return;
    }
    const task = {
      id: 'pomo-' + Date.now(),
      title: `Fokus sessiyasi (${selectedDuration} daqiqa)`,
      description: 'Pomodoro taymeri yordamida bajarilgan vazifa.',
      coins: 1, // Award 1 silver coin
      taskType: 'personal',
      visibility: 'private',
      schedule: { type: 'one-time', date: format(new Date(), 'yyyy-MM-dd') },
      isCompleted: false,
      history: [],
      createdAt: Timestamp.now(),
      userId: user.id,
    } as any;
    
    startTimer(task, selectedDuration);
  }, [selectedDuration, startTimer, user]);
  
  const handlePlayPause = () => {
    if (isRunning) {
        pauseTimer();
    } else {
        if (activeTimer) {
            resumeTimer();
        } else {
            handleStartPomo();
        }
    }
  };
  
  const handleReset = () => {
    stopTimer();
  };

  const handleDurationChange = (minutes: number) => {
    if (!activeTimer) {
        setSelectedDuration(minutes);
    }
  }

  const displayTime = useMemo(() => {
    if (activeTimer) {
      return formatTime(timeRemaining);
    }
    return formatTime(selectedDuration * 60);
  }, [activeTimer, timeRemaining, selectedDuration]);

  const timerStatus = activeTimer ? (isRunning ? 'Ishlayapti' : 'Pauza') : 'Tayyor';

  return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-180px)]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 font-display">Fokus Vaqti</h1>
            <p className="text-muted-foreground">Pomodoro texnikasi bilan vaqtni samarali boshqaring</p>
          </div>

          <Card className='overflow-hidden'>
            <CardContent className="pt-6">
                <div className={cn(
                    "relative rounded-full w-64 h-64 mx-auto flex items-center justify-center mb-8 transition-all duration-500",
                    isRunning ? "bg-primary/20 border-primary/30" : "bg-muted/50 border-muted-foreground/20",
                    "border-8"
                    )}>
                     <div className="absolute inset-0 rounded-full border-[16px] border-background z-10"></div>
                     <div 
                        className="absolute inset-0 rounded-full bg-primary transition-transform duration-500 origin-bottom" 
                        style={{
                            transform: `scaleY(${(timeRemaining / (selectedDuration * 60))})`
                        }}
                     ></div>
                    <div className="text-center relative z-20">
                    <div className="text-7xl font-bold font-mono">{displayTime}</div>
                    <div className="text-sm text-muted-foreground mt-2">{timerStatus}</div>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-8">
                    {POMO_DURATIONS.map((item) => (
                    <Button
                        key={item.value}
                        variant={selectedDuration === item.value && !activeTimer ? 'default' : 'outline'}
                        onClick={() => handleDurationChange(item.value)}
                        disabled={!!activeTimer}
                    >
                        {item.label}
                    </Button>
                    ))}
                </div>

                <div className="flex gap-4 justify-center mb-8">
                    <Button 
                        size="lg" 
                        className="w-24 h-24 rounded-full"
                        onClick={handlePlayPause}
                    >
                        {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                    </Button>
                    <Button variant="outline" size="lg" className="w-24 h-24 rounded-full" onClick={handleReset} disabled={!activeTimer}>
                        <RotateCcw className="w-8 h-8" />
                    </Button>
                     <Button variant="outline" size="lg" className="w-24 h-24 rounded-full" onClick={() => setIsMuted(prev => !prev)}>
                        {isMuted ? <VolumeX className="w-8 h-8" /> : <Volume2 className="w-8 h-8" />}
                    </Button>
                </div>
            </CardContent>
          </Card>
           <div className="bg-muted/50 p-4 rounded-lg text-center text-sm text-muted-foreground mt-8">
            <p className="mb-2">💡 Maslahat:</p>
            <ul className="text-left space-y-1 text-xs list-disc list-inside">
              <li>Har 25 daqiqalik fokusdan so'ng 5 daqiqa dam oling.</li>
              <li>Har to'rtta "pomodoro"dan keyin 15-30 daqiqa uzoqroq tanaffus qiling.</li>
              <li>Taymer ishlayotganda chalg'ituvchi narsalardan uzoqroq bo'ling.</li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
