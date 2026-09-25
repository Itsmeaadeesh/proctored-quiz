import React, { useState } from 'react';
import { Camera, ChevronDown, ChevronUp, ShieldCheck, AlertCircle } from 'lucide-react';

interface WebcamProctorProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isCameraActive: boolean;
  snapshotCount: number;
  faceStatus: 'verified' | 'low_light' | 'no_face' | 'unsupported';
  studentRollNo: string;
}

export const WebcamProctor: React.FC<WebcamProctorProps> = ({
  videoRef,
  canvasRef,
  isCameraActive,
  snapshotCount,
  faceStatus,
  studentRollNo,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-30 select-none">
      <div className="bg-neutral-900 border-2 border-neutral-700 rounded-sm shadow-xl overflow-hidden transition-all duration-200">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-950 text-white text-xs border-b border-neutral-800">
          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isCameraActive ? 'bg-green-500 animate-pulse' : 'bg-redhat-red'
              }`}
            />
            <span className="font-bold text-[11px] uppercase tracking-wider">
              {isCameraActive ? 'Live Proctor' : 'Camera Off'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-neutral-400 font-mono">
              Snapshots: {snapshotCount}
            </span>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-neutral-400 hover:text-white p-0.5"
              title={isMinimized ? 'Expand Camera' : 'Minimize Camera'}
            >
              {isMinimized ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Video Box */}
        {!isMinimized && (
          <div className="relative w-44 sm:w-52 h-32 sm:h-38 bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
              style={{ transform: 'scaleX(-1)' }}
            />

            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-neutral-900/90 text-neutral-400">
                <Camera className="w-6 h-6 mb-1 text-redhat-red" />
                <span className="text-[10px]">Camera stream disabled or unavailable</span>
              </div>
            )}

            {/* Live Watermark on Video */}
            <div className="absolute top-1 left-1.5 text-[9px] font-mono text-white/80 bg-black/60 px-1 py-0.5 rounded-xs">
              {studentRollNo}
            </div>

            {/* Status Pill */}
            <div className="absolute bottom-1 right-1.5">
              {faceStatus === 'verified' && (
                <span className="inline-flex items-center text-[9px] bg-green-950/80 border border-green-600 text-green-400 px-1.5 py-0.5 rounded-xs font-semibold">
                  <ShieldCheck className="w-2.5 h-2.5 mr-1" /> Face OK
                </span>
              )}
              {faceStatus === 'low_light' && (
                <span className="inline-flex items-center text-[9px] bg-amber-950/80 border border-amber-600 text-amber-400 px-1.5 py-0.5 rounded-xs font-semibold">
                  <AlertCircle className="w-2.5 h-2.5 mr-1" /> Low Light
                </span>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" width="320" height="240" />
    </div>
  );
};
