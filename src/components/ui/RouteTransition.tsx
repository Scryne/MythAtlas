'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface RouteTransitionProps {
  children: React.ReactNode;
}

export default function RouteTransition({ children }: RouteTransitionProps) {
  const pathname = usePathname();
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const onPopState = () => setDirection(-1);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDirection(1), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: direction < 0 ? -12 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: direction < 0 ? 10 : -10 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
