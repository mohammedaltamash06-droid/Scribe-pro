import { useEffect, useRef, useState } from "react";

/**
 * Smooth, fake-ish progress that never overshoots the next milestone.
 * We keep your legacy backend states (0,33,66,100) but animate within bands:
 *   0..32  -> can float up to 30
 *   33..65 -> can float up to 60
 *   66..99 -> can float up to 95
 *   100     -> snap to 100 and stop
 *
 * Nothing else changes. You still poll /status as before and pass that % in.
 */
export function useFauxSmoothProgress(
  backendProgress: number,
  opts?: {
    /** milliseconds between ticks */
    intervalMs?: number;
    /** how many percent to add per tick */
    step?: number;
    /** reset when this key changes (e.g., jobId) */
    resetKey?: string | number;
  }
) {
  const { intervalMs = 300, step = 1, resetKey } = opts || {};
  const [display, setDisplay] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  // Reset for a new job
  useEffect(() => {
    setDisplay(0);
  }, [resetKey]);

  // Compute a "soft ceiling" we are allowed to fake up to, per legacy band.
  const softCeiling = (p: number) => {
    if (p >= 100) return 100;
    if (p >= 66) return 95;  // in running stage, can float but not finish
    if (p >= 33) return 60;  // after upload
    return 30;               // created/starting
  };

  // Always honor backend floor (never show less than it reports)
  useEffect(() => {
    setDisplay(prev => Math.max(prev, Math.min(backendProgress, 100)));
  }, [backendProgress]);

  // Smoothly climb toward the current ceiling; never exceed it.
  useEffect(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (backendProgress >= 100) {
      setDisplay(100);
      return; // finished—no animation
    }

    timerRef.current = window.setInterval(() => {
      setDisplay(prev => {
        const ceiling = softCeiling(backendProgress);
        if (prev < ceiling) {
          return Math.min(prev + step, ceiling);
        }
        // If backend jumps forward (e.g., 33 -> 66), we'll bump via the floor effect above.
        return prev;
      });
    }, intervalMs) as unknown as number;

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [backendProgress, intervalMs, step]);

  return display;
}

export default useFauxSmoothProgress;
