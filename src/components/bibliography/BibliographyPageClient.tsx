'use client';

import { useEffect, useMemo, useState } from 'react';
import HoverPrefetchLink from '@/components/common/HoverPrefetchLink';
import {
  buildBibliographyEntries,
  mythologyOptions,
  type BibliographyEntry,
} from '@/lib/academic-utils';
import type { AcademicSourceType } from '@/lib/myth-data';

function includesTerm(value: string, term: string): boolean {
  return value.toLowerCase().includes(term.toLowerCase());
}

function parseSourceType(rawType: string | null): 'all' | AcademicSourceType {
  if (rawType === 'primary' || rawType === 'secondary' || rawType === 'archaeological') return rawType;
  return 'all';
}

export default function BibliographyPageClient() {
  const mythologyIdSet = useMemo(() => new Set(mythologyOptions.map((item) => item.id)), []);

  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | AcademicSourceType>('all');
  const [mythologyId, setMythologyId] = useState<'all' | string>('all');
  const [yearFilter, setYearFilter] = useState('');
  const [activeGroup, setActiveGroup] = useState<AcademicSourceType>('primary');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextQuery = params.get('q') ?? params.get('author') ?? '';
    const nextType = parseSourceType(params.get('type'));
    const nextYear = params.get('year') ?? '';
    const rawMythologyId = params.get('mythology');
    const nextMythologyId =
      rawMythologyId && mythologyIdSet.has(rawMythologyId) ? rawMythologyId : ('all' as const);

    setQuery(nextQuery);
    setType(nextType);
    setMythologyId(nextMythologyId);
    setYearFilter(nextYear);
  }, [mythologyIdSet]);

  const entries = useMemo(() => buildBibliographyEntries(), []);

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      if (type !== 'all' && entry.type !== type) return false;
      if (mythologyId !== 'all' && !entry.mythologyIds.includes(mythologyId)) return false;
      if (yearFilter.trim().length > 0 && `${entry.year}` !== yearFilter.trim()) return false;
      if (!query.trim()) return true;

      const blob = `${entry.title} ${entry.author} ${entry.mythologyNames.join(' ')} ${entry.mythNames.join(
        ' '
      )}`;
      return includesTerm(blob, query.trim());
    });
  }, [entries, mythologyId, query, type, yearFilter]);

  const grouped = useMemo(() => {
    const byType: Record<AcademicSourceType, BibliographyEntry[]> = {
      primary: [],
      secondary: [],
      archaeological: [],
    };
    filtered.forEach((entry) => byType[entry.type].push(entry));
    return byType;
  }, [filtered]);

  const topReferenced = useMemo(
    () => [...entries].sort((a, b) => b.referenceCount - a.referenceCount).slice(0, 10),
    [entries]
  );

  const downloadText = () => {
    const text = entries
      .map((entry) => `${entry.citationAPA} [refs: ${entry.referenceCount}]`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mythatlas-bibliography-apa.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="section-container py-24">
      <header className="ancient-card p-6">
        <p className="meta-text text-xs uppercase tracking-[0.2em]">Reference Index</p>
        <h1 className="mt-2 text-4xl text-gold md:text-5xl">Bibliography</h1>
        <p className="mt-3 text-foreground/80">
          MythAtlas genelinde kullanilan tum kaynaklar. Arama, filtreleme ve atif metni indirme
          desteklenir.
        </p>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Yazar, eser veya mit ara"
          className="rounded-md border border-gold/25 bg-black/25 px-3 py-2 text-sm text-foreground"
        />
        <select
          value={type}
          onChange={(event) => setType(event.target.value as 'all' | AcademicSourceType)}
          className="rounded-md border border-gold/25 bg-black/25 px-3 py-2 text-sm text-foreground"
        >
          <option value="all">Tum tipler</option>
          <option value="primary">Birincil</option>
          <option value="secondary">Ikincil</option>
          <option value="archaeological">Arkeolojik</option>
        </select>
        <select
          value={mythologyId}
          onChange={(event) => setMythologyId(event.target.value)}
          className="rounded-md border border-gold/25 bg-black/25 px-3 py-2 text-sm text-foreground"
        >
          <option value="all">Tum mitolojiler</option>
          {mythologyOptions.map((mythology) => (
            <option key={mythology.id} value={mythology.id}>
              {mythology.name}
            </option>
          ))}
        </select>
        <input
          value={yearFilter}
          onChange={(event) => setYearFilter(event.target.value)}
          placeholder="Yil filtresi"
          className="rounded-md border border-gold/25 bg-black/25 px-3 py-2 text-sm text-foreground"
        />
        <button
          type="button"
          onClick={downloadText}
          className="rounded-md border border-gold/35 bg-gold/10 px-3 py-2 text-xs uppercase tracking-[0.14em] text-gold-light"
        >
          APA metin indir
        </button>
      </div>

      <aside className="mt-6 ancient-card p-6">
        <h2 className="text-xl text-gold">En cok referans verilen kaynaklar</h2>
        <ol className="mt-3 grid gap-2 md:grid-cols-2">
          {topReferenced.map((entry) => (
            <li key={`top-${entry.id}`} className="rounded-md border border-gold/20 bg-black/20 p-3">
              <p className="text-sm text-gold-light">{entry.title}</p>
              <p className="meta-text text-xs">
                {entry.author} | {entry.referenceCount} referans
              </p>
            </li>
          ))}
        </ol>
      </aside>

      <div className="mt-6 space-y-3">
        {(['primary', 'secondary', 'archaeological'] as AcademicSourceType[]).map((groupType) => {
          const isActive = groupType === activeGroup;
          return (
            <button
              key={`tab-${groupType}`}
              type="button"
              onClick={() => setActiveGroup(groupType)}
              className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.12em] ${
                isActive
                  ? 'border-gold/55 bg-gold/15 text-gold-light'
                  : 'border-gold/25 bg-black/20 text-foreground/70'
              }`}
            >
              {groupType === 'primary'
                ? `Primary (${grouped.primary.length})`
                : groupType === 'secondary'
                  ? `Secondary (${grouped.secondary.length})`
                  : `Archaeological (${grouped.archaeological.length})`}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {(() => {
          const groupType = activeGroup;
          return (
            <section className="ancient-card p-6">
              <h2 className="text-2xl text-gold">
                {groupType === 'primary'
                  ? 'Primary Sources'
                  : groupType === 'secondary'
                    ? 'Secondary Sources'
                    : 'Archaeological'}
              </h2>

              <div className="mt-4 space-y-3">
                {grouped[groupType].map((entry) => (
                  <details key={entry.id} className="rounded-md border border-gold/20 bg-black/20 p-3">
                    <summary className="cursor-pointer">
                      <span className="text-gold-light">{entry.title}</span>
                      <span className="meta-text ml-2 text-xs">
                        {entry.author} | {entry.year} | {entry.referenceCount} referans
                      </span>
                    </summary>

                    <div className="mt-3 space-y-2 text-sm text-foreground/80">
                      <p>{entry.description}</p>
                      <p className="italic">{entry.relevantPassage}</p>
                      <p>
                        <strong>APA:</strong> {entry.citationAPA}
                      </p>
                      <p>
                        <strong>Chicago:</strong> {entry.citationChicago}
                      </p>
                      <div className="pt-2">
                        <p className="text-xs uppercase tracking-[0.12em] text-gold/80">
                          Referans veren mitler
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {entry.mythIds.map((id, index) => (
                            <HoverPrefetchLink
                              key={`${entry.id}-myth-${id}`}
                              href={`/myth/${id}`}
                              className="rounded-full border border-gold/25 px-2 py-0.5 text-xs text-gold-light"
                            >
                              {entry.mythNames[index] || id}
                            </HoverPrefetchLink>
                          ))}
                        </div>
                      </div>
                      <div className="pt-2">
                        <p className="text-xs uppercase tracking-[0.12em] text-gold/80">
                          Iliskili tanrilar
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {entry.deityIds.map((id, index) => (
                            <HoverPrefetchLink
                              key={`${entry.id}-deity-${id}`}
                              href={`/deity/${id}`}
                              className="rounded-full border border-gold/25 px-2 py-0.5 text-xs text-foreground/80"
                            >
                              {entry.deityNames[index] || id}
                            </HoverPrefetchLink>
                          ))}
                          {entry.deityIds.length === 0 && (
                            <span className="text-xs text-foreground/55">Kayitli tanri baglantisi yok</span>
                          )}
                        </div>
                      </div>
                      <div className="pt-2">
                        <p className="text-xs uppercase tracking-[0.12em] text-gold/80">
                          Iliskili kutsal alanlar
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {entry.siteIds.map((id, index) => (
                            <HoverPrefetchLink
                              key={`${entry.id}-site-${id}`}
                              href={`/site/${id}`}
                              className="rounded-full border border-gold/25 px-2 py-0.5 text-xs text-foreground/80"
                            >
                              {entry.siteNames[index] || id}
                            </HoverPrefetchLink>
                          ))}
                          {entry.siteIds.length === 0 && (
                            <span className="text-xs text-foreground/55">Kayitli alan baglantisi yok</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </details>
                ))}

                {grouped[groupType].length === 0 && (
                  <p className="text-sm text-foreground/60">Bu grupta filtreye uyan kaynak bulunmuyor.</p>
                )}
              </div>
            </section>
          );
        })()}
      </div>
    </section>
  );
}
