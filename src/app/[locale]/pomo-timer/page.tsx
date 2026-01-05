'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { useTimer } from '@/context/timer-context';
import { format as formatTime } from 'date-fns';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { Input } from '@/components/ui/input';

const POMO_DURATIONS = [
  { label: '15 min', value: 15 },
  { label: '25 min', value: 25 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
];

function formatDisplayTime(seconds: number): string {
    if (seconds <= 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatLargeDisplayTime(seconds: number): string {
    if (seconds <= 0) return "00";
    const minutes = Math.floor(seconds / 60);
    return `${String(minutes).padStart(2, '0')}`;
}


export default function PomoTimerPage() {
  const { startTimer, pauseTimer, resumeTimer, stopTimer, activeTimer, timeRemaining, isRunning } = useTimer();
  
  const [selectedDuration, setSelectedDuration] = useState<number | null>(25);
  const [customDuration, setCustomDuration] = useState(30);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (activeTimer) {
        setSelectedDuration(activeTimer.duration / 60);
    } else {
        // If timer is stopped, reset to a default non-custom value
        setSelectedDuration(25);
    }
  }, [activeTimer]);


  const handleStartPomo = () => {
    const durationToStart = selectedDuration === null ? customDuration : selectedDuration;
    if (durationToStart <= 0) return;

    const task = {
      id: 'pomo-' + Date.now(),
      title: `Fokus sessiyasi (${durationToStart} daqiqa)`,
      description: 'Pomodoro texnikasi bilan diqqatni jamlash',
      coins: 0,
      taskType: 'personal',
      schedule: { type: 'one-time', date: formatTime(new Date(), 'yyyy-MM-dd') },
      isCompleted: false,
      history: [],
      createdAt: Timestamp.now(),
      userId: '',
      visibility: 'private',
    } as any;
    
    startTimer(task, durationToStart);
  };
  
  const handleReset = () => {
    stopTimer();
    setSelectedDuration(25);
  };

  const handlePauseResume = () => {
    if(isRunning) {
        pauseTimer();
    } else {
        resumeTimer();
    }
  };

  const durationInSeconds = activeTimer 
    ? activeTimer.duration 
    : (selectedDuration === null ? customDuration : selectedDuration) * 60;

  const displayTime = activeTimer ? formatDisplayTime(timeRemaining) : formatDisplayTime(durationInSeconds);
  const largeDisplayTime = activeTimer ? formatLargeDisplayTime(timeRemaining) : String(selectedDuration === null ? customDuration : selectedDuration).padStart(2, '0');
  const timerStatus = activeTimer ? (isRunning ? 'Ishlayapti' : 'Pauza') : 'Tayyor';

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
              <div className="text-7xl font-bold font-mono">{largeDisplayTime}</div>
              <div className="text-sm text-muted-foreground mt-1">daqida</div>
              <div className="text-sm text-muted-foreground mt-2">{timerStatus}</div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 mb-4">
            {POMO_DURATIONS.map((item) => (
              <Button
                key={item.value}
                variant={selectedDuration === item.value && !activeTimer ? 'default' : 'outline'}
                disabled={!!activeTimer}
                onClick={() => setSelectedDuration(item.value)}
              >
                {item.label}
              </Button>
            ))}
             <Button
                variant={selectedDuration === null && !activeTimer ? 'default' : 'outline'}
                disabled={!!activeTimer}
                onClick={() => setSelectedDuration(null)}
              >
                Maxsus
              </Button>
          </div>
            
            {selectedDuration === null && !activeTimer && (
                <div className='mb-8'>
                    <Input 
                        type="number"
                        placeholder="Vaqtni daqiqada kiriting"
                        value={customDuration}
                        onChange={(e) => setCustomDuration(parseInt(e.target.value) || 0)}
                        className="text-center"
                    />
                </div>
            )}

          <div className="flex gap-4 justify-center mb-8">
            {!activeTimer ? (
               <Button size="lg" className="w-24 h-24 rounded-full" onClick={handleStartPomo}>
                    <Play className="w-8 h-8" />
                </Button>
            ) : (
                <Button size="lg" variant="secondary" className="w-24 h-24 rounded-full" onClick={handlePauseResume}>
                    {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                </Button>
            )}
            <Button variant="outline" size="lg" className="w-24 h-24 rounded-full" onClick={handleReset} disabled={!activeTimer}>
              <RotateCcw className="w-8 h-8" />
            </Button>
            <Button variant="outline" size="lg" className="w-24 h-24 rounded-full" onClick={() => setIsMuted(prev => !prev)}>
              {isMuted ? <VolumeX className="w-8 h-8" /> : <Volume2 className="w-8 h-8" />}
            </Button>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg text-center text-sm text-muted-foreground">
            <p className="mb-2">💡 Maslahat:</p>
            <ul className="text-left space-y-1 text-xs">
              <li>• Fokusni saqlash uchun 25 daqiqalik sessiyalardan foydalaning.</li>
              <li>• Har bir sessiyadan so'ng 5 daqiqa dam oling.</li>
              <li>• Har 4 sessiyadan keyin uzoqroq tanaffus qiling (15-30 daqiqa).</li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
