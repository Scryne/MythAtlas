'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface CardProps {
  href?: string;
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: 'default' | 'myth' | 'deity' | 'site' | 'mythology' | 'scholar' | 'artifact';
}

export default function Card({
  href,
  children,
  className = '',
  delay = 0,
  variant = 'default',
}: CardProps) {
  const variantClassName = variant === 'default' ? '' : `card-variant-${variant}`;
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className={`ancient-card cursor-pointer p-5 md:p-6 ${variantClassName} ${className}`}
    >
      {children}
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
