import { STAGE_STYLES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function StageBadge({ stage, className }) {
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', STAGE_STYLES[stage], className)}>
      {stage}
    </span>
  );
}
