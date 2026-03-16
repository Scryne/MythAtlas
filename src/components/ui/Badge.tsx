import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type BadgeVariant =
  | 'default'
  | 'mythology'
  | 'type'
  | 'status'
  | 'era'
  | 'danger'
  | 'success'
  | 'muted';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dotColor?: string;
  style?: CSSProperties;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'app-badge border-[color:var(--color-border)] bg-gold/10 text-gold-light',
  mythology: 'app-badge border-[color:var(--color-border)] bg-black/30 text-gold-light',
  type: 'app-badge border-[color:var(--color-border)] bg-surface text-primary',
  status: 'app-badge border-[color:var(--color-border)] bg-elevated text-secondary',
  era: 'app-badge border-[color:var(--color-border)] bg-overlay text-secondary',
  danger: 'app-badge border-red/35 bg-red/15 text-parchment',
  success: 'app-badge border-emerald-400/40 bg-emerald-500/15 text-emerald-100',
  muted: 'app-badge border-[color:var(--color-border)] bg-black/20 text-secondary',
};

export default function Badge({
  children,
  variant = 'default',
  className,
  dotColor,
  style,
}: BadgeProps) {
  return (
    <span className={cn(variantClasses[variant], className)} style={style}>
      {dotColor ? (
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
      ) : null}
      {children}
    </span>
  );
}
