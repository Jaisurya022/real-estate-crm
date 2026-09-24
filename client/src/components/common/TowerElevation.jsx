import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

// A fixed, hand-picked pattern so the illustration looks the same on every load.
// a = available, b = booked, x = blocked
const TOWERS = [
  ['aaba', 'abaa', 'aaab', 'baaa', 'aaba', 'abba', 'aaaa', 'baab', 'abaa', 'aabb'],
  ['abaaa', 'aabaa', 'baaab', 'aaxaa', 'abaab', 'aaaba', 'baaaa', 'aabba', 'abaaa', 'aaaab', 'baaba', 'aabaa', 'abbaa'],
];

const FILL = { a: 'fill-[#4cc38a]', b: 'fill-[#ef8199]', x: 'fill-[#6f7b87]' };

/**
 * The login page's single orchestrated moment: two tower elevations whose
 * units light up floor by floor, bottom to top, in inventory-chart colours.
 */
export function TowerElevation({ className }) {
  const reduce = useReducedMotion();
  const cell = 22;
  const gap = 6;

  let x = 0;
  const towers = TOWERS.map((floors) => {
    const width = floors[0].length * (cell + gap) + gap;
    const tower = { floors, x, width };
    x += width + 28;
    return tower;
  });
  const height = Math.max(...TOWERS.map((f) => f.length)) * (cell + gap) + gap;

  return (
    <svg viewBox={`0 0 ${x - 28} ${height}`} className={cn('w-auto', className)} aria-hidden>
      {towers.map((tower, t) => {
        const top = height - (tower.floors.length * (cell + gap) + gap);
        return (
          <g key={t} transform={`translate(${tower.x} ${top})`}>
            <rect width={tower.width} height={height - top} rx="4" className="fill-white/[0.04] stroke-white/10" />
            {tower.floors.map((row, floorIndex) => {
              const fromBottom = tower.floors.length - 1 - floorIndex;
              return [...row].map((status, u) => (
                <motion.rect
                  key={`${floorIndex}-${u}`}
                  x={gap + u * (cell + gap)}
                  y={gap + floorIndex * (cell + gap)}
                  width={cell}
                  height={cell}
                  rx="3"
                  className={FILL[status]}
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: status === 'a' ? 0.85 : 0.95 }}
                  transition={{ delay: 0.25 + t * 0.15 + fromBottom * 0.07 + u * 0.02, duration: 0.35 }}
                />
              ));
            })}
          </g>
        );
      })}
    </svg>
  );
}
