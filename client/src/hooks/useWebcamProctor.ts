import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';

interface UseWebcamProctorOptions {
  submissionId: string | null;
  userId: string | null;
  isActive: boolean;
  intervalSeconds?: number;
}

export function useWebcamProctor({
  submissionId,
  userId,
  isActive,
  intervalSeconds = 25,
}: UseWebcamProctorOptions) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [snapshotCount, setSnapshotCount] = useState(0);
  const [faceStatus, setFaceStatus] = useState<'verified' | 'low_light' | 'no_face' | 'unsupported'>('verified');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize Camera
  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasPermission(false);
        setFaceStatus('unsupported');
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      setHasPermission(true);
      setIsCameraActive(true);
      return true;
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setHasPermission(false);
      setIsCameraActive(false);
      return false;
    }
  }, []);

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Capture single frame
  const captureSnapshot = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Basic pixel luminance analysis for lighting / face presence
    const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = frameData.data;
    let totalLuminance = 0;

    for (let i = 0; i < pixels.length; i += 16) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b;
    }
    const sampleCount = pixels.length / 16;
    const avgBrightness = totalLuminance / sampleCount;

    let flag: 'normal' | 'no_face' | 'multiple_faces' | 'low_light' = 'normal';

    if (avgBrightness < 20) {
      flag = 'low_light';
      setFaceStatus('low_light');
    } else {
      flag = 'normal';
      setFaceStatus('verified');
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.5);

    // Send to backend if active submission
    if (submissionId && userId) {
      try {
        await api.recordSnapshot(submissionId, userId, dataUrl, flag);
        setSnapshotCount((prev) => prev + 1);
      } catch (err) {
        console.error('Failed to upload proctor snapshot:', err);
      }
    }

    return dataUrl;
  }, [submissionId, userId]);

  // Hook lifecycle
  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, startCamera, stopCamera]);

  // Schedule periodic snapshots
  useEffect(() => {
    if (!isActive || !isCameraActive) return;

    // Initial snapshot after 3 seconds
    const initialTimeout = setTimeout(() => {
      captureSnapshot();
    }, 3000);

    timerRef.current = setInterval(() => {
      captureSnapshot();
    }, intervalSeconds * 1000);

    return () => {
      clearTimeout(initialTimeout);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isCameraActive, intervalSeconds, captureSnapshot]);

  return {
    videoRef,
    canvasRef,
    hasPermission,
    isCameraActive,
    snapshotCount,
    faceStatus,
    startCamera,
    stopCamera,
    captureSnapshot,
  };
}
