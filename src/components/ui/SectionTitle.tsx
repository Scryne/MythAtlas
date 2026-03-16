'use client';

import { motion } from 'framer-motion';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
  align?: 'left' | 'center';
}

export default function SectionTitle({
  title,
  subtitle,
  className = '',
  align = 'center',
}: SectionTitleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6 }}
      className={`mb-12 ${align === 'center' ? 'text-center' : 'text-left'} ${className}`}
    >
      {align === 'center' ? (
        <div className="mb-4 flex items-center justify-center gap-3">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold/40" />
          <span className="text-xs text-gold/60">✦</span>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold/40" />
        </div>
      ) : null}

      <h2 className="text-balance text-gold-gradient">{title}</h2>

      {subtitle ? (
        <p className="mx-auto mt-3 max-w-2xl text-lg leading-relaxed text-secondary">
          {subtitle}
        </p>
      ) : null}

      <div
        className={`mt-6 flex items-center gap-2 ${
          align === 'center' ? 'justify-center' : 'justify-start'
        }`}
      >
        <span className="h-px w-16 bg-gradient-to-r from-transparent to-gold/30" />
        <span className="h-1.5 w-1.5 rounded-full bg-gold/40" />
        <span className="h-px w-24 bg-gold/30" />
        <span className="h-1.5 w-1.5 rounded-full bg-gold/40" />
        <span className="h-px w-16 bg-gradient-to-l from-transparent to-gold/30" />
      </div>
    </motion.div>
  );
}
