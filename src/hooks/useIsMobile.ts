import { useState, useEffect } from 'react';

/**
 * Custom hook to detect mobile screen width (< 768px).
 * Listens to window resize and matchMedia for real-time responsiveness.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    const updateMatches = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    // Initial check
    setIsMobile(mediaQuery.matches);

    // Modern and fallback listeners
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMatches);
      return () => mediaQuery.removeEventListener('change', updateMatches);
    } else {
      // Legacy browsers fallback
      mediaQuery.addListener(updateMatches);
      return () => mediaQuery.removeListener(updateMatches);
    }
  }, [breakpoint]);

  return isMobile;
}
