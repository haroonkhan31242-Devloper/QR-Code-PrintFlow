import { useCallback, useEffect, useRef, useState } from 'react';
import { onDbChange, toServiceError, type ServiceError } from '../services';

/**
 * Loads data from a service function with loading / error state and a reload function.
 * `key` identifies what is loaded (when it changes, data is loaded again; null skips loading).
 * Data refreshes by itself when the stored data changes, in this tab or another tab.
 */
export function useQuery<T>(key: string | null, loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ServiceError | null>(null);
  const [loading, setLoading] = useState(key !== null);
  const seq = useRef(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const load = useCallback(
    async (silent = false) => {
      if (key === null) return;
      const id = ++seq.current;
      if (!silent) setLoading(true);
      try {
        const result = await loaderRef.current();
        if (id === seq.current) {
          setData(result);
          setError(null);
        }
      } catch (e) {
        if (id === seq.current) setError(toServiceError(e));
      } finally {
        if (id === seq.current) setLoading(false);
      }
    },
    [key],
  );

  useEffect(() => {
    load();
    return onDbChange(() => load(true));
  }, [load]);

  return { data, setData, error, loading, reload: load };
}

/** Re-runs a callback on an interval while the tab is visible. */
export function usePolling(fn: () => void, ms: number) {
  const saved = useRef(fn);
  saved.current = fn;
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') saved.current();
    }, ms);
    return () => clearInterval(id);
  }, [ms]);
}
