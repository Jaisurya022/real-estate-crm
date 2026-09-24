import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async fetcher whenever `deps` change and tracks loading/error.
 * Previous data is kept while refetching so tables don't flash empty.
 *
 *   const { data, loading, error, reload } = useFetch((signal) => leadsService.list(params, signal), [params]);
 */
export function useFetch(fetcher, deps = [], { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [reloadKey, setReloadKey] = useState(0);

  // Always call the latest fetcher without re-running the effect for new function identities.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) return undefined;

    const controller = new AbortController();
    let active = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetcherRef.current(controller.signal);
        if (active) setData(result);
      } catch (err) {
        if (active && err.name !== 'AbortError') setError(err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey, enabled]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { data, error, loading, reload, setData };
}
