import { useEffect, useRef, useState } from "react";

export function useCaptureCountdown(active: boolean, onComplete: () => void) {
  const [remaining, setRemaining] = useState(0);
  const complete = useRef(onComplete);

  useEffect(() => {
    complete.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!remaining || !active) return;
    const id = window.setTimeout(() => {
      setRemaining(remaining - 1);
      if (remaining === 1) complete.current();
    }, 1000);
    return () => window.clearTimeout(id);
  }, [remaining, active]);

  return { remaining, start: setRemaining, cancel: () => setRemaining(0) };
}
