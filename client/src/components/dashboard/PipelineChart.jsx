import { motion } from 'motion/react';
import Link from 'next/link';
import { Panel } from '@/components/common/Panel';
import { STAGE_BAR } from '@/lib/constants';

/** Leads per stage as horizontal bars. Each row opens the leads list filtered to that stage. */
export function PipelineChart({ pipeline, leadsPath }) {
  const max = Math.max(1, ...pipeline.map((row) => row.count));

  return (
    <Panel title="Pipeline" description="Leads in each stage">
      <ul className="grid gap-2.5">
        {pipeline.map((row, index) => (
          <li key={row.stage}>
            <Link
              href={`${leadsPath}?stage=${encodeURIComponent(row.stage)}`}
              className="group grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-3 rounded-md text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              <span className="truncate text-muted-foreground group-hover:text-foreground">{row.stage}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-muted">
                <motion.span
                  className={`block h-full rounded-full ${STAGE_BAR[row.stage]}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(row.count / max) * 100}%` }}
                  transition={{ delay: 0.15 + index * 0.06, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
              <span className="text-right font-medium tabular-nums">{row.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
