'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import AncientImage from '@/components/common/AncientImage';
import HoverPrefetchLink from '@/components/common/HoverPrefetchLink';
import CopyCoordinates from '@/components/detail/CopyCoordinates';
import MiniWorldMap from '@/components/detail/MiniWorldMap';
import SiteLocationMap from '@/components/detail/SiteLocationMap';
import Modal from '@/components/ui/Modal';
import type {
  ArchaeologyArtifactEntry,
  ArchaeologyChronologyType,
  DeityData,
  MythData,
  SiteData,
} from '@/lib/myth-data';
import {
  siteArchaeology,
  siteArtifactCount,
  siteExcavationStartYear,
  siteExcavationStatus,
  siteHasForeignMuseumHoldings,
  siteMuseumCount,
  siteProtectionStatus,
} from '@/lib/myth-data';
import { formatSlugLabel, mythTypeLabel, siteTypeLabel } from '@/lib/myth-utils';

type TabKey = 'overview' | 'archaeology';

interface NearbySiteEntry {
  site: SiteData;
  distanceKm: number;
}

interface SiteDetailTabsProps {
  site: SiteData;
  mythologyName?: string;
  historicalContext: string[];
  visitorNote?: string;
  connectedMyths: MythData[];
  connectedDeities: DeityData[];
  nearbySites: NearbySiteEntry[];
  sameMythologyTrail: NearbySiteEntry[];
  sourceCount: {
    primary: number;
    secondary: number;
  };
  lastUpdatedLabel: string;
}

const CHRONOLOGY_COLORS: Record<ArchaeologyChronologyType, string> = {
  construction: 'border-amber-400/50 bg-amber-400/10',
  destruction: 'border-red-400/55 bg-red-500/10',
  excavation: 'border-sky-400/50 bg-sky-400/10',
  rediscovery: 'border-emerald-400/50 bg-emerald-400/10',
  cultural_event: 'border-violet-400/50 bg-violet-400/10',
  conquest: 'border-rose-400/50 bg-rose-500/10',
};

const CHRONOLOGY_ICON: Record<ArchaeologyChronologyType, string> = {
  construction: '▲',
  destruction: '✕',
  excavation: '⛏',
  rediscovery: '◎',
  cultural_event: '◆',
  conquest: '⚔',
};

const MUSEUM_CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  athens: { lat: 37.98, lng: 23.72 },
  london: { lat: 51.51, lng: -0.13 },
  delphi: { lat: 38.48, lng: 22.5 },
  olympia: { lat: 37.64, lng: 21.63 },
  rome: { lat: 41.9, lng: 12.5 },
  luxor: { lat: 25.69, lng: 32.64 },
  cairo: { lat: 30.04, lng: 31.24 },
  giza: { lat: 29.98, lng: 31.13 },
  amesbury: { lat: 51.17, lng: -1.78 },
  'county meath': { lat: 53.7, lng: -6.5 },
  cusco: { lat: -13.53, lng: -71.97 },
  'mexico city': { lat: 19.43, lng: -99.13 },
  'phnom penh': { lat: 11.56, lng: 104.92 },
  magelang: { lat: -7.47, lng: 110.22 },
  tehran: { lat: 35.69, lng: 51.39 },
  baghdad: { lat: 33.31, lng: 44.36 },
  sanliurfa: { lat: 37.17, lng: 38.8 },
  moscow: { lat: 55.75, lng: 37.62 },
  selcuk: { lat: 37.95, lng: 27.37 },
  heraklion: { lat: 35.34, lng: 25.13 },
  naples: { lat: 40.85, lng: 14.27 },
  ankara: { lat: 39.93, lng: 32.85 },
  paris: { lat: 48.86, lng: 2.35 },
};

function museumMarkers(site: SiteData) {
  const archaeology = siteArchaeology(site);
  if (!archaeology) return [];
  return archaeology.museumConnections
    .map((museum, index) => {
      const key = museum.city.trim().toLowerCase();
      const coords = MUSEUM_CITY_COORDS[key];
      if (!coords) return null;
      return {
        id: `${museum.museumName}-${index}`,
        label: `${museum.museumName} (${museum.city})`,
        lat: coords.lat,
        lng: coords.lng,
        color: '#f0d58d',
      };
    })
    .filter((item): item is { id: string; label: string; lat: number; lng: number; color: string } => Boolean(item));
}

function artifactTypes(artifacts: ArchaeologyArtifactEntry[]) {
  return Array.from(new Set(artifacts.map((item) => item.type)));
}

function chronologyNumericValue(input: string): number {
  const normalized = String(input || '').replace(/–|—/g, '-').toLowerCase();
  const match = normalized.match(/(\d{1,4})/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const year = Number(match[1]);
  if (!Number.isFinite(year)) return Number.MAX_SAFE_INTEGER;
  if (normalized.includes('bce') || normalized.includes('bc') || normalized.includes('m.') || normalized.includes('mö')) {
    return -Math.abs(year);
  }
  return year;
}

function protectionBadge(status: string | null) {
  if (status === 'UNESCO') return 'UNESCO';
  if (status === 'national_heritage') return 'Ulusal Miras';
  if (status === 'local_protection') return 'Yerel Koruma';
  if (status === 'disputed') return 'Tartismali Koruma';
  return 'Koruma Durumu Belirsiz';
}

function excavationBadge(status: string | null) {
  if (status === 'active_excavation') return 'Devam eden kazi';
  if (status === 'completed') return 'Kazilar tamamlandi';
  if (status === 'protected') return 'Koruma altinda';
  if (status === 'unexcavated') return 'Henuz kazilmadi';
  if (status === 'inaccessible') return 'Erisim kisitli';
  return 'Durum bilinmiyor';
}

export default function SiteDetailTabs({
  site,
  mythologyName,
  historicalContext,
  visitorNote,
  connectedMyths,
  connectedDeities,
  nearbySites,
  sameMythologyTrail,
  sourceCount,
  lastUpdatedLabel,
}: SiteDetailTabsProps) {
  const [tab, setTab] = useState<TabKey>('overview');
  const [artifactTypeFilter, setArtifactTypeFilter] = useState<string>('all');
  const [selectedArtifact, setSelectedArtifact] = useState<ArchaeologyArtifactEntry | null>(null);

  const archaeology = siteArchaeology(site);
  const excavationStartYear = siteExcavationStartYear(site);
  const artifactCount = siteArtifactCount(site);
  const museumCount = siteMuseumCount(site);
  const excavationStatus = siteExcavationStatus(site);
  const protectionStatus = siteProtectionStatus(site);
  const hasForeignMuseums = siteHasForeignMuseumHoldings(site);

  const markers = useMemo(() => museumMarkers(site), [site]);
  const artifacts = useMemo(() => archaeology?.artifacts ?? [], [archaeology]);
  const inscriptions = useMemo(() => archaeology?.inscriptions ?? [], [archaeology]);
  const chronology = useMemo(
    () => [...(archaeology?.chronology ?? [])].sort((left, right) => chronologyNumericValue(left.period) - chronologyNumericValue(right.period)),
    [archaeology]
  );
  const excavations = useMemo(
    () =>
      [...(archaeology?.discoveryHistory.majorExcavations ?? [])].sort(
        (left, right) => chronologyNumericValue(left.year) - chronologyNumericValue(right.year)
      ),
    [archaeology]
  );
  const architectureModifications = useMemo(
    () =>
      [...(archaeology?.architecture.modifications ?? [])].sort(
        (left, right) => chronologyNumericValue(left.period) - chronologyNumericValue(right.period)
      ),
    [archaeology]
  );
  const types = useMemo(() => artifactTypes(artifacts), [artifacts]);
  const filteredArtifacts = useMemo(
    () => (artifactTypeFilter === 'all' ? artifacts : artifacts.filter((item) => item.type === artifactTypeFilter)),
    [artifactTypeFilter, artifacts]
  );

  useEffect(() => {
    if (!selectedArtifact) return;
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedArtifact(null);
    };
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [selectedArtifact]);

  return (
    <section className="section-container space-y-6 py-8">
      <div className="ancient-card p-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {(['overview', 'archaeology'] as TabKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-md border px-3 py-2 uppercase tracking-[0.14em] ${
                tab === key
                  ? 'border-gold/55 bg-gold/15 text-gold-light'
                  : 'border-gold/20 bg-black/25 text-foreground/70 hover:border-gold/35'
              }`}
            >
              {key === 'overview' ? 'Genel Bakis' : 'Arkeoloji'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && (
        <>
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              <div className="ancient-card p-6">
                <h2 className="mb-3 text-2xl text-gold">Description</h2>
                <p className="leading-relaxed text-foreground/80">{site.description}</p>
              </div>

              <div className="rounded-lg border-2 border-gold/45 bg-[#20160d]/80 p-6">
                <h3 className="text-xl text-gold">Arkeolojik Onem</h3>
                <p className="mt-2 text-foreground/80">
                  {site.significance ||
                    `${site.name} arkeolojik kayitlarda ${mythologyName || 'ilgili mitoloji'} geleneginin maddi izlerini tasir.`}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-gold/40 bg-black/30 px-3 py-1 text-gold-light">
                    {protectionBadge(protectionStatus)}
                  </span>
                  <span className="rounded-full border border-sky-400/35 bg-sky-400/10 px-3 py-1 text-sky-100">
                    {excavationBadge(excavationStatus)}
                  </span>
                  {excavationStatus === 'active_excavation' && (
                    <span className="animate-pulse rounded-full border border-emerald-400/45 bg-emerald-400/15 px-3 py-1 text-emerald-100">
                      Devam eden kazi
                    </span>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="ancient-card p-4">
                  <p className="meta-text text-xs uppercase tracking-[0.12em]">Kazi baslangici</p>
                  <p className="mt-2 text-2xl text-gold-light">{excavationStartYear ?? '-'}</p>
                </div>
                <div className="ancient-card p-4">
                  <p className="meta-text text-xs uppercase tracking-[0.12em]">Eser sayisi</p>
                  <p className="mt-2 text-2xl text-gold-light">{artifactCount}</p>
                </div>
                <div className="ancient-card p-4">
                  <p className="meta-text text-xs uppercase tracking-[0.12em]">Muze sayisi</p>
                  <p className="mt-2 text-2xl text-gold-light">{museumCount}</p>
                </div>
              </div>

              <div className="ancient-card p-6">
                <h3 className="mb-3 text-xl text-gold">Historical Context</h3>
                <div className="space-y-3">
                  {historicalContext.map((paragraph) => (
                    <p key={paragraph.slice(0, 24)} className="leading-relaxed text-foreground/75">
                      {paragraph}
                    </p>
                  ))}
                </div>
                {site.era && <p className="meta-text mt-3 text-xs uppercase tracking-[0.12em]">Era: {site.era}</p>}
              </div>

              <div className="ancient-card p-6">
                <h3 className="mb-3 text-xl text-gold">Visit Info</h3>
                <p className="text-foreground/75">{site.modernStatus || 'No modern visit note is available yet.'}</p>
              </div>

              {visitorNote && (
                <div className="parchment-callout rounded-md p-5">
                  <h3 className="text-lg text-gold">Ziyaretci notu</h3>
                  <p className="mt-2 text-foreground/80">"{visitorNote}"</p>
                </div>
              )}
            </div>

            <div className="space-y-6 lg:col-span-2">
              <div className="ancient-card p-4">
                <h3 className="mb-3 text-sm uppercase tracking-[0.2em] text-gold/80">Location Map</h3>
                <SiteLocationMap
                  center={site.coordinates}
                  label={site.name}
                  nearby={sameMythologyTrail.map((item) => ({
                    id: item.site.id,
                    label: item.site.name,
                    lat: item.site.coordinates.lat,
                    lng: item.site.coordinates.lng,
                  }))}
                />
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="meta-text text-xs">Koordinatlar</p>
                  <CopyCoordinates lat={site.coordinates.lat} lng={site.coordinates.lng} />
                </div>
              </div>
            </div>
          </div>

          <div className="ancient-card p-6">
            <h3 className="mb-4 text-xl text-gold">Connected Myths</h3>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {connectedMyths.map((myth) => (
                <HoverPrefetchLink key={myth.id} href={`/myth/${myth.id}`} className="rounded-md border border-gold/20 bg-gold/5 p-3">
                  <p className="text-gold-light">{myth.name}</p>
                  <p className="meta-text text-xs uppercase tracking-[0.12em]">{mythTypeLabel(myth.type)}</p>
                </HoverPrefetchLink>
              ))}
              {connectedMyths.length === 0 && <p className="text-sm text-foreground/60">No myth links are indexed yet.</p>}
            </div>
          </div>

          <div className="ancient-card p-6">
            <h3 className="mb-4 text-xl text-gold">Connected Deities</h3>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {connectedDeities.map((deity) => (
                <HoverPrefetchLink key={deity.id} href={`/deity/${deity.id}`} className="rounded-md border border-gold/20 bg-gold/5 p-3">
                  <p className="text-gold-light">{deity.name}</p>
                  <p className="meta-text text-xs uppercase tracking-[0.12em]">
                    {deity.domain.slice(0, 2).map((domain) => formatSlugLabel(domain)).join(' · ')}
                  </p>
                </HoverPrefetchLink>
              ))}
              {connectedDeities.length === 0 && <p className="text-sm text-foreground/60">No deity links are indexed yet.</p>}
            </div>
          </div>

          <div className="ancient-card p-6">
            <h3 className="mb-4 text-xl text-gold">Nearby Sites (within 1000 km)</h3>
            {nearbySites.length === 0 ? (
              <p className="text-sm text-foreground/60">No nearby sacred sites were found within 1000 km.</p>
            ) : (
              <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 scroll-fade-x">
                {nearbySites.map((item) => (
                  <HoverPrefetchLink
                    key={item.site.id}
                    href={`/site/${item.site.id}`}
                    className="min-w-[250px] snap-start overflow-hidden rounded-md border border-gold/20 bg-gold/5"
                  >
                    <div className="relative h-32">
                      <AncientImage src={item.site.imageUrl} alt={item.site.name} fill sizes="250px" className="h-full w-full object-cover" />
                    </div>
                    <div className="p-3">
                      <p className="text-sm text-gold-light">{item.site.name}</p>
                      <p className="meta-text text-xs uppercase tracking-[0.12em]">
                        {siteTypeLabel(item.site.type)} · {Math.round(item.distanceKm)} km
                      </p>
                    </div>
                  </HoverPrefetchLink>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'archaeology' && (
        <>
          <div className="ancient-card p-6">
            <h3 className="mb-4 text-2xl text-gold">Discovery Timeline</h3>
            {chronology.length === 0 ? (
              <p className="text-sm text-foreground/65">Bu site icin kronoloji kaydi henuz olusturulmadi.</p>
            ) : (
              <div className="relative space-y-3 pl-5">
                <div className="absolute bottom-0 left-1 top-0 w-px bg-gold/25" />
                {chronology.map((item, index) => (
                  <motion.div
                    key={`${item.period}-${index}`}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.35) }}
                    className={`relative rounded-lg border p-4 ${CHRONOLOGY_COLORS[item.type] || 'border-gold/25 bg-black/20'}`}
                  >
                    <div className="absolute -left-[22px] top-5 flex h-5 w-5 items-center justify-center rounded-full border border-gold/45 bg-background text-[10px] text-gold-light">
                      {CHRONOLOGY_ICON[item.type] || '•'}
                    </div>
                    <p className="text-xs uppercase tracking-[0.14em] text-gold/80">{item.period}</p>
                    <p className="mt-1 text-sm text-foreground/80">{item.event}</p>
                    <p className="meta-text mt-1 text-xs">{item.type}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="ancient-card p-6">
            <h3 className="mb-2 text-2xl text-gold">Kazi Tarihi</h3>
            <div className="mb-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-sky-400/35 bg-sky-400/10 px-3 py-1 text-sky-100">
                {excavationBadge(excavationStatus)}
              </span>
              <span className="rounded-full border border-gold/40 bg-black/25 px-3 py-1 text-gold-light">
                {protectionBadge(protectionStatus)}
              </span>
            </div>
            {excavations.length === 0 ? (
              <p className="text-sm text-foreground/65">Buyuk kazi kampanyasi kaydi henuz eklenmedi.</p>
            ) : (
              <div className="space-y-3">
                {excavations.map((entry, index) => (
                  <details key={`${entry.year}-${index}`} className="rounded-md border border-gold/20 bg-black/20 p-3">
                    <summary className="cursor-pointer text-sm text-gold-light">
                      {entry.year} · {entry.led_by} ({entry.institution})
                    </summary>
                    <p className="mt-2 text-sm text-foreground/75">{entry.findings}</p>
                  </details>
                ))}
              </div>
            )}
          </div>

          {artifacts.length > 0 && (
          <div className="ancient-card p-6">
            <h3 className="mb-3 text-2xl text-gold">Notable Artifacts Gallery</h3>
            {types.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setArtifactTypeFilter('all')}
                  className={`rounded-full border px-3 py-1 ${artifactTypeFilter === 'all' ? 'border-gold/45 bg-gold/10 text-gold-light' : 'border-gold/20 text-foreground/70'}`}
                >
                  all
                </button>
                {types.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setArtifactTypeFilter(type)}
                    className={`rounded-full border px-3 py-1 ${
                      artifactTypeFilter === type ? 'border-gold/45 bg-gold/10 text-gold-light' : 'border-gold/20 text-foreground/70'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}

            {filteredArtifacts.length === 0 ? <p className="text-sm text-foreground/65">Bu filtrede eser kaydi yok.</p> : <div className="columns-1 gap-4 md:columns-2 xl:columns-3">{filteredArtifacts.map((item) => (<button key={item.id} type="button" onClick={() => setSelectedArtifact(item)} className="mb-4 block w-full break-inside-avoid overflow-hidden rounded-lg border border-gold/20 bg-black/20 text-left"><div className="relative h-44 w-full"><AncientImage src={item.imageUrl} alt={item.name} fill sizes="(max-width: 1280px) 50vw, 33vw" className="h-full w-full object-cover" /></div><div className="space-y-1 p-3"><p className="text-sm text-gold-light">{item.name}</p><p className="meta-text text-xs uppercase tracking-[0.12em]">{item.type}</p><p className="text-xs text-foreground/65">{item.period}</p><p className="text-xs text-foreground/65">{item.currentLocation}</p></div></button>))}</div>}

            {hasForeignMuseums && (
              <p className="mt-2 text-sm text-foreground/70">
                Bu eserlerin bir kismi yurt disindaki muzelerde bulunmaktadir.
              </p>
            )}
          </div>
          )}

          {inscriptions.length > 0 && (
            <div className="ancient-card p-6">
              <h3 className="mb-3 text-2xl text-gold">Inscriptions</h3>
              <div className="grid gap-3 lg:grid-cols-2">
                {inscriptions.map((item) => (
                  <article key={item.id} className="rounded-lg border border-gold/20 bg-black/20 p-4">
                    <p className="font-serif text-sm leading-7 text-gold-light">{item.text}</p>
                    <p className="mt-2 italic text-sm text-foreground/75">{item.translation}</p>
                    <p className="meta-text mt-2 text-xs uppercase tracking-[0.12em]">
                      {item.language} · {item.period}
                    </p>
                    <p className="mt-2 text-sm text-foreground/70">{item.significance}</p>
                    <p className="meta-text mt-1 text-xs">Scholar: {item.scholar}</p>
                  </article>
                ))}
              </div>
            </div>
          )}

          <div className="ancient-card p-6">
            <h3 className="mb-3 text-2xl text-gold">Architecture Deep Dive</h3>
            {archaeology ? (
              <div className="space-y-4">
                <p className="text-sm text-foreground/80">{archaeology.architecture.originalStructure}</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-md border border-gold/20 bg-black/20 p-3 text-xs">
                    <p className="meta-text">Donem</p>
                    <p className="mt-1 text-gold-light">{archaeology.architecture.constructionPeriod}</p>
                  </div>
                  <div className="rounded-md border border-gold/20 bg-black/20 p-3 text-xs">
                    <p className="meta-text">Boyut</p>
                    <p className="mt-1 text-gold-light">{archaeology.architecture.dimensions}</p>
                  </div>
                  <div className="rounded-md border border-gold/20 bg-black/20 p-3 text-xs">
                    <p className="meta-text">Malzemeler</p>
                    <p className="mt-1 text-gold-light">{archaeology.architecture.materials.join(', ') || '-'}</p>
                  </div>
                  <div className="rounded-md border border-gold/20 bg-black/20 p-3 text-xs">
                    <p className="meta-text">Teknik</p>
                    <p className="mt-1 text-gold-light">{archaeology.architecture.constructionTechnique}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {architectureModifications.map((item) => (
                    <div key={`${item.period}-${item.description.slice(0, 16)}`} className="rounded-md border border-gold/20 bg-black/20 p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-gold/80">{item.period}</p>
                      <p className="mt-1 text-sm text-foreground/75">{item.description}</p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-gold/20 bg-black/20 p-4">
                    <p className="meta-text text-xs uppercase tracking-[0.12em]">O zaman nasildi</p>
                    <p className="mt-2 text-sm text-foreground/75">{archaeology.architecture.originalStructure}</p>
                  </div>
                  <div className="rounded-lg border border-gold/20 bg-black/20 p-4">
                    <p className="meta-text text-xs uppercase tracking-[0.12em]">Simdi nasil</p>
                    <p className="mt-2 text-sm text-foreground/75">{archaeology.architecture.currentState}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground/65">Mimari veri bulunamadi.</p>
            )}
          </div>

          <div className="ancient-card p-6">
            <h3 className="mb-3 text-2xl text-gold">Bu alandan cikan eserler hangi muzelerde?</h3>
            {archaeology && archaeology.museumConnections.length > 0 ? (
              <>
                <div className="grid gap-3 lg:grid-cols-2">
                  {archaeology.museumConnections.map((museum) => (
                    <article key={`${museum.museumName}-${museum.city}`} className="rounded-lg border border-gold/20 bg-black/20 p-4">
                      <p className="text-sm text-gold-light">{museum.museumName}</p>
                      <p className="meta-text mt-1 text-xs uppercase tracking-[0.12em]">
                        {museum.city} · {museum.country}
                      </p>
                      <p className="mt-2 text-xs text-foreground/70">Yaklasik eser: {museum.artifactCount}</p>
                      <p className="mt-2 text-xs text-foreground/70">{museum.notableArtifacts.join(', ')}</p>
                      <a
                        href={museum.collectionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex rounded-full border border-gold/35 px-3 py-1 text-xs text-gold-light hover:bg-gold/10"
                      >
                        Koleksiyon sayfasi
                      </a>
                    </article>
                  ))}
                </div>
                {markers.length > 0 && <MiniWorldMap title="Muze Dagilimi" markers={markers} className="mt-4" />}
              </>
            ) : (
              <p className="text-sm text-foreground/65">Muze baglantisi kaydi bulunmuyor.</p>
            )}
          </div>
        </>
      )}

      <footer className="rounded-md border border-gold/20 bg-black/20 p-4 text-sm text-foreground/75">
        Bu sayfadaki bilgiler {sourceCount.primary} birincil, {sourceCount.secondary} ikincil
        kaynaktan derlenmistir. <span className="text-gold-light">Son guncelleme:</span>{' '}
        {lastUpdatedLabel}
      </footer>

      <Modal
        open={Boolean(selectedArtifact)}
        onClose={() => setSelectedArtifact(null)}
        title={selectedArtifact?.name}
        description={selectedArtifact ? `${selectedArtifact.type} · ${selectedArtifact.period}` : undefined}
        panelClassName="max-w-3xl"
      >
        {selectedArtifact ? <div className="space-y-4"><div className="relative h-72 overflow-hidden rounded-card border border-gold/20"><AncientImage src={selectedArtifact.imageUrl} alt={selectedArtifact.name} fill sizes="100vw" className="h-full w-full object-cover" /></div><p className="text-sm text-foreground/75">{selectedArtifact.description}</p><p className="text-sm text-foreground/75">{selectedArtifact.mythologicalSignificance}</p><p className="text-xs text-foreground/70">{selectedArtifact.currentLocation}</p><a href={selectedArtifact.museumUrl} target="_blank" rel="noopener noreferrer" className="app-button app-button-secondary min-h-10 px-4 text-xs uppercase tracking-[0.12em]">Muzede gor</a></div> : null}
      </Modal>
    </section>
  );
}
