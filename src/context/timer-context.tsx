'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserTask } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { completeUserTask } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

export type ActiveTimer = {
  taskId: string;
  task: UserTask;
  startedAt: number; // timestamp when timer started or resumed
  duration: number; // total duration in seconds
  remainingOnPause: number; // time remaining when paused
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
  const { user, refreshAuth } = useAuth();
  const { toast } = useToast();

  const handleCompleteTask = useCallback(async (taskToComplete: UserTask) => {
    if (!user) {
        console.error("Cannot complete task, user is not logged in.");
        return;
    }
    try {
        await completeUserTask(user.id, taskToComplete);
        toast({ title: 'Vazifa bajarildi!', description: `"${taskToComplete.title}" muvaffaqiyatli yakunlandi.` });
        if (refreshAuth) {
            await refreshAuth();
        }
    } catch (e) {
        console.error('Error completing task on timer finish', e);
        toast({ title: 'Xatolik', description: 'Vazifani yakunlashda xatolik yuz berdi.', variant: 'destructive' });
    }
  }, [user, toast, refreshAuth]);


  // Load timer from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('maqsadm_active_timer');
    if (saved) {
      try {
        const timer: ActiveTimer = JSON.parse(saved);
        setActiveTimer(timer);
        // If it was running when saved, resume it
        if (timer.remainingOnPause > 0 && timer.startedAt > 0) {
            setIsRunning(true);
        } else {
             setTimeRemaining(timer.remainingOnPause);
        }
      } catch (e) {
        console.error('Error loading timer from localStorage', e);
      }
    }
  }, []);

  // Timer tick effect
  useEffect(() => {
    if (!isRunning || !activeTimer) {
      return;
    }

    const tick = () => {
      const elapsed = (Date.now() - activeTimer.startedAt) / 1000;
      const remaining = Math.max(0, activeTimer.remainingOnPause - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        setIsRunning(false);
        handleCompleteTask(activeTimer.task);
        // Clear timer after completion
        setActiveTimer(null);
        setIsRunning(false);
        setTimeRemaining(0);
      }
    };

    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [activeTimer, isRunning, handleCompleteTask]);

  // Persist timer to localStorage
  useEffect(() => {
    if (activeTimer) {
      localStorage.setItem('maqsadm_active_timer', JSON.stringify(activeTimer));
    } else {
      localStorage.removeItem('maqsadm_active_timer');
    }
  }, [activeTimer]);

  const startTimer = useCallback((task: UserTask, durationMinutes: number) => {
    const durationSeconds = durationMinutes * 60;
    const newTimer: ActiveTimer = {
      taskId: task.id,
      task,
      startedAt: Date.now(),
      duration: durationSeconds,
      remainingOnPause: durationSeconds,
    };
    setActiveTimer(newTimer);
    setTimeRemaining(durationSeconds);
    setIsRunning(true);
  }, []);

  const pauseTimer = useCallback(() => {
    if (!activeTimer || !isRunning) return;
    
    const elapsed = (Date.now() - activeTimer.startedAt) / 1000;
    const remaining = Math.max(0, activeTimer.remainingOnPause - elapsed);

    setActiveTimer({
      ...activeTimer,
      remainingOnPause: remaining,
      startedAt: 0, // Reset startedAt to indicate it's paused
    });
    setIsRunning(false);
    setTimeRemaining(remaining);
  }, [activeTimer, isRunning]);

  const resumeTimer = useCallback(() => {
    if (!activeTimer || isRunning) return;

    setActiveTimer({
      ...activeTimer,
      startedAt: Date.now(), // Set new start time
    });
    setIsRunning(true);
  }, [activeTimer, isRunning]);

  const stopTimer = useCallback(() => {
    setActiveTimer(null);
    setIsRunning(false);
    setTimeRemaining(0);
  }, []);

  const completeTimer = useCallback(() => {
    // This is for manual completion, not when timer runs out
     if (activeTimer) {
        handleCompleteTask(activeTimer.task);
    }
    stopTimer();
  }, [activeTimer, stopTimer, handleCompleteTask]);

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
