'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import HoverPrefetchLink from '@/components/common/HoverPrefetchLink';
import MythDNA from '@/components/MythDNA';
import { getMythsForTheme, getThemeSummaries, buildThemeNetwork } from '@/lib/insights';
import { mythologies } from '@/lib/myth-data';
import ThemeNetworkGraph from './ThemeNetworkGraph.lazy';

export default function ThemesPage() {
  const router = useRouter();

  const themes = useMemo(() => getThemeSummaries(), []);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);

  const mythologyNameById = useMemo(() => new Map(mythologies.map((item) => [item.id, item.name])), []);

  useEffect(() => {
    if (!themes.length) return;
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('theme');
    const available = requested && themes.some((theme) => theme.id === requested) ? requested : themes[0].id;
    setSelectedThemeId(available);
  }, [themes]);

  const selectedTheme = themes.find((item) => item.id === selectedThemeId) || null;
  const myths = useMemo(() => (selectedTheme ? getMythsForTheme(selectedTheme.id) : []), [selectedTheme]);
  const network = useMemo(() => buildThemeNetwork(2), []);

  const selectTheme = (themeId: string) => {
    setSelectedThemeId(themeId);
    const params = new URLSearchParams(window.location.search);
    params.set('theme', themeId);
    router.replace(`/themes?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="section-container space-y-8 py-8">
      <section className="ancient-card p-6">
        <h1 className="text-3xl text-gold">Theme Explorer</h1>
        <p className="meta-text mt-2 max-w-3xl text-sm">
          Evrensel temalar arasinda gezin, hangi kulturlerin benzer motifleri paylastigini kesfet.
        </p>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl text-gold">Evrensel tema izgara</h2>
          {selectedTheme && (
            <HoverPrefetchLink
              href={`/map?theme=${selectedTheme.id}`}
              className="rounded-full border border-gold/30 px-4 py-2 text-xs uppercase tracking-[0.14em] text-gold-light hover:border-gold/55 hover:bg-gold/10"
            >
              Haritada goster
            </HoverPrefetchLink>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {themes.map((theme, index) => {
            const active = theme.id === selectedThemeId;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => selectTheme(theme.id)}
                className={`stagger-card rounded-xl border p-4 text-left transition ${
                  active ? 'border-gold/45 bg-gold/10' : 'border-gold/20 bg-black/20 hover:border-gold/35'
                }`}
                style={{ animationDelay: `${index * 55}ms` }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-lg text-gold-light">{theme.icon}</span>
                  <h3 className="text-base text-gold">{theme.name}</h3>
                </div>
                <p className="meta-text text-xs">{theme.mythCount} mit</p>
                <p className="meta-text mt-2 text-xs">Ornek kulturler: {theme.topCultures.join(', ') || '-'}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="ancient-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl text-gold">Filtrelenmis mit listesi</h2>
            {selectedTheme && (
              <p className="meta-text mt-1 text-sm">Secili tema: {selectedTheme.name} ({myths.length} mit)</p>
            )}
          </div>
          {selectedTheme && (
            <HoverPrefetchLink href={`/map?theme=${selectedTheme.id}`} className="text-xs uppercase tracking-[0.14em] text-gold/80 hover:text-gold-light">
              Theme map view
            </HoverPrefetchLink>
          )}
        </div>

        {selectedTheme ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {myths.map((myth) => (
              <HoverPrefetchLink
                key={myth.id}
                href={`/myth/${myth.id}`}
                className="rounded-lg border border-gold/20 bg-black/20 p-3 hover:border-gold/40"
              >
                <p className="text-sm text-gold-light">{myth.name}</p>
                <p className="meta-text mt-1 text-xs uppercase tracking-[0.12em]">
                  {mythologyNameById.get(myth.mythologyId) || myth.mythologyId}
                </p>
                <div className="mt-2">
                  <MythDNA myth={myth} size="mini" showRadar={false} showFingerprint={false} showHoverLegend />
                </div>
              </HoverPrefetchLink>
            ))}
          </div>
        ) : (
          <p className="text-sm text-foreground/60">Tema seciniz.</p>
        )}
      </section>

      <section className="ancient-card p-6">
        <h2 className="text-2xl text-gold">Tema Agi</h2>
        <p className="meta-text mt-1 text-sm">
          D3 force graph, temalarin birlikte gorulme sikligini baglanti agirligi ile gosterir.
        </p>
        <div className="mt-4">
          <ThemeNetworkGraph nodes={network.nodes} edges={network.edges} />
        </div>
      </section>
    </div>
  );
}
