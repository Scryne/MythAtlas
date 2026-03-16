'use client';

import Link, { type LinkProps } from 'next/link';
import type { ComponentPropsWithoutRef, PropsWithChildren } from 'react';

interface HoverPrefetchLinkProps
  extends PropsWithChildren,
    LinkProps,
    Omit<ComponentPropsWithoutRef<'a'>, 'href'> {}

export default function HoverPrefetchLink({
  children,
  href,
  onMouseEnter,
  onFocus,
  ...props
}: HoverPrefetchLinkProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        onFocus?.(event);
      }}
      {...props}
    >
      {children}
    </Link>
  );
}

