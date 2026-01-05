'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserTask } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { completeUserTask } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

export type ActiveTimer = {
  taskId: string;
  task: UserTask;
  startedAt: number; // timestamp when timer started
  duration: number; // total duration in seconds
  paused: boolean;
  pausedAt?: number; // when it was paused
};

type TimerContextType = {
  activeTimer: ActiveTimer | null;
  startTimer: (task: UserTask, durationMinutes: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  completeTimer: () => void;
  timeRemaining: number; // in seconds
  isRunning: boolean;
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [autoCompletedFor, setAutoCompletedFor] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load timer from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('maqsadm_active_timer');
    if (saved) {
      try {
        const timer = JSON.parse(saved);
        setActiveTimer(timer);
        setIsRunning(true);
      } catch (e) {
        console.error('Error loading timer from localStorage', e);
      }
    }
  }, []);

  // Timer tick effect
  useEffect(() => {
    if (!activeTimer) {
      setTimeRemaining(0);
      return;
    }

    let cancelled = false;

    const tick = async () => {
      const elapsed = (Date.now() - activeTimer.startedAt) / 1000;
      const remaining = Math.max(0, activeTimer.duration - elapsed);
      if (cancelled) return;
      setTimeRemaining(Math.ceil(remaining));

      if (remaining <= 0) {
        // stop running state
        setIsRunning(false);

        // Auto-complete once per timer
        if (activeTimer && activeTimer.taskId !== autoCompletedFor) {
          setAutoCompletedFor(activeTimer.taskId);
          try {
            if (user) {
              await completeUserTask(user.id, activeTimer.task);
              toast({ title: 'Vazifa avtomatik yakunlandi', description: `${activeTimer.task.title} bajarildi va tangalar berildi.` });
            }
          } catch (e) {
            console.error('Error auto-completing task on timer finish', e);
          }

          // clear active timer after completion
          setActiveTimer(null);
          setTimeRemaining(0);
        }
      }
    };

    // initial tick then interval
    tick();
    const interval = setInterval(tick, 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeTimer, isRunning, user, autoCompletedFor, toast]);

  // Persist timer to localStorage
  useEffect(() => {
    if (activeTimer) {
      localStorage.setItem('maqsadm_active_timer', JSON.stringify(activeTimer));
    } else {
      localStorage.removeItem('maqsadm_active_timer');
    }
  }, [activeTimer]);

  const startTimer = useCallback((task: UserTask, durationMinutes: number) => {
    const timer: ActiveTimer = {
      taskId: task.id,
      task,
      startedAt: Date.now(),
      duration: durationMinutes * 60, // convert to seconds
      paused: false,
    };
    setActiveTimer(timer);
    setAutoCompletedFor(null);
    setIsRunning(true);
  }, []);

  const pauseTimer = useCallback(() => {
    if (activeTimer && isRunning) {
      setActiveTimer(prev => prev ? { ...prev, paused: true, pausedAt: Date.now() } : null);
      setIsRunning(false);
    }
  }, [activeTimer, isRunning]);

  const resumeTimer = useCallback(() => {
    if (activeTimer && !isRunning) {
      const pausedDuration = activeTimer.pausedAt ? (Date.now() - activeTimer.pausedAt) / 1000 : 0;
      setActiveTimer(prev => prev ? { 
        ...prev, 
        paused: false,
        startedAt: prev.startedAt + pausedDuration * 1000,
        pausedAt: undefined,
      } : null);
      setIsRunning(true);
    }
  }, [activeTimer, isRunning]);

  const stopTimer = useCallback(() => {
    setActiveTimer(null);
    setIsRunning(false);
    setTimeRemaining(0);
  }, []);

  const completeTimer = useCallback(() => {
    setTimeRemaining(0);
    setIsRunning(false);
    // Keep activeTimer so UI can show "completed" state
  }, []);

  return (
    <TimerContext.Provider
      value={{
        activeTimer,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        completeTimer,
        timeRemaining,
        isRunning,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within TimerProvider');
  }
  return context;
}
