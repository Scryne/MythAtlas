import type { ReactNode } from 'react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}

export default function EmptyState({
  title,
  description,
  icon = '✦',
  actionHref,
  actionLabel,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('app-empty-state', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-black/25 text-xl text-gold-light">
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="text-xl text-gold">{title}</h3>
        <p className="max-w-2xl text-sm text-secondary">{description}</p>
      </div>
      {actionHref && actionLabel ? (
        <Button href={actionHref} variant="secondary">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
