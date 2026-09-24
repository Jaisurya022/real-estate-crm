import { motion } from 'motion/react';
import { UNIT_STATUS } from '@/lib/constants';
import { formatINRCompact } from '@/lib/format';
import { cn } from '@/lib/utils';

const CELL = {
  available: 'bg-available-soft text-available border-available/40 hover:border-available',
  booked: 'bg-booked-soft text-booked border-booked/40 hover:border-booked',
  blocked:
    'text-blocked border-blocked/30 hover:border-blocked bg-[repeating-linear-gradient(135deg,var(--blocked-soft)_0_6px,transparent_6px_10px)]',
};

const floorName = (floor) => (floor === 0 ? 'G' : String(floor));

/**
 * A building elevation: floors stacked top to bottom, every unit a cell
 * coloured by status, just like the availability charts on a sales-office wall.
 * Units that don't match `highlight` (e.g. a unit type) are faded, not hidden,
 * so the building keeps its shape.
 */
export function InventoryChart({ building, units, highlight, onSelectUnit }) {
  const floors = new Map();
  for (const unit of units) {
    if (!floors.has(unit.floor)) floors.set(unit.floor, []);
    floors.get(unit.floor).push(unit);
  }
  const rows = [...floors.entries()]
    .sort(([a], [b]) => b - a)
    .map(([floor, list]) => [floor, list.sort((a, b) => a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true }))]);

  return (
    <div className="overflow-x-auto pb-2">
      <motion.div
        key={building._id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="inline-block min-w-full"
      >
        <div className="mx-auto w-fit">
          {/* Roof */}
          <div className="ml-10 flex items-end justify-between border-b-2 border-foreground/70 px-1 pb-1.5">
            <span className="font-display text-sm font-semibold">{building.name}</span>
            <span className="text-xs text-muted-foreground">{building.totalFloors} floors</span>
          </div>

          <div className="grid gap-1.5 pt-2">
            {rows.map(([floor, list]) => (
              <div key={floor} className="flex items-center gap-1.5">
                <span className="w-8 shrink-0 pr-1 text-right text-xs text-muted-foreground tabular-nums">{floorName(floor)}</span>
                <div className="flex gap-1.5">
                  {list.map((unit) => {
                    const dimmed = highlight && !highlight(unit);
                    return (
                      <button
                        key={unit._id}
                        type="button"
                        onClick={() => onSelectUnit(unit)}
                        // Colour alone can't carry status for screen-reader users.
                        aria-label={`Unit ${unit.unitNumber}, ${unit.type}, ${formatINRCompact(unit.price)}, ${UNIT_STATUS[unit.status].label}`}
                        className={cn(
                          'flex h-14 w-[5.25rem] flex-col justify-between rounded-[4px] border px-2 py-1.5 text-left whitespace-nowrap transition-[opacity,border-color,transform] outline-none hover:-translate-y-px focus-visible:ring-[3px] focus-visible:ring-ring/50',
                          CELL[unit.status],
                          dimmed && 'opacity-25',
                        )}
                      >
                        <span className="flex items-baseline justify-between gap-1">
                          <span className="text-[13px] leading-none font-semibold tabular-nums">{unit.unitNumber}</span>
                          <span className="text-[10px] leading-none text-foreground/60">{unit.type}</span>
                        </span>
                        <span className="text-[11px] leading-none text-foreground/75 tabular-nums">{formatINRCompact(unit.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Ground */}
          <div className="mt-2 ml-10 h-1.5 rounded-sm bg-[repeating-linear-gradient(90deg,var(--border)_0_8px,transparent_8px_12px)]" />
        </div>
      </motion.div>
    </div>
  );
}
