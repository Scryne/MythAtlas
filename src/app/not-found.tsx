import HoverPrefetchLink from '@/components/common/HoverPrefetchLink';

export default function NotFound() {
  return (
    <section className="section-container page-section">
      <div className="ancient-card mx-auto max-w-3xl overflow-hidden p-8 text-center">
        <div className="mb-6 rounded-xl border border-gold/20 bg-black/20 p-4">
          <svg viewBox="0 0 640 240" className="h-44 w-full" role="img" aria-label="Ancient map illustration">
            <rect width="640" height="240" fill="var(--color-bg-surface)" rx="12" />
            <path d="M48 120 C140 40, 300 42, 410 110 S585 180, 602 122" fill="none" stroke="var(--color-gold)" strokeOpacity="0.45" strokeWidth="2" />
            <path d="M86 58 L154 48 L220 82 L186 126 L118 120 Z" fill="var(--color-bg-elevated)" stroke="var(--color-gold)" strokeOpacity="0.35" />
            <path d="M278 50 L356 44 L418 76 L394 130 L322 132 L270 98 Z" fill="var(--color-bg-elevated)" stroke="var(--color-gold)" strokeOpacity="0.35" />
            <path d="M456 114 L538 108 L580 146 L566 196 L486 202 L438 162 Z" fill="var(--color-bg-elevated)" stroke="var(--color-gold)" strokeOpacity="0.35" />
            <circle cx="324" cy="124" r="18" fill="rgba(201,168,76,0.13)" stroke="var(--color-gold)" strokeOpacity="0.7" />
            <text x="324" y="130" textAnchor="middle" fill="var(--color-parchment)" fontSize="14">✧</text>
          </svg>
        </div>

        <p className="meta-text text-xs uppercase tracking-[0.2em]">404</p>
        <h1 className="mt-2 text-3xl text-gold">Bu topraklarda kayip bir efsane gibisin...</h1>
        <p className="mt-3 text-sm text-secondary">
          Aradigin sayfa atlasin sisleri arasinda kaybolmus olabilir.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <HoverPrefetchLink href="/map" className="app-button app-button-secondary min-h-10 px-4 text-xs uppercase tracking-[0.12em]">
            Haritaya don
          </HoverPrefetchLink>
          <HoverPrefetchLink href="/" className="app-button app-button-ghost min-h-10 px-4 text-xs uppercase tracking-[0.12em]">
            Ana sayfa
          </HoverPrefetchLink>
        </div>
      </div>
    </section>
  );
}
