// hooks/useSwipe.js
import { useCallback, useRef } from 'react';

export function useSwipeGesture({ onSwipeLeft, onSwipeRight, onSwipeUp, threshold = 80 }) {
  const startX = useRef(0);
  const startY = useRef(0);

  const handleTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDy > threshold && dy < 0 && absDy > absDx) {
      onSwipeUp?.();
    } else if (absDx > threshold) {
      dx > 0 ? onSwipeRight?.() : onSwipeLeft?.();
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, threshold]);

  return { handleTouchStart, handleTouchEnd };
}
