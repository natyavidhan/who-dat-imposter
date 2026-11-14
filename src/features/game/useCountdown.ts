import { useEffect, useState } from 'react';

import { haptic } from '@/lib/haptics';

/**
 * Wall-clock countdown that survives the app being backgrounded: each tick
 * subtracts however many whole seconds really passed.
 */
export function useCountdown(totalSeconds: number) {
  const [left, setLeft] = useState(totalSeconds);
  const [running, setRunning] = useState(totalSeconds > 0);
  const finished = totalSeconds > 0 && left === 0;
  const ticking = running && left > 0;

  useEffect(() => {
    if (!ticking) return;
    let last = Date.now();
    const id = setInterval(() => {
      const steps = Math.floor((Date.now() - last) / 1000);
      if (steps <= 0) return;
      last += steps * 1000;
      setLeft((value) => Math.max(0, value - steps));
    }, 200);
    return () => clearInterval(id);
  }, [ticking]);

  useEffect(() => {
    if (finished) haptic.warning();
  }, [finished]);

  return {
    left,
    total: totalSeconds,
    running: ticking,
    finished,
    pause: () => setRunning(false),
    resume: () => setRunning(true),
    addTime: (seconds: number) => {
      setLeft((value) => value + seconds);
      setRunning(true);
    },
  };
}

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
