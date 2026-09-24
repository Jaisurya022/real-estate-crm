import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';

/**
 * Keeps list filters in the URL (?stage=Contacted&page=2) so views are
 * shareable, survive refresh and work with the back button.
 * All values are strings. Changing any filter except `page` resets to page 1.
 */
export function useUrlFilters(defaults) {
  const router = useRouter();

  const filters = useMemo(() => {
    const current = { ...defaults };
    for (const key of Object.keys(defaults)) {
      const value = router.query[key];
      if (typeof value === 'string' && value !== '') current[key] = value;
    }
    return current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query]);

  const setFilters = useCallback(
    (patch) => {
      const next = { ...filters, ...patch };
      if (!('page' in patch) && 'page' in defaults) next.page = defaults.page;

      // Keep dynamic route params like [projectId]; drop filters equal to their default.
      const routeParams = Object.fromEntries(
        Object.entries(router.query).filter(([key]) => router.pathname.includes(`[${key}]`)),
      );
      const query = Object.fromEntries(
        Object.entries(next).filter(([key, value]) => value !== '' && value !== defaults[key]),
      );

      router.replace({ pathname: router.pathname, query: { ...routeParams, ...query } }, undefined, {
        shallow: true,
        scroll: false,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, router],
  );

  const hasActiveFilters = Object.keys(defaults).some((key) => key !== 'page' && filters[key] !== defaults[key]);

  return { filters, setFilters, ready: router.isReady, hasActiveFilters };
}
