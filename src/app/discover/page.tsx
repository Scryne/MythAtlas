import type { CSSProperties } from 'react';
import { DiscoveryCounterBadge } from '@/components/common/DiscoveryTracker';
import RandomExploreButton from '@/components/discover/RandomExploreButton';
import AncientImage from '@/components/common/AncientImage';
import HoverPrefetchLink from '@/components/common/HoverPrefetchLink';
import MythDNA from '@/components/MythDNA';
import { getDailyMythFeature, getThematicCollections } from '@/lib/insights';
import { deities, mythologies, mythologyById } from '@/lib/myth-data';
import { getRecentlyAdded } from '@/lib/recent-added';

function kindLabel(kind: 'myth' | 'deity' | 'site' | 'mythology'): string {
  if (kind === 'myth') return 'Mit';
  if (kind === 'deity') return 'Tanri';
  if (kind === 'site') return 'Kutsal mekan';
  return 'Mitoloji';
}

function formatDate(isoDate: string): string {
  const value = new Date(isoDate);
  if (Number.isNaN(value.getTime())) return '-';
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

export default async function DiscoverPage() {
  const daily = getDailyMythFeature(new Date());
  const collections = getThematicCollections();
  const recent = await getRecentlyAdded(10);

  const daySeed = Math.floor(Date.now() / 86400000);
  const dailyDeity = deities[Math.abs(daySeed * 7) % deities.length];
  const dailyDeityMythology = mythologyById.get(dailyDeity.mythologyId);

  const lesserKnown = mythologies.filter(
    (item) => !['greek', 'egyptian', 'norse', 'hindu', 'mesopotamian'].includes(item.id)
  );
  const weeklySpotlight = lesserKnown[Math.abs(daySeed * 3) % Math.max(1, lesserKnown.length)];

  return (
    <div className="section-container space-y-10 py-8">
      <div className="flex justify-end">
        <DiscoveryCounterBadge />
      </div>

      <section className="hero-vignette relative overflow-hidden rounded-2xl border border-gold/20">
        <div className="relative h-[420px] w-full">
          <AncientImage src={daily.myth.imageUrl} alt={daily.myth.name} fill priority sizes="100vw" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
        <div className="absolute inset-0 flex items-end p-6 md:p-10">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.2em] text-gold/75">Her gun yeni bir hikaye</p>
            <h1 className="mt-3 text-3xl text-gold md:text-5xl">{daily.myth.name}</h1>
            <p className="mt-3 text-sm text-foreground/80 md:text-base">{daily.myth.summary}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <HoverPrefetchLink href={`/myth/${daily.myth.id}`} className="rounded-full border border-gold/35 bg-gold/10 px-4 py-2 text-xs uppercase tracking-[0.14em] text-gold-light hover:bg-gold/20">
                Miti ac
              </HoverPrefetchLink>
              {daily.mythology && (
                <HoverPrefetchLink href={`/mythology/${daily.mythology.id}`} className="rounded-full border border-gold/30 px-4 py-2 text-xs uppercase tracking-[0.14em] text-foreground/80 hover:border-gold/50 hover:text-gold-light">
                  {daily.mythology.name}
                </HoverPrefetchLink>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="ancient-card overflow-hidden p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl text-gold">Bugunun Tanrisi</h2>
            {dailyDeityMythology && <span className="rounded-full border border-gold/30 px-2 py-0.5 text-[11px] text-gold-light">{dailyDeityMythology.name}</span>}
          </div>
          <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
            <div className="relative h-36 overflow-hidden rounded-md border border-gold/20">
              <AncientImage src={dailyDeity.imageUrl} alt={dailyDeity.name} fill sizes="140px" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-lg text-gold-light">{dailyDeity.name}</p>
              <p className="mt-1 text-xs text-foreground/60">{dailyDeity.domain.slice(0, 4).join(' · ')}</p>
              <p className="mt-2 line-clamp-3 text-sm text-foreground/75">{dailyDeity.description}</p>
              <HoverPrefetchLink href={`/deity/${dailyDeity.id}`} className="mt-3 inline-flex rounded-full border border-gold/35 px-3 py-1 text-xs text-gold-light">Tanri profilini ac</HoverPrefetchLink>
            </div>
          </div>
        </article>

        {weeklySpotlight && (
          <article className="ancient-card overflow-hidden p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-2xl text-gold">Bilinmeyen Mitolojiler</h2>
              <span className="rounded-full border border-gold/30 px-2 py-0.5 text-[11px] text-gold-light">Haftalik spotlight</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
              <div className="relative h-36 overflow-hidden rounded-md border border-gold/20">
                <AncientImage src={weeklySpotlight.imageUrl} alt={weeklySpotlight.name} fill sizes="140px" className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-lg text-gold-light">{weeklySpotlight.name}</p>
                <p className="mt-1 text-xs text-foreground/60">{weeklySpotlight.region} · {weeklySpotlight.era}</p>
                <p className="mt-2 line-clamp-3 text-sm text-foreground/75">{weeklySpotlight.description}</p>
                <HoverPrefetchLink href={`/mythology/${weeklySpotlight.id}`} className="mt-3 inline-flex rounded-full border border-gold/35 px-3 py-1 text-xs text-gold-light">Spotlighti kesfet</HoverPrefetchLink>
              </div>
            </div>
          </article>
        )}
      </section>

      <section className="ancient-card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl text-gold">Bu mitin benzerleri</h2>
            <p className="meta-text mt-1 text-sm">Hizli baglantilarla benzer anlatilari kesfedin.</p>
          </div>
          <RandomExploreButton />
        </div>
        <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
          {daily.similar.map((item, index) => (
            <HoverPrefetchLink key={item.id} href={`/myth/${item.id}`} className="stagger-card min-w-[220px] snap-start rounded-lg border border-gold/20 bg-black/20 p-3 hover:border-gold/40" style={{ animationDelay: `${index * 70}ms` } as CSSProperties}>
              <p className="text-sm text-gold-light">{item.name}</p>
              <p className="meta-text mt-1 text-xs uppercase tracking-[0.12em]">{item.type}</p>
              <div className="mt-2">
                <MythDNA myth={item} size="mini" showRadar={false} showFingerprint={false} showHoverLegend />
              </div>
            </HoverPrefetchLink>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl text-gold">Tematik koleksiyonlar</h2>
            <p className="meta-text text-sm">Editor secimi koleksiyonlar.</p>
          </div>
          <HoverPrefetchLink href="/themes" className="text-xs uppercase tracking-[0.14em] text-gold/80 hover:text-gold-light">Tum temalar</HoverPrefetchLink>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection, index) => (
            <article key={collection.id} className={`stagger-card relative overflow-hidden rounded-xl border p-5 ${collection.featured ? 'featured-card border-gold/45 bg-gold/10' : 'border-gold/20 bg-black/20'}`} style={{ animationDelay: `${120 + index * 70}ms` } as CSSProperties}>
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full blur-2xl" style={{ backgroundColor: `${collection.accent}55` }} />
              <div className="relative">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full border border-gold/30 bg-black/25 px-2 py-0.5 text-[11px] text-gold-light">{collection.subtitle}</span>
                  <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] text-gold-light">{collection.mythCount + collection.mythologyCount} oge</span>
                  {collection.featured && <span className="rounded-full border border-gold/35 bg-gold/15 px-2 py-0.5 text-[11px] text-gold-light">Ozel</span>}
                </div>
                <h3 className="text-lg text-gold">{collection.title}</h3>
                <p className="mt-2 text-sm text-foreground/70">{collection.description}</p>
                <div className="meta-text mt-3 flex gap-3 text-xs"><span>{collection.mythCount} mit</span><span>{collection.mythologyCount} kultur</span></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ancient-card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl text-gold">Recently Added</h2>
            <p className="meta-text text-sm">Son 10 eklenen kayit (created_at sirasina gore).</p>
          </div>
          <span className="rounded-full border border-gold/25 px-3 py-1 text-xs text-foreground/65">Kaynak: {recent.source}</span>
        </div>

        {recent.warning && <p className="meta-text mb-3 rounded-md border border-gold/15 bg-black/20 px-3 py-2 text-xs">{recent.warning}</p>}

        <div className="grid gap-2">
          {recent.items.map((item, index) => (
            <HoverPrefetchLink key={`${item.kind}-${item.id}`} href={item.href} className="stagger-card flex items-center justify-between rounded-md border border-gold/15 bg-black/20 px-3 py-2 hover:border-gold/35" style={{ animationDelay: `${index * 45}ms` } as CSSProperties}>
              <div><p className="text-sm text-gold-light">{item.name}</p><p className="meta-text text-xs">{kindLabel(item.kind)}</p></div>
              <p className="meta-text text-xs">{formatDate(item.createdAt)}</p>
            </HoverPrefetchLink>
          ))}
        </div>
      </section>
    </div>
  );
}
