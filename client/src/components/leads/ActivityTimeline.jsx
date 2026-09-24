import {
  ArrowRightLeft,
  CalendarClock,
  Handshake,
  Pencil,
  Sparkles,
  StickyNote,
  Undo2,
  UserPlus,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDateTime, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';

const TYPES = {
  created: { icon: Sparkles, tone: 'bg-muted text-muted-foreground' },
  updated: { icon: Pencil, tone: 'bg-muted text-muted-foreground' },
  note: { icon: StickyNote, tone: 'bg-accent text-accent-foreground' },
  stage_change: { icon: ArrowRightLeft, tone: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' },
  assignment: { icon: UserPlus, tone: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' },
  booking: { icon: Handshake, tone: 'bg-available-soft text-available' },
  booking_cancelled: { icon: Undo2, tone: 'bg-booked-soft text-booked' },
};

export function ActivityTimeline({ activities }) {
  if (!activities.length) {
    return <EmptyState title="No activity yet" description="Notes, stage changes and bookings will show up here." />;
  }

  return (
    <ol className="relative">
      <AnimatePresence initial={false}>
        {activities.map((activity, index) => {
          const { icon: Icon, tone } = TYPES[activity.type] ?? TYPES.updated;
          const isNote = activity.type === 'note';
          return (
            <motion.li
              key={activity._id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative flex gap-3 pb-5 last:pb-0"
            >
              {index < activities.length - 1 && <span className="absolute top-8 bottom-0 left-[15px] w-px bg-border" aria-hidden />}
              <span className={cn('relative flex size-8 shrink-0 items-center justify-center rounded-full', tone)}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <p className={cn('text-sm break-words whitespace-pre-line', isNote ? 'text-foreground' : 'text-foreground/90')}>
                  {activity.message}
                </p>
                {activity.meta?.nextFollowUpAt && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarClock className="size-3.5" />
                    Next follow-up {formatDateTime(activity.meta.nextFollowUpAt)}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {activity.createdBy?.name ?? 'System'}, <time dateTime={activity.createdAt} title={formatDateTime(activity.createdAt)}>{timeAgo(activity.createdAt)}</time>
                </p>
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ol>
  );
}
