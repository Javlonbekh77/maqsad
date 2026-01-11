'use client';

import { useTimer } from '@/context/timer-context';
import { Pause, Play, X, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { completeUserTask } from '@/lib/data';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export default function GlobalTimerWidget() {
  const { activeTimer, pauseTimer, resumeTimer, stopTimer, completeTimer, timeRemaining, isRunning } = useTimer();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Center the widget initially or position based on localStorage
    const savedPosition = localStorage.getItem('timerWidgetPosition');
    if (savedPosition) {
        try {
            setPosition(JSON.parse(savedPosition));
        } catch (e) {
             // Fallback to default position
             const initialX = (window.innerWidth - 320) / 2;
             const initialY = window.innerHeight - 100;
             setPosition({ x: initialX, y: initialY });
        }
    } else {
        const initialX = (window.innerWidth - 320) / 2; // Center horizontally
        const initialY = window.innerHeight - 100; // Position at the bottom
        setPosition({ x: initialX, y: initialY });
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (widgetRef.current) {
        setIsDragging(true);
        offsetRef.current = {
            x: e.clientX - widgetRef.current.getBoundingClientRect().left,
            y: e.clientY - widgetRef.current.getBoundingClientRect().top
        };
        // Prevent text selection while dragging
        e.preventDefault();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && widgetRef.current) {
      let newX = e.clientX - offsetRef.current.x;
      let newY = e.clientY - offsetRef.current.y;

      // Boundary checks
      const maxX = window.innerWidth - widgetRef.current.offsetWidth;
      const maxY = window.innerHeight - widgetRef.current.offsetHeight;
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
        setIsDragging(false);
        localStorage.setItem('timerWidgetPosition', JSON.stringify(position));
    }
  };
  
  useEffect(() => {
    if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    } else {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);


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
  
  const progress = (timeRemaining / activeTimer.duration) * 100;

  return (
    <div
      ref={widgetRef}
      className="fixed z-50 w-80 cursor-grab"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none' // For mobile drag
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="bg-black/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-2xl p-3 flex items-center justify-between gap-4 text-white relative overflow-hidden">
        {/* Progress Bar */}
        <div 
          className="absolute bottom-0 left-0 h-1 bg-primary/70 transition-all duration-500" 
          style={{ width: `${100 - progress}%` }}
        ></div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{activeTimer.task.title}</p>
          <p className="text-2xl font-bold text-primary">{formatTime(timeRemaining)}</p>
        </div>
        <div className="flex items-center gap-1">
          {isRunning ? (
            <button onClick={pauseTimer} aria-label="Pause" className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-white/10 transition-colors">
              <Pause className="h-5 w-5"/>
            </button>
          ) : (
            <button onClick={resumeTimer} aria-label="Resume" className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-white/10 transition-colors">
              <Play className="h-5 w-5"/>
            </button>
          )}
          <button onClick={handleManualComplete} aria-label="Complete" disabled={isSubmitting} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-white/10 transition-colors disabled:opacity-50">
            <Check className="h-5 w-5"/>
          </button>
          <button onClick={stopTimer} aria-label="Stop" className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-white/10 transition-colors">
            <X className="h-5 w-5"/>
          </button>
        </div>
      </div>
    </div>
  );
}
