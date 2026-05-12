import { useState, useEffect } from 'react';

export function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (seconds <= 0) {
      setExpired(true);
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const reset = () => {
    setSeconds(initialSeconds);
    setExpired(false);
  };
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return { mm, ss, expired, reset };
}
