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

const TIMER_STORAGE_KEY = 'maqsadm_active_timer';

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
    try {
      const saved = localStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) {
        const timer: ActiveTimer = JSON.parse(saved);
        // If the timer was running when the page was closed, adjust its start time
        if (timer.paused) {
          setIsRunning(false);
        } else {
           setIsRunning(true);
        }
        setActiveTimer(timer);
      }
    } catch (e) {
      console.error('Error loading timer from localStorage', e);
      localStorage.removeItem(TIMER_STORAGE_KEY);
    }
  }, []);

  // Timer tick effect
  useEffect(() => {
    if (!activeTimer || !isRunning) {
      if (activeTimer && !isRunning) {
          // If paused, just set the time remaining without starting the interval
          const elapsed = (activeTimer.pausedAt! - activeTimer.startedAt) / 1000;
          setTimeRemaining(Math.ceil(Math.max(0, activeTimer.duration - elapsed)));
      }
      return;
    }

    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      
      const elapsed = (Date.now() - activeTimer.startedAt) / 1000;
      const remaining = Math.max(0, activeTimer.duration - elapsed);
      
      setTimeRemaining(Math.ceil(remaining));

      if (remaining <= 0) {
        setIsRunning(false);
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
          stopTimer(); // Clean up after completion
        }
      }
    };

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
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(activeTimer));
    } else {
      localStorage.removeItem(TIMER_STORAGE_KEY);
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
      const pausedDuration = activeTimer.pausedAt ? (Date.now() - activeTimer.pausedAt) : 0;
      setActiveTimer(prev => prev ? { 
        ...prev, 
        paused: false,
        startedAt: prev.startedAt + pausedDuration,
        pausedAt: undefined,
      } : null);
      setIsRunning(true);
    }
  }, [activeTimer, isRunning]);

  const stopTimer = useCallback(() => {
    setActiveTimer(null);
    setIsRunning(false);
    setTimeRemaining(0);
    localStorage.removeItem(TIMER_STORAGE_KEY);
  }, []);

  const completeTimer = useCallback(() => {
    setTimeRemaining(0);
    setIsRunning(false);
    // Keep activeTimer so UI can show "completed" state, stopTimer will clear it
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
