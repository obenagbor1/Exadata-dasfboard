import { useEffect, useState, useRef } from 'react';

/**
 * Fetches data on mount and at a regular interval.
 * @param {Function} fetcher  async function returning the data
 * @param {number}   intervalMs  refresh interval; 0 disables auto-refresh
 */
export function usePolling(fetcher, intervalMs = 30000) {
  const [data, setData]   = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const result = await fetcherRef.current();
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    if (intervalMs > 0) {
      const id = setInterval(run, intervalMs);
      return () => { cancelled = true; clearInterval(id); };
    }
    return () => { cancelled = true; };
  }, [intervalMs]);

  return { data, error, loading };
}
