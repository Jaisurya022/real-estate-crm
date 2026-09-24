import { describeFollowUp } from '@/lib/format';
import { cn } from '@/lib/utils';

const TONES = {
  overdue: 'text-destructive font-medium',
  today: 'text-warning font-medium',
  upcoming: 'text-foreground',
};

export function FollowUpLabel({ date, className, emptyLabel = 'Not scheduled' }) {
  const followUp = describeFollowUp(date);
  if (!followUp) return <span className={cn('text-muted-foreground', className)}>{emptyLabel}</span>;
  return <span className={cn(TONES[followUp.tone], className)}>{followUp.label}</span>;
}
