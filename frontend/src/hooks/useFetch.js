import { useState, useEffect, useRef, useCallback } from 'react';

//useFetch — reusable data-fetching hook with:

export function useFetch(fetchFn, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const abortRef = useRef(null);

  const run = useCallback(async () => {
    // Cancel any in-flight request from a previous render
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(abortRef.current.signal);
      setData(result?.data ?? result);
    } catch (err) {
      // AbortError is expected on cleanup — don't set error state
      if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
    return () => abortRef.current?.abort();
  }, [run]);

  return { data, loading, error, refetch: run };
}

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
