import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from './api';

/** Loads JSON from a GET endpoint with loading / error state and a reload function. */
export function useApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  const seq = useRef(0);

  const load = useCallback(
    async (silent = false) => {
      if (!url) return;
      const id = ++seq.current;
      if (!silent) setLoading(true);
      try {
        const result = await api.get<T>(url);
        if (id === seq.current) {
          setData(result);
          setError(null);
        }
      } catch (e) {
        if (id === seq.current) setError(e instanceof ApiError ? e : new ApiError(0, String(e)));
      } finally {
        if (id === seq.current) setLoading(false);
      }
    },
    [url],
  );

  useEffect(() => {
    load();
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
