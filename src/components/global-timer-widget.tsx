'use client';

import { useTimer } from '@/context/timer-context';
import { Pause, Play, X, Check } from 'lucide-react';
import { useState } from 'react';
import { completeUserTask } from '@/lib/data';
import { useAuth } from '@/context/auth-context';
import { motion } from 'framer-motion';

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function GlobalTimerWidget() {
  const { activeTimer, pauseTimer, resumeTimer, stopTimer, completeTimer, timeRemaining, isRunning } = useTimer();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!activeTimer) return null;

  const handleManualComplete = async () => {
    setIsSubmitting(true);
    try {
      if (user && activeTimer) {
        await completeUserTask(user.id, activeTimer.task);
      }
      completeTimer();
      stopTimer();
      alert(`✓ Vazifa bajarildi!`);
    } catch (e) {
      console.error('Error completing task', e);
      alert('Xatolik yuz berdi. Iltimos qayta urinib ko\'ring.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 md:bottom-6 md:right-6 md:left-auto md:translate-x-0 md:w-80 w-[calc(100%-32px)] z-40 cursor-grab active:cursor-grabbing"
    >
      <div className="bg-white/80 backdrop-blur-sm border rounded-xl shadow-lg p-3 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{activeTimer.task.title}</p>
          <p className="text-2xl font-bold text-primary">{formatTime(timeRemaining)}</p>
        </div>
        <div className="flex items-center gap-2">
          {isRunning ? (
            <button onClick={pauseTimer} aria-label="Pause" className="inline-flex items-center justify-center h-9 w-9 rounded-md border">
              <Pause />
            </button>
          ) : (
            <button onClick={resumeTimer} aria-label="Resume" className="inline-flex items-center justify-center h-9 w-9 rounded-md border">
              <Play />
            </button>
          )}
          <button onClick={handleManualComplete} aria-label="Complete" className="inline-flex items-center justify-center h-9 w-9 rounded-md border" disabled={isSubmitting}>
            {isSubmitting ? <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Check />}
          </button>
          <button onClick={stopTimer} aria-label="Stop" className="inline-flex items-center justify-center h-9 w-9 rounded-md border">
            <X />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
