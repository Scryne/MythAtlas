'use client';

import { useEffect, useMemo, useState } from 'react';
import AncientImage from '@/components/common/AncientImage';
import HoverPrefetchLink from '@/components/common/HoverPrefetchLink';
import MiniWorldMap from '@/components/detail/MiniWorldMap';
import {
  mythologyById,
  sacredSites,
  siteArchaeologyPeriod,
  siteArtifactCount,
  siteExcavationStatus,
  siteProtectionStatus,
} from '@/lib/myth-data';
import { siteTypeLabel } from '@/lib/myth-utils';

type ViewMode = 'map' | 'grid' | 'list';

const PROTECTION_FILTERS = [
  { key: 'all', label: 'Tum korumalar' },
  { key: 'UNESCO', label: 'UNESCO Dunya Mirasi' },
  { key: 'national_heritage', label: 'Ulusal miras' },
  { key: 'local_protection', label: 'Yerel koruma' },
  { key: 'disputed', label: 'Tartismali' },
] as const;

const EXCAVATION_FILTERS = [
  { key: 'all', label: 'Tum kazi durumlari' },
  { key: 'active_excavation', label: 'Devam eden kazi' },
  { key: 'completed', label: 'Tamamlandi' },
  { key: 'protected', label: 'Koruma altinda' },
  { key: 'unexcavated', label: 'Kazilmamis' },
  { key: 'inaccessible', label: 'Erisim yok' },
] as const;

const PERIOD_FILTERS = [
  { key: 'all', label: 'Tum donemler' },
  { key: 'prehistoric', label: 'Prehistoric' },
  { key: 'ancient', label: 'Ancient' },
  { key: 'classical', label: 'Classical' },
  { key: 'medieval', label: 'Medieval' },
  { key: 'early_modern', label: 'Early Modern' },
] as const;

function parseEraYear(value?: string): number {
  const text = String(value || '').replace(/–|—/g, '-').toLowerCase();
  const match = text.match(/(\d{1,4})/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const year = Number(match[1]);
  if (!Number.isFinite(year)) return Number.MAX_SAFE_INTEGER;
  if (text.includes('bce') || text.includes('bc') || text.includes('mö')) return -Math.abs(year);
  return year;
}

function compareBySort(
  a: (typeof sacredSites)[number],
  b: (typeof sacredSites)[number],
  sortKey: 'name' | 'mythology' | 'era' | 'artifactCount'
) {
  if (sortKey === 'name') return a.name.localeCompare(b.name);
  if (sortKey === 'mythology') {
    const aName = mythologyById.get(a.mythologyId)?.name || a.mythologyId;
    const bName = mythologyById.get(b.mythologyId)?.name || b.mythologyId;
    return aName.localeCompare(bName);
  }
  if (sortKey === 'artifactCount') return siteArtifactCount(b) - siteArtifactCount(a);
  return parseEraYear(a.era) - parseEraYear(b.era);
}

export default function AllSitesPage() {
  const [view, setView] = useState<ViewMode>('map');
  const [mapCardLimit, setMapCardLimit] = useState(6);
  const [query, setQuery] = useState('');
  const [mythologyFilter, setMythologyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [protectionFilter, setProtectionFilter] = useState<(typeof PROTECTION_FILTERS)[number]['key']>('all');
  const [periodFilter, setPeriodFilter] = useState<(typeof PERIOD_FILTERS)[number]['key']>('all');
  const [excavationFilter, setExcavationFilter] = useState<(typeof EXCAVATION_FILTERS)[number]['key']>('all');
  const [sortBy, setSortBy] = useState<'name' | 'mythology' | 'era' | 'artifactCount'>('name');

  const mythologies = useMemo(
    () => Array.from(new Set(sacredSites.map((item) => item.mythologyId))).sort(),
    []
  );
  const siteTypes = useMemo(
    () => Array.from(new Set(sacredSites.map((item) => item.type))).sort(),
    []
  );

  const filteredSites = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sacredSites
      .filter((site) => {
        if (mythologyFilter !== 'all' && site.mythologyId !== mythologyFilter) return false;
        if (typeFilter !== 'all' && site.type !== typeFilter) return false;
        if (protectionFilter !== 'all' && siteProtectionStatus(site) !== protectionFilter) return false;
        if (periodFilter !== 'all' && siteArchaeologyPeriod(site) !== periodFilter) return false;
        if (excavationFilter !== 'all' && siteExcavationStatus(site) !== excavationFilter) return false;
        if (!q) return true;
        const blob = `${site.name} ${site.country || ''} ${site.description}`.toLowerCase();
        return blob.includes(q);
      })
      .sort((a, b) => compareBySort(a, b, sortBy));
  }, [excavationFilter, mythologyFilter, periodFilter, protectionFilter, query, sortBy, typeFilter]);

  const visibleMapCards = useMemo(() => filteredSites.slice(0, mapCardLimit), [filteredSites, mapCardLimit]);

  useEffect(() => {
    setMapCardLimit(6);
  }, [query, mythologyFilter, typeFilter, protectionFilter, periodFilter, excavationFilter, sortBy]);

  const mapMarkers = useMemo(
    () =>
      filteredSites.map((site) => ({
        id: site.id,
        label: site.name,
        lat: site.coordinates.lat,
        lng: site.coordinates.lng,
        color: siteProtectionStatus(site) === 'UNESCO' ? '#f0d58d' : '#9bc2ff',
      })),
    [filteredSites]
  );

  return (
    <div className="section-container space-y-6 py-8">
      <section className="ancient-card p-6">
        <h1 className="text-3xl text-gold">Tum Kutsal Alanlar</h1>
        <p className="meta-text mt-2 text-sm">Harita, grid ve liste gorunumleriyle tum kutsal alanlari kesfet.</p>
      </section>

      <section className="ancient-card space-y-4 p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ad veya konum ara..."
            className="rounded-md border border-gold/20 bg-black/20 px-3 py-2 text-sm text-foreground/85 outline-none focus:border-gold/40"
          />
          <select
            value={mythologyFilter}
            onChange={(event) => setMythologyFilter(event.target.value)}
            className="rounded-md border border-gold/20 bg-black/20 px-3 py-2 text-sm text-foreground/85"
          >
            <option value="all">Tum mitolojiler</option>
            {mythologies.map((id) => (
              <option key={id} value={id}>
                {mythologyById.get(id)?.name || id}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-md border border-gold/20 bg-black/20 px-3 py-2 text-sm text-foreground/85"
          >
            <option value="all">Tum tipler</option>
            {siteTypes.map((type) => (
              <option key={type} value={type}>
                {siteTypeLabel(type)}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as 'name' | 'mythology' | 'era' | 'artifactCount')}
            className="rounded-md border border-gold/20 bg-black/20 px-3 py-2 text-sm text-foreground/85"
          >
            <option value="name">Sirala: Isme gore</option>
            <option value="mythology">Sirala: Mitolojiye gore</option>
            <option value="era">Sirala: Doneme gore</option>
            <option value="artifactCount">Sirala: Eser sayisina gore</option>
          </select>
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          <select
            value={protectionFilter}
            onChange={(event) => setProtectionFilter(event.target.value as (typeof PROTECTION_FILTERS)[number]['key'])}
            className="rounded-md border border-gold/20 bg-black/20 px-3 py-2 text-sm text-foreground/85"
          >
            {PROTECTION_FILTERS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            value={periodFilter}
            onChange={(event) => setPeriodFilter(event.target.value as (typeof PERIOD_FILTERS)[number]['key'])}
            className="rounded-md border border-gold/20 bg-black/20 px-3 py-2 text-sm text-foreground/85"
          >
            {PERIOD_FILTERS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            value={excavationFilter}
            onChange={(event) => setExcavationFilter(event.target.value as (typeof EXCAVATION_FILTERS)[number]['key'])}
            className="rounded-md border border-gold/20 bg-black/20 px-3 py-2 text-sm text-foreground/85"
          >
            {EXCAVATION_FILTERS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-3 gap-2">
            {(['map', 'grid', 'list'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={`rounded-md border px-3 py-2 text-xs uppercase tracking-[0.12em] ${
                  view === mode
                    ? 'border-gold/55 bg-gold/15 text-gold-light'
                    : 'border-gold/20 bg-black/20 text-foreground/70'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <p className="meta-text text-xs">
          {filteredSites.length} site bulundu · UNESCO filtresi icin koruma secicisinde "UNESCO Dunya Mirasi" secilebilir.
        </p>
      </section>

      {view === 'map' && (
        <section className="space-y-4">
          <MiniWorldMap markers={mapMarkers} title="Dunya Uzerinde Kutsal Alanlar" className="p-4" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleMapCards.map((site) => (
              <HoverPrefetchLink key={site.id} href={`/site/${site.id}`} className="ancient-card overflow-hidden">
                <div className="relative h-36">
                  <AncientImage src={site.imageUrl} alt={site.name} fill sizes="(max-width:1280px) 33vw, 320px" className="h-full w-full object-cover" />
                </div>
                <div className="space-y-1 p-4">
                  <p className="text-gold-light">{site.name}</p>
                  <p className="meta-text text-xs uppercase tracking-[0.12em]">
                    {mythologyById.get(site.mythologyId)?.name || site.mythologyId} · {siteTypeLabel(site.type)}
                  </p>
                  <p className="text-xs text-foreground/65">{site.country || 'Unknown'} · Eser: {siteArtifactCount(site)}</p>
                </div>
              </HoverPrefetchLink>
            ))}
          </div>
          {mapCardLimit < filteredSites.length && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setMapCardLimit((current) => current + 6)}
                className="rounded-full border border-gold/35 bg-gold/10 px-4 py-2 text-xs uppercase tracking-[0.12em] text-gold-light hover:border-gold/55"
              >
                Daha fazla goster ({filteredSites.length - mapCardLimit})
              </button>
            </div>
          )}
        </section>
      )}

      {view === 'grid' && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredSites.map((site) => (
            <HoverPrefetchLink key={site.id} href={`/site/${site.id}`} className="ancient-card overflow-hidden">
              <div className="relative h-44">
                <AncientImage src={site.imageUrl} alt={site.name} fill sizes="(max-width:1280px) 33vw, 360px" className="h-full w-full object-cover" />
              </div>
              <div className="space-y-2 p-4">
                <p className="text-lg text-gold">{site.name}</p>
                <p className="meta-text text-xs uppercase tracking-[0.12em]">
                  {mythologyById.get(site.mythologyId)?.name || site.mythologyId} · {siteTypeLabel(site.type)}
                </p>
                <p className="line-clamp-3 text-sm text-foreground/75">{site.description}</p>
                <p className="text-xs text-foreground/65">
                  {site.country || 'Unknown'} · Kazi: {siteExcavationStatus(site) || '-'} · Eser: {siteArtifactCount(site)}
                </p>
              </div>
            </HoverPrefetchLink>
          ))}
        </section>
      )}

      {view === 'list' && (
        <section className="ancient-card overflow-x-auto p-4">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-gold/75">
              <tr>
                <th className="px-3 py-2">Site</th>
                <th className="px-3 py-2">Mitoloji</th>
                <th className="px-3 py-2">Donem</th>
                <th className="px-3 py-2">Koruma</th>
                <th className="px-3 py-2">Kazi</th>
                <th className="px-3 py-2">Eser</th>
              </tr>
            </thead>
            <tbody>
              {filteredSites.map((site) => (
                <tr key={site.id} className="border-t border-gold/10">
                  <td className="px-3 py-2">
                    <HoverPrefetchLink href={`/site/${site.id}`} className="text-gold-light hover:text-gold">
                      {site.name}
                    </HoverPrefetchLink>
                  </td>
                  <td className="px-3 py-2 text-foreground/75">{mythologyById.get(site.mythologyId)?.name || site.mythologyId}</td>
                  <td className="px-3 py-2 text-foreground/75">{site.era || '-'}</td>
                  <td className="px-3 py-2 text-foreground/75">{siteProtectionStatus(site) || '-'}</td>
                  <td className="px-3 py-2 text-foreground/75">{siteExcavationStatus(site) || '-'}</td>
                  <td className="px-3 py-2 text-foreground/75">{siteArtifactCount(site)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
