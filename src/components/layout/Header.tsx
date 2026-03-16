'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const OPEN_SEARCH_EVENT = 'mythatlas:open-search';

const primaryNavLinks = [
  { href: '/map', label: 'Harita' },
  { href: '/discover', label: 'Kesfet' },
  { href: '/parallels', label: 'Paraleller' },
  { href: '/stats', label: 'Istatistikler' },
  { href: '/archaeology', label: 'Arkeoloji' },
  { href: '/family-tree', label: 'Aile Agaci' },
];

const secondaryNavLinks = [
  { href: '/sites', label: 'Kutsal Alanlar' },
  { href: '/themes', label: 'Temalar' },
  { href: '/dna', label: 'DNA' },
  { href: '/compare', label: 'Karsilastir' },
  { href: '/bibliography', label: 'Kaynakca' },
  { href: '/scholars', label: 'Akademisyenler' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const openSearch = () => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));

  return (
    <header
      className={cn(
        'sticky left-0 right-0 top-0 z-50 transition-all duration-300',
        scrolled || mobileOpen ? 'glass-panel shadow-[var(--shadow-card)]' : 'bg-transparent'
      )}
    >
      <nav className="section-container flex h-[var(--header-height)] items-center justify-between gap-6">
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-black/20">
            <svg viewBox="0 0 36 36" className="h-7 w-7" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="18" cy="18" r="15.5" stroke="url(#logoGrad)" strokeWidth="1.5" />
              <path d="M18 5 L22 14.5 L18 12.5 L14 14.5 Z" fill="url(#logoGrad)" />
              <circle cx="18" cy="20" r="3" fill="url(#logoGrad)" />
              <path d="M12 26 Q18 22.5 24 26" stroke="url(#logoGrad)" strokeWidth="1.5" fill="none" />
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-gold)" />
                  <stop offset="50%" stopColor="var(--color-gold-light)" />
                  <stop offset="100%" stopColor="var(--color-gold)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="space-y-0.5">
            <span className="block font-heading text-xl font-bold tracking-[0.14em] text-gold-gradient">
              MythAtlas
            </span>
            <span className="hidden text-[11px] uppercase tracking-[0.18em] text-secondary lg:block">
              Canli Mitoloji Atlasi
            </span>
          </div>
        </Link>

        <div className="hidden min-w-0 items-center gap-5 lg:flex">
          {primaryNavLinks.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative font-heading text-xs uppercase tracking-[0.18em] transition-colors',
                  active ? 'text-gold-light' : 'text-secondary hover:text-gold-light'
                )}
              >
                {link.label}
                <span
                  className={cn(
                    'absolute -bottom-2 left-0 h-px w-full origin-left bg-gold transition-transform duration-200',
                    active ? 'scale-x-100' : 'scale-x-0'
                  )}
                />
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" href="/sites" className="text-xs uppercase tracking-[0.14em] text-secondary">
            Alanlar
          </Button>
          <Button variant="secondary" size="sm" onClick={openSearch} className="text-xs uppercase tracking-[0.14em]">
            Ara <span className="text-secondary">CMD+K</span>
          </Button>
        </div>

        <button
          type="button"
          aria-label={mobileOpen ? 'Menuyu kapat' : 'Menuyu ac'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((value) => !value)}
          className="app-button app-button-icon h-11 w-11 flex-col gap-1.5 lg:hidden"
        >
          <span className={cn('block h-0.5 w-5 bg-gold transition-transform', mobileOpen && 'translate-y-1.5 rotate-45')} />
          <span className={cn('block h-0.5 w-5 bg-gold transition-opacity', mobileOpen ? 'opacity-0' : 'opacity-100')} />
          <span className={cn('block h-0.5 w-5 bg-gold transition-transform', mobileOpen && '-translate-y-1.5 -rotate-45')} />
        </button>
      </nav>

      <div
        className={cn(
          'overflow-hidden border-t border-[color:var(--color-border)] transition-all duration-300 lg:hidden',
          mobileOpen ? 'max-h-[70vh] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="section-container space-y-6 py-5">
          <div className="grid gap-2">
            {primaryNavLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'rounded-card border px-4 py-3 font-heading text-sm uppercase tracking-[0.16em] transition-colors',
                    active
                      ? 'border-[color:var(--color-border-hover)] bg-gold/12 text-gold-light'
                      : 'border-[color:var(--color-border)] bg-black/20 text-secondary hover:text-gold-light'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-secondary">Diger rotalar</p>
            <div className="flex flex-wrap gap-2">
              {secondaryNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="app-badge border-[color:var(--color-border)] bg-black/20 text-secondary hover:text-gold-light"
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={openSearch}
                className="app-badge border-[color:var(--color-border-hover)] bg-gold/10 text-gold-light"
              >
                Ara (CMD+K)
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
