/**
 * Performance optimization utilities
 * For smooth map rendering and reduced re-renders
 */

/**
 * Throttle function to limit how often a function can be called
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * Debounce function to delay execution until after wait time
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func.apply(this, args);
      timeout = null;
    }, wait);
  };
}

/**
 * Suppress console warnings for MapLibre canceled requests
 * These are normal during pan/zoom operations
 */
export const suppressMapLibreWarnings = () => {
  if (__DEV__) {
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalLog = console.log;

    const shouldSuppress = (message: string): boolean => {
      return (
        message.includes('Request failed due to a permanent error: Canceled') ||
        message.includes('stream was reset: CANCEL') ||
        message.includes('Mbgl-HttpRequest')
      );
    };

    console.warn = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      if (!shouldSuppress(message)) {
        originalWarn.apply(console, args);
      }
    };

    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      if (!shouldSuppress(message)) {
        originalError.apply(console, args);
      }
    };

    console.log = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      if (!shouldSuppress(message)) {
        originalLog.apply(console, args);
      }
    };
  }
};

