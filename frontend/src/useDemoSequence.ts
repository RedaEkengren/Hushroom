import { useCallback, useEffect, useRef, useState } from 'react';
import { advance } from './demo-data';

// Drives the two landing-page product animations.
//
// Three rules, all of them load-bearing:
//   1. prefers-reduced-motion: no timer is ever created and the component
//      renders its static frame instead. The prerender step runs chromium with
//      reducedMotion: 'reduce', so that static frame is also what gets baked
//      into dist/<route>/index.html and what a crawler sees.
//   2. Off-screen or backgrounded: the interval is torn down, not just ignored.
//      An animation in a tab nobody is looking at is pure battery.
//   3. Unmount: every timer and listener is removed. No stray setInterval.

function readsReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Live-updating prefers-reduced-motion, so toggling it in the OS takes effect at once. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(readsReducedMotion);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    let query: MediaQueryList;
    try {
      query = window.matchMedia('(prefers-reduced-motion: reduce)');
    } catch {
      return;
    }
    const onChange = () => setReduced(query.matches);
    setReduced(query.matches);
    // Safari below 14 only has the deprecated listener API.
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    }
    query.addListener(onChange);
    return () => query.removeListener(onChange);
  }, []);

  return reduced;
}

export interface DemoSequence<T extends HTMLElement = HTMLDivElement> {
  /** Attach to the element whose visibility gates the animation. */
  ref: React.RefObject<T>;
  /** Current step. Meaningless when isStatic is true: render the static frame instead. */
  step: number;
  /** True when the component must not animate at all. */
  isStatic: boolean;
  /** True while a timer is actually running. Child effects should gate on this. */
  running: boolean;
}

export function useDemoSequence<T extends HTMLElement = HTMLDivElement>(
  stepCount: number,
  intervalMs: number,
): DemoSequence<T> {
  const ref = useRef<T>(null);
  const isStatic = usePrefersReducedMotion();
  const [onScreen, setOnScreen] = useState(false);
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === 'undefined' || !document.hidden,
  );
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isStatic) return;
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver !== 'function') {
      // jsdom and anything else without the API: assume visible rather than
      // silently freeze the animation.
      setOnScreen(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => setOnScreen(entries.some((entry) => entry.isIntersecting)),
      { rootMargin: '0px 0px -10% 0px', threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isStatic]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onChange = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  const running = !isStatic && onScreen && pageVisible && stepCount > 0;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setStep((current) => advance(current, stepCount)), intervalMs);
    return () => window.clearInterval(timer);
  }, [running, stepCount, intervalMs]);

  return { ref, step, isStatic, running };
}

/**
 * Character-by-character reveal. Text content changes rather than an animated
 * width, so nothing is laid out that was not going to be laid out anyway, and
 * the caret blink is an opacity keyframe.
 */
export function useTypewriter(text: string, active: boolean, charMs = 38): string {
  const [count, setCount] = useState(0);
  const reset = useCallback(() => setCount(0), []);

  useEffect(() => {
    reset();
  }, [text, reset]);

  useEffect(() => {
    if (!active) return;
    setCount(0);
    const timer = window.setInterval(() => {
      setCount((current) => {
        if (current >= text.length) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, charMs);
    return () => window.clearInterval(timer);
  }, [active, text, charMs]);

  return active ? text.slice(0, count) : text;
}
