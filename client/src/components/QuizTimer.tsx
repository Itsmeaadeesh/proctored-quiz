import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface QuizTimerProps {
  durationMinutes: number;
  initialSecondsRemaining?: number;
  onTimeExpired: () => void;
  isPaused?: boolean;
}

export const QuizTimer: React.FC<QuizTimerProps> = ({
  durationMinutes,
  initialSecondsRemaining,
  onTimeExpired,
  isPaused = false,
}) => {
  const totalSeconds = (durationMinutes || 60) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(
    initialSecondsRemaining !== undefined ? initialSecondsRemaining : totalSeconds
  );

  useEffect(() => {
    if (initialSecondsRemaining !== undefined) {
      setSecondsRemaining(initialSecondsRemaining);
    }
  }, [initialSecondsRemaining]);

  useEffect(() => {
    if (isPaused) return;

    if (secondsRemaining <= 0) {
      onTimeExpired();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, onTimeExpired, isPaused]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const percentRemaining = Math.max(0, Math.min(100, (secondsRemaining / totalSeconds) * 100));
  // Under 5 minutes (300 seconds) warning threshold per exam config
  const isUrgent = secondsRemaining <= 300;

  return (
    <div className={`w-full border-b transition-colors shadow-xs ${isUrgent ? 'bg-red-50 border-red-300' : 'bg-white border-redhat-gray-border'}`}>
      {/* Top Red Progress Bar */}
      <div className="w-full bg-neutral-200 h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isUrgent ? 'bg-red-600 animate-pulse' : 'bg-redhat-red'
          }`}
          style={{ width: `${percentRemaining}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        
        {/* Event Header */}
        <div className="flex items-center space-x-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isUrgent ? 'bg-red-600 animate-ping' : 'bg-redhat-red'}`}></span>
          <span className="text-xs font-bold text-redhat-black uppercase tracking-wider font-display">
            RHA DAY 26 &bull; Timed Session (60 Mins)
          </span>
        </div>

        {/* Digital Countdown Timer */}
        <div
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-sm border transition-all ${
            isUrgent
              ? 'bg-red-600 border-red-700 text-white animate-pulse shadow-md font-bold'
              : 'bg-redhat-gray-light border-redhat-gray-border text-redhat-black'
          }`}
        >
          {isUrgent ? (
            <AlertTriangle className="w-4 h-4 text-white" />
          ) : (
            <Clock className="w-4 h-4 text-redhat-gray-text" />
          )}
          
          <div className="text-base font-black font-mono tracking-wider">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>

          <span className={`text-[10px] uppercase font-black tracking-wide ${isUrgent ? 'text-white' : 'text-redhat-gray-text'}`}>
            {isUrgent ? 'CRITICAL (<5M)' : 'Remaining'}
          </span>
        </div>

      </div>
    </div>
  );
};
