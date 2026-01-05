'use client';

import { useTimer } from '@/context/timer-context';
import { Pause, Play, X, Check } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

function formatTime(seconds: number): string {
  const roundedSeconds = Math.round(seconds);
  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.floor((roundedSeconds % 3600) / 60);
  const secs = roundedSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function GlobalTimerWidget() {
  const { activeTimer, pauseTimer, resumeTimer, stopTimer, completeTimer, timeRemaining, isRunning } = useTimer();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!activeTimer) return null;

  const handleManualComplete = async () => {
    setIsSubmitting(true);
    try {
      completeTimer(); // This function now handles everything
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
      <div className="bg-gray-900/90 dark:bg-black/90 text-white backdrop-blur-sm border border-white/20 rounded-xl shadow-lg p-3 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{activeTimer.task.title}</p>
          <p className="text-2xl font-bold text-primary">{formatTime(timeRemaining)}</p>
        </div>
        <div className="flex items-center gap-2">
          {isRunning ? (
            <button onClick={pauseTimer} aria-label="Pause" className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-white/20 hover:bg-white/10 transition-colors">
              <Pause className="h-5 w-5" />
            </button>
          ) : (
            <button onClick={resumeTimer} aria-label="Resume" className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-white/20 hover:bg-white/10 transition-colors">
              <Play className="h-5 w-5" />
            </button>
          )}
          <button onClick={handleManualComplete} aria-label="Complete" className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-white/20 hover:bg-white/10 transition-colors" disabled={isSubmitting}>
            {isSubmitting ? <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Check className="h-5 w-5" />}
          </button>
          <button onClick={stopTimer} aria-label="Stop" className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-white/20 hover:bg-red-500/20 transition-colors text-red-400">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
