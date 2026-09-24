import { Skeleton } from '@/components/ui/skeleton';

export function TableSkeleton({ rows = 6, columns = 5 }) {
  return (
    <div className="divide-y" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex items-center gap-4 px-3 py-3.5">
          {Array.from({ length: columns }).map((__, col) => (
            <Skeleton key={col} className={col === 0 ? 'h-4 w-40' : 'hidden h-4 flex-1 sm:block'} />
          ))}
        </div>
      ))}
    </div>
  );
}
