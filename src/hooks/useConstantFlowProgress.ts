import { useEffect, useRef, useState } from "react";

/**
 * Constant-flow progress that:
 * - Moves smoothly inside each legacy band (0→33, 33→66, 66→100)
 * - Caps at soft ceilings (30, 60, 95) so it never fakes completion
 * - Immediately respects backend jumps (floor = backendProgress)
 * - Eases to 100% only when backend says done
 *
 * No backend changes required.
 */
type JobStatus = "created" | "uploaded" | "running" | "done" | "error" | string;

function bandCeiling(p: number) {
  if (p >= 100) return 100;
  if (p >= 66) return 95;  // running band
  if (p >= 33) return 60;  // uploaded band
  return 30;               // created/ready band
}

export default function useConstantFlowProgress(
  backendProgress: number,      // 0/33/66/100 or a numeric progress if you have it
  status: JobStatus,            // backend status string
  opts?: {
    resetKey?: string | number; // e.g. jobId
    // approx % per second the bar should visually advance *within the band*
    speedPerSecond?: number;    // default 10%/s (tweak if you want slower/faster)
    // ms to ease from current value to 100 when status becomes 'done'
    finishEaseMs?: number;      // default 400ms
  }
) {
  const { resetKey, speedPerSecond = 10, finishEaseMs = 400 } = opts || {};

  const [display, setDisplay] = useState(0);

  // Internal "phantom" target that increases inside the band to create constant flow
  const phantomTargetRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  // Reset on new job
  useEffect(() => {
    setDisplay(0);
    phantomTargetRef.current = 0;
    lastTsRef.current = null;
  }, [resetKey]);

  // Always honor backend as a *floor* (never show less than backend)
  useEffect(() => {
    setDisplay(prev => Math.max(prev, Math.min(100, backendProgress)));
    phantomTargetRef.current = Math.max(phantomTargetRef.current, backendProgress);
  }, [backendProgress]);

  // RAF loop for constant flow within current band
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    lastTsRef.current = null;

    const loop = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000; // seconds
      lastTsRef.current = ts;

      // If backend is done, we ease to 100 and stop.
      if (status === "done" || backendProgress >= 100) {
        const start = display;
        const duration = finishEaseMs;
        const t0 = performance.now();
        const ease = () => {
          const t = performance.now() - t0;
          const k = Math.min(1, t / duration);
          // easeOutCubic
          const val = start + (100 - start) * (1 - Math.pow(1 - k, 3));
          setDisplay(val);
          if (k < 1) rafRef.current = requestAnimationFrame(ease);
        };
        rafRef.current = requestAnimationFrame(ease);
        return;
      }

      // Target can grow inside the band, but never exceed ceiling
      const ceiling = bandCeiling(backendProgress);
      const inc = speedPerSecond * dt;
      phantomTargetRef.current = Math.min(
        ceiling,
        phantomTargetRef.current + inc
      );

      // Visual value chases max(backendProgress, phantomTarget)
      const target = Math.max(backendProgress, phantomTargetRef.current);
      setDisplay(prev => (prev < target ? Math.min(prev + inc * 0.85, target) : prev));

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, backendProgress, speedPerSecond, finishEaseMs]);

  return display;
}
