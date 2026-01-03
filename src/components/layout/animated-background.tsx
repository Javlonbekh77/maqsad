"use client";

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export default function AnimatedBackground() {
  const { theme } = useTheme();
  const [sunPosition, setSunPosition] = useState({ top: '100%', left: '50%' });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const calculateSunPosition = () => {
        const now = new Date();
        const hours = now.getHours() + now.getMinutes() / 60;
        
        // Sun is visible from 5 AM to 7 PM (19:00)
        if (hours >= 5 && hours <= 19) {
          const totalDaylightHours = 14;
          const hoursSinceSunrise = hours - 5;
          
          // Map time to a 0-1 progress value
          const progress = hoursSinceSunrise / totalDaylightHours;
          
          // Calculate left position (horizontal movement)
          const left = 10 + progress * 80; // from 10% to 90%
          
          // Calculate top position (arc movement)
          // Uses a sine wave for the arc: peaks at midday (progress = 0.5)
          const verticalPosition = 1 - Math.sin(progress * Math.PI); // 0 -> 1 -> 0
          const top = 10 + verticalPosition * 70; // top 10% (midday) to 80% (sunrise/sunset)
          
          setSunPosition({ top: `${top}%`, left: `${left}%` });
        } else {
          // Sun is below the horizon
          setSunPosition({ top: '110%', left: '50%' });
        }
      };

      calculateSunPosition();
      // Update every 10 minutes
      const interval = setInterval(calculateSunPosition, 10 * 60 * 1000); 
      return () => clearInterval(interval);
    }
  }, []);

  if (!isClient) {
    return null;
  }
  
  const isDark = theme === 'dark';

  return (
    <div
      className={cn(
        "fixed inset-0 z-[-1] overflow-hidden transition-colors duration-500",
        isDark ? 'bg-gray-900' : 'bg-sky-400'
      )}
    >
      {isDark ? (
        // Dark Mode: Night Sky
        <div className="relative w-full h-full">
          <div id="stars"></div>
          <div id="stars2"></div>
          <div id="stars3"></div>
          <div className="absolute top-[15%] left-[10%] h-20 w-20 bg-gray-200 rounded-full shadow-lg opacity-90"></div>
        </div>
      ) : (
        // Light Mode: Day Sky
        <div className="relative w-full h-full">
            <div 
                className="absolute h-24 w-24 bg-yellow-300 rounded-full shadow-2xl shadow-yellow-200 transition-all duration-1000 ease-in-out"
                style={{ top: sunPosition.top, left: sunPosition.left, transform: 'translate(-50%, -50%)' }}
            ></div>
            <div id="cloud-group-1" className="absolute top-0 left-0 w-full h-full cloud-animation">
                <div className="cloud cloud-1"></div>
                <div className="cloud cloud-2"></div>
            </div>
             <div id="cloud-group-2" className="absolute top-0 left-0 w-full h-full cloud-animation animation-delay-5s">
                <div className="cloud cloud-3"></div>
                <div className="cloud cloud-4"></div>
            </div>
        </div>
      )}
    </div>
  );
}
