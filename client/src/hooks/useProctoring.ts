import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { ViolationType } from '../types/quiz';

interface UseProctoringOptions {
  submissionId: string | null;
  userId: string | null;
  maxViolations?: number;
  isActive: boolean;
  onDisqualify?: (reason: string) => void;
}

export function useProctoring({
  submissionId,
  userId,
  maxViolations = 3,
  isActive,
  onDisqualify,
}: UseProctoringOptions) {
  const [violationsCount, setViolationsCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const [showBlackoutAlert, setShowBlackoutAlert] = useState(false);
  const [blackoutReason, setBlackoutReason] = useState('Screenshot attempt detected');
  const [recentWarning, setRecentWarning] = useState<string | null>(null);

  const blackoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper to show transient banner warning
  const triggerWarning = (msg: string) => {
    setRecentWarning(msg);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningTimerRef.current = setTimeout(() => {
      setRecentWarning(null);
    }, 4000);
  };

  // Log violation to backend
  const logViolation = useCallback(
    async (type: ViolationType, meta: Record<string, any> = {}) => {
      if (!submissionId || !userId || !isActive) return;

      try {
        const res = await api.recordViolation(submissionId, userId, type, meta);
        setViolationsCount(res.violationsCount);

        if (res.isDisqualified && onDisqualify) {
          onDisqualify(
            res.reason ||
              `Maximum violation threshold (${maxViolations}) reached. Quiz auto-submitted.`
          );
        }
      } catch (err) {
        console.error('Failed to log violation incident:', err);
      }
    },
    [submissionId, userId, isActive, maxViolations, onDisqualify]
  );

  // Trigger immediate blackout on screenshot or illicit keystroke
  const triggerBlackout = useCallback(
    (reason: string, violationType: ViolationType = 'PRINT_SCREEN') => {
      setBlackoutReason(reason);
      setShowBlackoutAlert(true);
      logViolation(violationType, { reason });

      if (blackoutTimerRef.current) clearTimeout(blackoutTimerRef.current);
      blackoutTimerRef.current = setTimeout(() => {
        setShowBlackoutAlert(false);
      }, 3200);
    },
    [logViolation]
  );

  // 1. Fullscreen request & enforcement
  const requestFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
      setShowFullscreenModal(false);
    } catch (err) {
      console.warn('Fullscreen request denied by user or browser:', err);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = Boolean(
        document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).msFullscreenElement
      );

      setIsFullscreen(isCurrentlyFullscreen);

      if (!isCurrentlyFullscreen) {
        setShowFullscreenModal(true);
        logViolation('FULLSCREEN_EXIT', { action: 'Exited fullscreen mode' });
        triggerWarning('Fullscreen exited! Re-enter fullscreen immediately.');
      } else {
        setShowFullscreenModal(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [isActive, logViolation]);

  // 2. Tab-switch & Window-blur detection
  useEffect(() => {
    if (!isActive) return;

    let blurTimestamp: number | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation('TAB_SWITCH', {
          action: 'Browser tab switched or window minimized',
          timestamp: new Date().toISOString(),
        });
        triggerWarning('Tab switch detected! Tab switching is logged.');
      }
    };

    const handleBlur = () => {
      blurTimestamp = Date.now();
      logViolation('WINDOW_BLUR', {
        action: 'Window lost focus',
      });
      triggerWarning('Window focus lost! Please keep focus on the exam.');
    };

    const handleFocus = () => {
      if (blurTimestamp) {
        const awaySeconds = Math.round((Date.now() - blurTimestamp) / 1000);
        blurTimestamp = null;
        if (awaySeconds > 1) {
          triggerWarning(`Returned to exam after ${awaySeconds}s focus loss.`);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isActive, logViolation]);

  // 3. Keystroke locks, PrintScreen blackout & DevTools blocking
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        e.preventDefault();
        triggerBlackout('Screenshot attempt detected (PrintScreen pressed)', 'PRINT_SCREEN');
        return;
      }

      // DevTools & source inspection shortcuts
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        logViolation('DEVTOOLS_SHORTCUT', { key: 'F12' });
        triggerWarning('Developer Tools access is strictly disabled.');
        return;
      }

      // Ctrl+Shift+I / J / C (Devtools inspector)
      if (isCtrlOrMeta && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        triggerBlackout('Developer Inspection shortcut blocked', 'DEVTOOLS_SHORTCUT');
        return;
      }

      // Ctrl+U (View source)
      if (isCtrlOrMeta && key === 'u') {
        e.preventDefault();
        e.stopPropagation();
        logViolation('DEVTOOLS_SHORTCUT', { key: 'Ctrl+U' });
        triggerWarning('View Source is blocked.');
        return;
      }

      // Ctrl+S (Save page)
      if (isCtrlOrMeta && key === 's') {
        e.preventDefault();
        e.stopPropagation();
        triggerWarning('Saving page is blocked.');
        return;
      }

      // Ctrl+P (Print page)
      if (isCtrlOrMeta && key === 'p') {
        e.preventDefault();
        e.stopPropagation();
        triggerBlackout('Print page shortcut blocked', 'PRINT_SCREEN');
        return;
      }

      // Copy / Cut / Paste shortcuts
      if (isCtrlOrMeta && (key === 'c' || key === 'v' || key === 'x')) {
        e.preventDefault();
        e.stopPropagation();
        const actionType =
          key === 'c'
            ? 'CLIPBOARD_COPY'
            : key === 'x'
            ? 'CLIPBOARD_CUT'
            : 'CLIPBOARD_PASTE';
        logViolation(actionType, { shortcut: `Ctrl+${key.toUpperCase()}` });
        triggerWarning(`Clipboard actions (Ctrl+${key.toUpperCase()}) are blocked.`);
        return;
      }

      // Zooming shortcuts: Ctrl + (+, -, 0)
      if (isCtrlOrMeta && (key === '=' || key === '+' || key === '-' || key === '0')) {
        e.preventDefault();
        e.stopPropagation();
        logViolation('ZOOM_ATTEMPT', { key });
        triggerWarning('Browser zoom adjustments are disabled.');
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        e.preventDefault();
        triggerBlackout('Screenshot attempt detected', 'PRINT_SCREEN');
      }
    };

    // Wheel zoom with Ctrl
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        logViolation('ZOOM_ATTEMPT', { action: 'Pinch/Wheel Zoom' });
        triggerWarning('Zooming is disabled.');
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [isActive, logViolation, triggerBlackout]);

  // 4. Right-Click, Copy, Cut, Paste, Selection Locks
  useEffect(() => {
    if (!isActive) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logViolation('CONTEXT_MENU', { x: e.clientX, y: e.clientY });
      triggerWarning('Right-click context menu is disabled.');
      return false;
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      logViolation('CLIPBOARD_COPY');
      triggerWarning('Copying text is blocked.');
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      logViolation('CLIPBOARD_CUT');
      triggerWarning('Cutting text is blocked.');
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      logViolation('CLIPBOARD_PASTE');
      triggerWarning('Pasting content is blocked.');
    };

    const handleSelectStart = (e: Event) => {
      // Allow select in form inputs if needed, or disable globally
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return; // Allow typing in input
      }
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('selectstart', handleSelectStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('selectstart', handleSelectStart);
      if (blackoutTimerRef.current) clearTimeout(blackoutTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [isActive, logViolation]);

  return {
    violationsCount,
    isFullscreen,
    showFullscreenModal,
    showBlackoutAlert,
    blackoutReason,
    recentWarning,
    requestFullscreen,
    triggerBlackout,
  };
}
