'use client';

import { LazyMotion, domAnimation, m as motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

interface DustParticle {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  opacity: number;
}

function buildParticles(count: number): DustParticle[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: Math.random() * 100,
    size: 1.25 + Math.random() * 3.25,
    duration: 7 + Math.random() * 9,
    delay: Math.random() * 5,
    drift: (Math.random() - 0.5) * 36,
    opacity: 0.08 + Math.random() * 0.3,
  }));
}

export default function HomeClient() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [particleCount, setParticleCount] = useState(40);

  useEffect(() => {
    const syncParticles = () => {
      if (prefersReducedMotion) {
        setParticleCount(0);
        return;
      }
      const isMobile = window.innerWidth < 768;
      setParticleCount(isMobile ? 20 : 40);
    };

    syncParticles();
    window.addEventListener('resize', syncParticles);
    return () => window.removeEventListener('resize', syncParticles);
  }, [prefersReducedMotion]);

  const particles = useMemo(() => buildParticles(particleCount), [particleCount]);

  const handleExplore = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    window.setTimeout(() => router.push('/map'), 280);
  }, [isTransitioning, router]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleExplore();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleExplore]);

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(201,168,76,0.18)_0%,rgba(13,10,7,0.95)_52%,rgba(13,10,7,1)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(36,29,23,0.3)_0%,rgba(13,10,7,0.94)_70%)]" />

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {particles.map((particle) => (
            <motion.span
              key={particle.id}
              className="absolute rounded-full bg-gold-light"
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                left: `${particle.left}%`,
                bottom: '-8%',
                opacity: particle.opacity,
              }}
              animate={{
                y: ['0vh', '-112vh'],
                x: [0, particle.drift],
                opacity: [0, particle.opacity, particle.opacity * 0.35, 0],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </div>

        <section className="section-container relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pb-20 pt-[calc(var(--header-height)+2rem)] text-center">
          <motion.h1
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="max-w-4xl font-heading text-5xl font-bold tracking-[0.16em] text-gold-light sm:text-6xl md:text-7xl lg:text-8xl"
            style={{
              textShadow:
                '0 0 10px rgba(201,168,76,0.22), 0 0 24px rgba(201,168,76,0.14)',
            }}
          >
            MythAtlas
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="mt-5 font-heading text-sm uppercase tracking-[0.3em] text-parchment/85 sm:text-base"
          >
            Insanligin hikayelerini cografyada oku
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.26 }}
            className="mt-8 max-w-3xl text-base leading-8 text-secondary sm:text-lg"
          >
            Kutsal mekanlari, tanrilari ve efsaneleri ayni atlas uzerinde bir araya getiren
            karanlik ama sicak tonlu bir mitoloji arayuzu. Her tiklama, anlatilarin cografya ve
            arkeolojiyle nasil kesistigini bir katman daha acar.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.38 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Button
              onClick={handleExplore}
              className="animate-glow-pulse rounded-full px-6 text-xs uppercase tracking-[0.2em]"
            >
              Kesfe basla
            </Button>
            <span className="app-badge border-[color:var(--color-border)] bg-black/20 text-secondary">
              Enter ile haritaya gec
            </span>
          </motion.div>
        </section>

        <AnimatePresence>
          {isTransitioning ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="absolute inset-0 z-20 bg-background"
            />
          ) : null}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}
