import { motion } from 'motion/react';
import { PIPELINE_STAGES } from '@/lib/constants';
import { cn } from '@/lib/utils';

/**
 * The five working stages as a progress bar. Click a stage to move the lead.
 * Booked (set by a booking) fills every step; Lost empties them.
 * New can't be picked again once the lead has moved on.
 */
export function StageStepper({ stage, onSelect, disabled, pendingStage }) {
  const currentIndex = PIPELINE_STAGES.indexOf(stage);
  const booked = stage === 'Booked';

  return (
    <ol className="grid grid-cols-5 gap-1.5" aria-label="Lead stage">
      {PIPELINE_STAGES.map((step, index) => {
        const reached = booked || (currentIndex >= 0 && index <= currentIndex);
        const isCurrent = step === stage;
        const isPending = step === pendingStage;
        // "New" means untouched, so a lead can't be moved back to it.
        const locked = step === 'New' && !isCurrent;
        return (
          <li key={step}>
            <button
              type="button"
              onClick={() => onSelect(step)}
              disabled={disabled || isCurrent || locked}
              title={locked ? "A lead can't go back to New once it has been worked on" : undefined}
              aria-current={isCurrent ? 'step' : undefined}
              className="group w-full rounded-md pt-1 pb-1.5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-default"
            >
              <span className="block h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.span
                  className={cn('block h-full origin-left rounded-full', booked ? 'bg-available' : 'bg-primary', isPending && 'animate-pulse')}
                  initial={false}
                  animate={{ scaleX: reached || isPending ? 1 : 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 30, delay: reached ? index * 0.04 : 0 }}
                />
              </span>
              <span
                className={cn(
                  'mt-2 block truncate text-xs',
                  isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground',
                  !disabled && !isCurrent && !locked && 'group-hover:text-foreground',
                )}
              >
                {step}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
