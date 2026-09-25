import React, { useState, useEffect } from 'react';
import { Maximize2, AlertOctagon } from 'lucide-react';

interface FullscreenModalProps {
  isOpen: boolean;
  onReturnToFullscreen: () => void;
  violationsCount: number;
  maxViolations: number;
}

export const FullscreenModal: React.FC<FullscreenModalProps> = ({
  isOpen,
  onReturnToFullscreen,
  violationsCount,
  maxViolations,
}) => {
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(15);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const remainingStrikes = Math.max(0, maxViolations - violationsCount);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border-2 border-redhat-red rounded-sm shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-in zoom-in-95 duration-150">
        
        <div className="flex items-center space-x-3 text-redhat-red mb-4">
          <div className="p-2 bg-redhat-red/10 rounded-sm">
            <AlertOctagon className="w-8 h-8 text-redhat-red" />
          </div>
          <div>
            <h3 className="text-xl font-black text-redhat-black font-display uppercase tracking-tight">
              FULLSCREEN REQUIRED
            </h3>
            <p className="text-xs font-bold text-redhat-red uppercase tracking-wider">
              Exam Paused &bull; Anti-Cheating Violation Recorded
            </p>
          </div>
        </div>

        <p className="text-sm text-neutral-700 mb-4 leading-relaxed">
          Exiting fullscreen mode is strictly monitored. To prevent unfair assistance or dual-monitor inspection, all examination questions must be attempted strictly in full-screen focus.
        </p>

        {/* Violations Meter */}
        <div className="bg-redhat-gray-light border border-redhat-gray-border p-4 rounded-xs mb-6">
          <div className="flex justify-between items-center text-xs font-bold mb-2">
            <span className="text-neutral-700">Violation Strikes:</span>
            <span className="text-redhat-red font-mono text-sm">
              {violationsCount} of {maxViolations} permitted
            </span>
          </div>

          <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-redhat-red h-full transition-all duration-300"
              style={{ width: `${Math.min(100, (violationsCount / maxViolations) * 100)}%` }}
            />
          </div>

          <div className="text-[11px] text-neutral-500 mt-2">
            {remainingStrikes > 0 ? (
              <span>⚠️ <strong>{remainingStrikes}</strong> strike{remainingStrikes > 1 ? 's' : ''} remaining before automatic disqualification.</span>
            ) : (
              <span className="text-redhat-red font-bold">🚨 Max violations reached. Submission flagged.</span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-3">
          <button
            onClick={onReturnToFullscreen}
            className="w-full py-3 px-4 bg-redhat-red hover:bg-redhat-red-dark text-white font-bold text-sm tracking-wide uppercase rounded-sm flex items-center justify-center space-x-2 transition-colors shadow-md cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Re-Enter Fullscreen Mode ({countdown}s)</span>
          </button>
          
          <p className="text-[11px] text-center text-neutral-500">
            Clicking will restore fullscreen lock and resume timer.
          </p>
        </div>

      </div>
    </div>
  );
};
