import { X } from 'lucide-react';
import { SearchInput } from '@/components/common/SearchInput';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FOLLOW_UP_FILTERS, LEAD_SOURCES } from '@/lib/constants';

export function LeadFilters({ filters, onChange, onClear, hasActiveFilters, isAdmin, members }) {
  return (
    <div className="flex flex-col gap-2 border-b p-3 md:flex-row md:items-center">
      <SearchInput
        value={filters.q}
        onChange={(q) => onChange({ q })}
        placeholder="Search name, phone or email"
        className="md:w-72"
      />
      <div className="grid grid-cols-2 gap-2 md:flex">
        <Select value={filters.followUp} onValueChange={(followUp) => onChange({ followUp })}>
          <SelectTrigger className="md:w-40" aria-label="Follow-up">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any follow-up</SelectItem>
            {FOLLOW_UP_FILTERS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.source} onValueChange={(source) => onChange({ source })}>
          <SelectTrigger className="md:w-40" aria-label="Source">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {LEAD_SOURCES.map((source) => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isAdmin && (
          <Select value={filters.assignedTo} onValueChange={(assignedTo) => onChange({ assignedTo })}>
            <SelectTrigger className="col-span-2 md:w-44" aria-label="Assigned to">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everyone</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {members.length > 0 && <SelectSeparator />}
              {members.map((member) => (
                <SelectItem key={member._id} value={member._id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="self-start md:ml-auto md:self-auto">
          <X />
          Clear filters
        </Button>
      )}
    </div>
  );
}
