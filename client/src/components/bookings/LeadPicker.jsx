import { Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { StageBadge } from '@/components/leads/StageBadge';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { useFetch } from '@/hooks/useFetch';
import { formatPhone } from '@/lib/format';
import { leadsService } from '@/services/leads.service';

/** Search-and-pick for a lead. Lost leads are hidden because they can't be booked. */
export function LeadPicker({ value, onChange, invalid }) {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 250);

  const { data, loading } = useFetch((signal) => leadsService.list({ q: debounced, limit: 8 }, signal), [debounced], {
    enabled: !value,
  });
  const options = (data?.items ?? []).filter((lead) => lead.stage !== 'Lost');

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/40 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{value.name}</p>
          <p className="text-xs text-muted-foreground tabular-nums">{formatPhone(value.phone)}</p>
        </div>
        <button type="button" onClick={() => onChange(null)} className="rounded p-1 text-muted-foreground hover:text-foreground" aria-label="Change lead">
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <div className="relative">
        <Input
          id="booking-lead"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or phone"
          autoComplete="off"
          aria-invalid={invalid || undefined}
        />
        {loading && <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>
      <ul className="max-h-48 divide-y overflow-y-auto rounded-md border" role="listbox" aria-label="Leads">
        {options.length === 0 && !loading && <li className="px-3 py-3 text-sm text-muted-foreground">No matching open leads.</li>}
        {options.map((lead) => (
          <li key={lead._id}>
            <button
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => onChange(lead)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-muted"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{lead.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatPhone(lead.phone)}
                  {!lead.assignedTo && <span className="text-warning"> · Unassigned</span>}
                </span>
              </span>
              <StageBadge stage={lead.stage} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
