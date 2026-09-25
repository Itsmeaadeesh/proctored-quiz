import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface QuizTimerProps {
  durationMinutes: number;
  onTimeExpired: () => void;
  isPaused?: boolean;
}

export const QuizTimer: React.FC<QuizTimerProps> = ({
  durationMinutes,
  onTimeExpired,
  isPaused = false,
}) => {
  const totalSeconds = durationMinutes * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);

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
  const percentRemaining = (secondsRemaining / totalSeconds) * 100;
  const isUrgent = secondsRemaining <= 120; // under 2 mins

  return (
    <div className="w-full bg-white border-b border-redhat-gray-border shadow-xs">
      {/* Top Red Progress Bar */}
      <div className="w-full bg-neutral-200 h-1.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isUrgent ? 'bg-redhat-red animate-pulse' : 'bg-redhat-red'
          }`}
          style={{ width: `${percentRemaining}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        
        {/* Event Header */}
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-redhat-red"></span>
          <span className="text-xs font-bold text-redhat-black uppercase tracking-wider font-display">
            RHA DAY 26 &bull; Timed Session
          </span>
        </div>

        {/* Digital Countdown Timer */}
        <div
          className={`flex items-center space-x-2 px-3 py-1 rounded-sm border ${
            isUrgent
              ? 'bg-red-50 border-redhat-red text-redhat-red animate-pulse'
              : 'bg-redhat-gray-light border-redhat-gray-border text-redhat-black'
          }`}
        >
          {isUrgent ? (
            <AlertTriangle className="w-4 h-4 text-redhat-red" />
          ) : (
            <Clock className="w-4 h-4 text-redhat-gray-text" />
          )}
          
          <div className="text-sm font-black font-mono tracking-wider">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>

          <span className="text-[10px] uppercase font-bold text-redhat-gray-text">
            {isUrgent ? 'Hurry!' : 'Remaining'}
          </span>
        </div>

      </div>
    </div>
  );
};
