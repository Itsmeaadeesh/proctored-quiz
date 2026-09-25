import React, { useState, useEffect } from 'react';

interface WatermarkOverlayProps {
  studentName: string;
  studentRollNo: string;
}

export const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({
  studentName,
  studentRollNo,
}) => {
  const [timeString, setTimeString] = useState(() =>
    new Date().toLocaleTimeString('en-US', { hour12: false })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeString(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const watermarkText = `GGITS • ${studentRollNo} • ${studentName} • ${timeString}`;

  return (
    <div
      className="pointer-events-none select-none fixed inset-0 z-30 overflow-hidden"
      aria-hidden="true"
    >
      <svg
        className="w-full h-full opacity-[0.065] text-redhat-red"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="watermark-pattern"
            width="380"
            height="220"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-25)"
          >
            <text
              x="20"
              y="60"
              className="font-mono text-sm font-black fill-current tracking-wider uppercase"
            >
              {watermarkText}
            </text>
            <text
              x="80"
              y="160"
              className="font-mono text-xs font-bold fill-current tracking-widest uppercase opacity-80"
            >
              RHA DAY 26 &bull; SECURE SESSION &bull; {studentRollNo}
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#watermark-pattern)" />
      </svg>
    </div>
  );
};
