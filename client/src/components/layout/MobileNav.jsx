import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';

export function MobileNav({ open, onClose, portal }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <motion.div
            className="absolute inset-0 bg-[#0b1419]/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-sidebar-border shadow-xl"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            <Sidebar portal={portal} variant="mobile" />
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-3 rounded-md p-1.5 text-sidebar-muted hover:text-sidebar-active-foreground"
              aria-label="Close navigation"
            >
              <X className="size-4" />
            </button>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
