"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useCountdownTimer(
  durationSeconds: number,
  isRunning: boolean,
  onComplete: () => void
) {
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  const remainingRef = useRef(durationSeconds);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    remainingRef.current = durationSeconds;
    setRemainingSeconds(durationSeconds);
  }, [durationSeconds]);

  const reset = useCallback(() => {
    remainingRef.current = durationSeconds;
    setRemainingSeconds(durationSeconds);
  }, [durationSeconds]);

  useEffect(() => {
    if (!isRunning) return;

    let completed = false;
    const interval = setInterval(() => {
      const nextSeconds = Math.max(remainingRef.current - 1, 0);
      remainingRef.current = nextSeconds;
      setRemainingSeconds(nextSeconds);

      if (nextSeconds === 0 && !completed) {
        completed = true;
        clearInterval(interval);
        onCompleteRef.current();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  return { remainingSeconds, reset };
}
