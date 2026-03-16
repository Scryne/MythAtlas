'use client';

import type { ReactNode } from 'react';
import Button from '@/components/ui/Button';

interface GoldButtonProps {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export default function GoldButton({
  href,
  onClick,
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
}: GoldButtonProps) {
  const mappedVariant = variant === 'outline' ? 'secondary' : variant === 'ghost' ? 'ghost' : 'primary';

  if (href) {
    return (
      <Button href={href} variant={mappedVariant} size={size} className={className}>
        {children}
      </Button>
    );
  }

  return (
    <Button onClick={onClick} variant={mappedVariant} size={size} className={className} disabled={disabled}>
      {children}
    </Button>
  );
}
