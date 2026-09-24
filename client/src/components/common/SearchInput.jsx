import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

/** Search box that reports its value after the user pauses typing. */
export function SearchInput({ value, onChange, placeholder = 'Search', className }) {
  const [text, setText] = useState(value ?? '');
  const debounced = useDebounce(text);

  // Follow external changes (e.g. "Clear filters").
  useEffect(() => setText(value ?? ''), [value]);

  useEffect(() => {
    if (debounced !== (value ?? '')) onChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        className="pr-8 pl-9 [&::-webkit-search-cancel-button]:hidden"
        aria-label={placeholder}
      />
      {text && (
        <button
          type="button"
          onClick={() => setText('')}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
