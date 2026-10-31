import type { CSSProperties } from 'react';
import { DiscoveryCounterBadge } from '@/components/common/DiscoveryTracker';
import RandomExploreButton from '@/components/discover/RandomExploreButton';
import AncientImage from '@/components/common/AncientImage';
import HoverPrefetchLink from '@/components/common/HoverPrefetchLink';
import MythDNA from '@/components/MythDNA';
import { getThematicCollections } from '@/lib/insights';
import { buildDailyCatalog } from '@/lib/daily-catalog';
import { dayIndexOf, pickForDay } from '@/lib/daily';
import DailyDiscover from '@/components/discover/DailyDiscover';
import { deities, mythologies, mythologyById } from '@/lib/myth-data';
import { getRecentlyAdded } from '@/lib/recent-added';

function kindLabel(kind: 'myth' | 'deity' | 'site' | 'mythology'): string {
  if (kind === 'myth') return 'Mit';
  if (kind === 'deity') return 'Tanrı';
  if (kind === 'site') return 'Kutsal mekân';
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
  const collections = getThematicCollections();
  const recent = await getRecentlyAdded(10);
  // Derleme gününün seçimi HTML'e girer; tarayıcı bugünü kendisi hesaplar (DailyDiscover).
  const dailyPicks = pickForDay(buildDailyCatalog(), dayIndexOf(new Date()));

  return (
    <div className="section-container space-y-10 py-8">
      <div className="flex justify-end">
        <DiscoveryCounterBadge />
      </div>

      <DailyDiscover initial={dailyPicks} />

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl text-gold">Tematik koleksiyonlar</h2>
            <p className="meta-text text-sm">Editor seçimi koleksiyonlar.</p>
          </div>
          <HoverPrefetchLink href="/themes" className="text-xs uppercase tracking-[0.14em] text-gold/80 hover:text-gold-light">Tüm temalar</HoverPrefetchLink>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection, index) => (
            <article key={collection.id} className={`stagger-card relative overflow-hidden rounded-xl border p-5 ${collection.featured ? 'featured-card border-gold/45 bg-gold/10' : 'border-gold/20 bg-black/20'}`} style={{ animationDelay: `${120 + index * 70}ms` } as CSSProperties}>
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full blur-2xl" style={{ backgroundColor: `${collection.accent}55` }} />
              <div className="relative">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full border border-gold/30 bg-black/25 px-2 py-0.5 text-[11px] text-gold-light">{collection.subtitle}</span>
                  <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] text-gold-light">{collection.mythCount + collection.mythologyCount} öğe</span>
                  {collection.featured && <span className="rounded-full border border-gold/35 bg-gold/15 px-2 py-0.5 text-[11px] text-gold-light">Özel</span>}
                </div>
                <h3 className="text-lg text-gold">{collection.title}</h3>
                <p className="mt-2 text-sm text-foreground/70">{collection.description}</p>
                <div className="meta-text mt-3 flex gap-3 text-xs"><span>{collection.mythCount} mit</span><span>{collection.mythologyCount} kültür</span></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ancient-card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl text-gold">Son Eklenenler</h2>
            <p className="meta-text text-sm">Son 10 eklenen kayıt (created_at sırasına göre).</p>
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
