import { animate, useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';

/** Counts up to `value` when it first appears or changes. */
export function AnimatedNumber({ value = 0, format = (n) => Math.round(n).toLocaleString('en-IN'), className }) {
  const ref = useRef(null);
  const previous = useRef(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (reduceMotion) {
      node.textContent = format(value);
      previous.current = value;
      return undefined;
    }

    const controls = animate(previous.current, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        node.textContent = format(latest);
      },
    });
    previous.current = value;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduceMotion]);

  return (
    <span ref={ref} className={className}>
      {format(0)}
    </span>
  );
}
