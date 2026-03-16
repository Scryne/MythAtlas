import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon';
type ButtonSize = 'sm' | 'md' | 'lg';

interface SharedProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  loading?: boolean;
}

type ButtonProps =
  | (SharedProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: never })
  | (SharedProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string });

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-3 text-xs',
  md: 'min-h-10 px-4 text-sm',
  lg: 'min-h-11 px-5 text-sm',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'app-button app-button-primary',
  secondary: 'app-button app-button-secondary',
  ghost: 'app-button app-button-ghost',
  icon: 'app-button app-button-icon h-9 w-9 px-0',
};

export default function Button(props: ButtonProps) {
  const {
    children,
    variant = 'primary',
    size = 'md',
    className,
    loading = false,
    ...rest
  } = props;

  const sharedClassName = cn(
    variantClasses[variant],
    sizeClasses[size],
    loading && 'pointer-events-none opacity-70',
    className
  );

  if ('href' in props && props.href) {
    const linkProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <Link href={props.href} className={sharedClassName} {...linkProps}>
        {loading ? 'Yukleniyor...' : children}
      </Link>
    );
  }

  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;

  return (
    <button
      type={buttonProps.type ?? 'button'}
      {...buttonProps}
      className={sharedClassName}
      disabled={loading || buttonProps.disabled}
    >
      {loading ? 'Yukleniyor...' : children}
    </button>
  );
}
