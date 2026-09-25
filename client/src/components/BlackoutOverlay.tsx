import React from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

interface BlackoutOverlayProps {
  isVisible: boolean;
  message?: string;
  violationsCount?: number;
}

export const BlackoutOverlay: React.FC<BlackoutOverlayProps> = ({
  isVisible,
  message = 'Screenshot attempt detected',
  violationsCount = 0,
}) => {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-100 select-none"
      role="alertdialog"
      aria-modal="true"
    >
      <div className="max-w-md w-full border-2 border-redhat-red bg-[#121212] p-8 shadow-2xl rounded-sm">
        <div className="w-16 h-16 bg-redhat-red/20 text-redhat-red rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <h2 className="text-2xl font-black text-redhat-red uppercase tracking-wider mb-2 font-display">
          VIOLATION DETECTED
        </h2>

        <p className="text-lg font-bold text-white mb-4">
          {message}
        </p>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xs mb-6 text-xs text-neutral-300 space-y-2 text-left">
          <div className="flex items-center text-redhat-red font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5 shrink-0" />
            Security Incident Logged:
          </div>
          <p>
            Screen captures, devtools inspection, and unauthorized key combinations are strictly prohibited during the RHA DAY 26 Examination.
          </p>
          <p className="text-neutral-400">
            Total Recorded Violations:{' '}
            <span className="text-redhat-red font-bold font-mono">
              {violationsCount}
            </span>
          </p>
        </div>

        <div className="text-[11px] text-neutral-500 uppercase tracking-widest font-mono">
          Content temporarily shielded &bull; Logging incident with proctor
        </div>
      </div>
    </div>
  );
};
