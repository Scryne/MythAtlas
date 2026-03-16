'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef } from 'react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { cn } from '@/lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  panelClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  full: 'max-w-none',
} as const;

function getFocusableElements(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden'));
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  panelClassName,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useMemo(
    () => `modal-title-${Math.random().toString(36).slice(2, 9)}`,
    []
  );
  const descriptionId = useMemo(
    () => `modal-description-${Math.random().toString(36).slice(2, 9)}`,
    []
  );

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    if (!panel) return;

    const focusables = getFocusableElements(panel);
    const first = focusables[0] ?? panel;
    first.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const currentFocusables = getFocusableElements(panel);
      if (!currentFocusables.length) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const firstFocusable = currentFocusables[0];
      const lastFocusable = currentFocusables[currentFocusables.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey && activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      } else if (!event.shiftKey && activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={cn('app-modal-backdrop', className)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            className={cn(
              'app-modal-panel max-h-[min(90vh,820px)] w-full overflow-hidden',
              sizeClasses[size],
              panelClassName
            )}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {title || showCloseButton ? (
              <div className="flex items-start justify-between gap-4 border-b border-[color:var(--color-border)] px-5 py-4">
                <div className="space-y-1">
                  {title ? (
                    <h2 id={titleId} className="font-heading text-xl font-semibold text-gold">
                      {title}
                    </h2>
                  ) : null}
                  {description ? (
                    <p id={descriptionId} className="text-sm text-secondary">
                      {description}
                    </p>
                  ) : null}
                </div>
                {showCloseButton ? (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Kapat"
                    className="app-button app-button-icon h-9 w-9 shrink-0"
                  >
                    ×
                  </button>
                ) : null}
              </div>
            ) : null}
            <div className="max-h-[calc(90vh-72px)] overflow-y-auto px-5 py-5">{children}</div>
            {footer ? (
              <div className="border-t border-[color:var(--color-border)] px-5 py-4">{footer}</div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
