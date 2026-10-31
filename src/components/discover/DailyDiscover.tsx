'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import AncientImage from '@/components/common/AncientImage';
import HoverPrefetchLink from '@/components/common/HoverPrefetchLink';
import MythDNA from '@/components/MythDNA';
import RandomExploreButton from '@/components/discover/RandomExploreButton';
import { dayIndexOf, pickForDay, type DailyCatalog, type DailyPicks } from '@/lib/daily';
import type { MythData } from '@/lib/myth-data';
import { withBasePath } from '@/lib/site';

/**
 * Günün miti, günün tanrısı, haftanın öne çıkan mitolojisi ve benzer mitler.
 * HTML derleme gününün seçimiyle gelir (JavaScript'siz okuyucu boş görmez); tarayıcı bugün
 * farklı bir günse /daily.json'dan doğru günü alır.
 */
export default function DailyDiscover({ initial }: { initial: DailyPicks }) {
  const [picks, setPicks] = useState(initial);

  useEffect(() => {
    const today = dayIndexOf(new Date());
    if (today === initial.dayIndex) return;
    let active = true;
    fetch(withBasePath('/daily.json'))
      .then((res) => (res.ok ? (res.json() as Promise<DailyCatalog>) : null))
      .then((catalog) => {
        if (active && catalog) setPicks(pickForDay(catalog, today));
      })
      .catch(() => {
        // Ağ yoksa derleme gününün seçimi kalır; sayfa yine eksiksiz.
      });
    return () => {
      active = false;
    };
  }, [initial.dayIndex]);

  const { myth, deity, spotlight } = picks;

  return (
    <>
      <section className="hero-vignette relative overflow-hidden rounded-2xl border border-gold/20">
        <div className="relative h-[420px] w-full">
          <AncientImage src={myth.imageUrl} alt={myth.name} fill priority sizes="100vw" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
        <div className="absolute inset-0 flex items-end p-6 md:p-10">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.2em] text-gold/75">Her gün yeni bir hikâye</p>
            <h1 className="mt-3 text-3xl text-gold md:text-5xl">{myth.name}</h1>
            <p className="mt-3 text-sm text-foreground/80 md:text-base">{myth.summary}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <HoverPrefetchLink href={`/myth/${myth.id}`} className="rounded-full border border-gold/35 bg-gold/10 px-4 py-2 text-xs uppercase tracking-[0.14em] text-gold-light hover:bg-gold/20">
                Miti aç
              </HoverPrefetchLink>
              {myth.mythologyName && (
                <HoverPrefetchLink href={`/mythology/${myth.mythologyId}`} className="rounded-full border border-gold/30 px-4 py-2 text-xs uppercase tracking-[0.14em] text-foreground/80 hover:border-gold/50 hover:text-gold-light">
                  {myth.mythologyName}
                </HoverPrefetchLink>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="ancient-card overflow-hidden p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl text-gold">Bugünün Tanrısı</h2>
            {deity.mythologyName && <span className="rounded-full border border-gold/30 px-2 py-0.5 text-[11px] text-gold-light">{deity.mythologyName}</span>}
          </div>
          <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
            <div className="relative h-36 overflow-hidden rounded-md border border-gold/20">
              <AncientImage src={deity.imageUrl} alt={deity.name} fill sizes="140px" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-lg text-gold-light">{deity.name}</p>
              <p className="mt-1 text-xs text-foreground/60">{deity.domain.join(' · ')}</p>
              <p className="mt-2 line-clamp-3 text-sm text-foreground/75">{deity.description}</p>
              <HoverPrefetchLink href={`/deity/${deity.id}`} className="mt-3 inline-flex rounded-full border border-gold/35 px-3 py-1 text-xs text-gold-light">Tanrı profilini aç</HoverPrefetchLink>
            </div>
          </div>
        </article>

        {spotlight && (
          <article className="ancient-card overflow-hidden p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-2xl text-gold">Bilinmeyen Mitolojiler</h2>
              <span className="rounded-full border border-gold/30 px-2 py-0.5 text-[11px] text-gold-light">Haftanın öne çıkanı</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
              <div className="relative h-36 overflow-hidden rounded-md border border-gold/20">
                <AncientImage src={spotlight.imageUrl} alt={spotlight.name} fill sizes="140px" className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-lg text-gold-light">{spotlight.name}</p>
                <p className="mt-1 text-xs text-foreground/60">{spotlight.region} · {spotlight.era}</p>
                <p className="mt-2 line-clamp-3 text-sm text-foreground/75">{spotlight.description}</p>
                <HoverPrefetchLink href={`/mythology/${spotlight.id}`} className="mt-3 inline-flex rounded-full border border-gold/35 px-3 py-1 text-xs text-gold-light">Öne çıkanı keşfet</HoverPrefetchLink>
              </div>
            </div>
          </article>
        )}
      </section>

      <section className="ancient-card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl text-gold">Bu mitin benzerleri</h2>
            <p className="meta-text mt-1 text-sm">Hızlı bağlantılarla benzer anlatıları keşfedin.</p>
          </div>
          <RandomExploreButton />
        </div>
        <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
          {myth.similar.map((item, index) => (
            <HoverPrefetchLink key={item.id} href={`/myth/${item.id}`} className="stagger-card min-w-[220px] snap-start rounded-lg border border-gold/20 bg-black/20 p-3 hover:border-gold/40" style={{ animationDelay: `${index * 70}ms` } as CSSProperties}>
              <p className="text-sm text-gold-light">{item.name}</p>
              <p className="meta-text mt-1 text-xs uppercase tracking-[0.12em]">{item.type}</p>
              <div className="mt-2">
                <MythDNA myth={item as MythData} size="mini" showRadar={false} showFingerprint={false} showHoverLegend />
              </div>
            </HoverPrefetchLink>
          ))}
        </div>
      </section>
    </>
  );
}
