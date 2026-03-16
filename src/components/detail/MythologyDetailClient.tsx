'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AncientImage from '@/components/common/AncientImage';
import HoverPrefetchLink from '@/components/common/HoverPrefetchLink';
import MythDNA from '@/components/MythDNA';
import MiniWorldMap from '@/components/detail/MiniWorldMap';
import MythologyInfluenceMiniGraph from '@/components/detail/MythologyInfluenceMiniGraph';
import TimelineChart from '@/components/detail/TimelineChart';
import BackButton from '@/components/ui/BackButton';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import Modal from '@/components/ui/Modal';
import { mythById, mythParallelIds, type DeityData, type MythData, type MythologyBundle, type MythologyBundleSection } from '@/lib/myth-data';
import { domainIcon, formatSlugLabel, haversineKm, mythTypeLabel, siteTypeLabel } from '@/lib/myth-utils';

type TabKey = 'overview' | 'pantheon' | 'stories' | 'sites' | 'interactions' | 'parallels';
type PantheonSort = 'importance' | 'domain' | 'type';

interface ConceptComparisonRow {
  id: string;
  label: string;
  baseHas: boolean;
  compareHas: boolean;
}

export interface SimilarMythologyCardData {
  id: string;
  name: string;
  region: string;
  era: string;
  color: string;
  imageUrl: string;
  distanceKm: number;
  sharedThemes: string[];
  sharedConcepts: string[];
  comparison: ConceptComparisonRow[];
}

interface MythologyDetailClientProps {
  bundle: MythologyBundle;
  similarMythologies: SimilarMythologyCardData[];
}

const TAB_LABELS: Record<TabKey, string> = {
  overview: 'Genel Bakis',
  pantheon: 'Panteon',
  stories: 'Mitler',
  sites: 'Kutsal Mekanlar',
  interactions: 'Etkilesimler',
  parallels: 'Paraleller',
};

const SECTION_LABELS: Record<MythologyBundleSection, string> = {
  myths: 'mitler',
  deities: 'tanrilar',
  sites: 'kutsal mekanlar',
  connections: 'etki baglantilari',
  parallels: 'paralel kulturler',
  comparable: 'karsilastirma verisi',
};

const READING_LISTS: Record<string, string[]> = {
  greek: ['Hesiod - Theogony', 'Homeric Hymns', 'Robert Graves - The Greek Myths'],
  egyptian: ['The Egyptian Book of the Dead', 'Jan Assmann - The Search for God in Ancient Egypt', 'Geraldine Pinch - Egyptian Mythology'],
  norse: ['The Poetic Edda', 'The Prose Edda', 'Neil Gaiman - Norse Mythology'],
  hindu: ['Rigveda (selected hymns)', 'The Mahabharata', 'Devdutt Pattanaik - Myth = Mithya'],
  mesopotamian: ['Epic of Gilgamesh', 'Enuma Elish', 'Stephanie Dalley - Myths from Mesopotamia'],
};

const QUALITY_LABELS = { complete: 'Tam', partial: 'Kismi', sparse: 'Sinirli' } as const;
const MYTH_TYPE_ACCENT: Record<string, string> = { creation: '#d4af37', hero: '#4c9eff', trickster: '#f08c28', love: '#d16ba5', war: '#d95b5b', afterlife: '#8c7ae6', nature: '#4cbf71', cosmology: '#00b3b8', transformation: '#e67e22', quest: '#5dade2' };

function deityImportance(deity: DeityData): number {
  return deity.myths.length * 3 + deity.domain.length * 2 + deity.equivalents.length;
}

function cultureFlag(id: string): string {
  return { greek: 'GR', egyptian: 'EG', norse: 'NO', hindu: 'IN', roman: 'RO', mesopotamian: 'ME', chinese: 'CN', japanese: 'JP' }[id] || 'MY';
}

function EmptyState({ title, body, note }: { title: string; body: string; note?: string }) {
  return <div className="ancient-card p-6"><h3 className="text-xl text-gold">{title}</h3><p className="mt-2 text-sm text-foreground/70">{body}</p>{note ? <p className="mt-3 text-xs text-foreground/55">{note}</p> : null}</div>;
}

function Metric({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return <div className="rounded-lg border border-gold/20 bg-black/20 p-3"><p className="text-[11px] uppercase tracking-[0.12em] text-foreground/55">{label}</p><p className="mt-1 text-xl text-gold-light">{value}</p>{hint ? <p className="mt-1 text-[11px] text-foreground/50">{hint}</p> : null}</div>;
}

export default function MythologyDetailClient({ bundle, similarMythologies }: MythologyDetailClientProps) {
  const { mythology, myths, deities, sites, datasetCounts, completeness, missingSections, safeInfluence } = bundle;
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [mythFilter, setMythFilter] = useState('all');
  const [pantheonSort, setPantheonSort] = useState<PantheonSort>('importance');
  const [selectedDeity, setSelectedDeity] = useState<DeityData | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const tabsAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => setUserCoords({ lat: position.coords.latitude, lng: position.coords.longitude }), () => undefined, { timeout: 5000 });
  }, []);

  useEffect(() => {
    if (!tabsAnchorRef.current) return;
    tabsAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeTab]);

  const mythTypes = useMemo(() => Array.from(new Set(myths.map((item) => item.type))).sort(), [myths]);
  const filteredMyths = useMemo(() => myths.filter((item) => mythFilter === 'all' || item.type === mythFilter), [mythFilter, myths]);
  const sortedDeities = useMemo(() => {
    const items = [...deities];
    if (pantheonSort === 'type') return items.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
    if (pantheonSort === 'domain') return items.sort((a, b) => (a.domain[0] || '').localeCompare(b.domain[0] || '') || a.name.localeCompare(b.name));
    return items.sort((a, b) => deityImportance(b) - deityImportance(a) || a.name.localeCompare(b.name));
  }, [deities, pantheonSort]);
  const topPowerDeities = useMemo(() => [...deities].sort((a, b) => b.myths.length - a.myths.length).slice(0, 5), [deities]);
  const readingList = READING_LISTS[mythology.id] || [`${mythology.name} - Primary sources`, `${mythology.name} - Comparative studies`, `${mythology.name} - Cultural context`];
  const missingText = missingSections.map((section) => SECTION_LABELS[section]).join(', ');
  const qualityLabel = QUALITY_LABELS[completeness.label];
  const closestParallel = similarMythologies[0] || null;
  const tabItems = Object.keys(TAB_LABELS) as TabKey[];
  const activeTabIndex = tabItems.indexOf(activeTab);

  return (
    <>
      <section className="hero-vignette relative min-h-[58vh] overflow-hidden">
        <AncientImage src={mythology.imageUrl} alt={mythology.name} fill priority sizes="100vw" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/60 to-background" />
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10 section-container flex min-h-[58vh] flex-col justify-between pb-10 pt-20">
          <div className="flex flex-col gap-4 pt-4 md:flex-row md:items-center md:justify-between">
            <Breadcrumbs
              items={[
                { label: 'Ana Sayfa', href: '/' },
                { label: 'Mitolojiler', href: '/discover' },
                { label: mythology.name },
              ]}
            />
            <BackButton />
          </div>
          <div className="mt-auto">
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-4xl font-bold text-gold md:text-6xl">{mythology.name}</motion.h1>
            <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em]">
              <span className="rounded-full border border-gold/30 bg-black/35 px-3 py-1 text-gold-light">{mythology.region}</span>
              <span className="rounded-full border border-gold/25 bg-black/25 px-3 py-1 text-foreground/75">Veri durumu: {qualityLabel}</span>
              <span className="rounded-full border border-gold/25 bg-black/25 px-3 py-1 text-foreground/75">{datasetCounts.myths} mit</span>
              <span className="rounded-full border border-gold/25 bg-black/25 px-3 py-1 text-foreground/75">{datasetCounts.deities} tanri</span>
              <span className="rounded-full border border-gold/25 bg-black/25 px-3 py-1 text-foreground/75">{datasetCounts.sites} mekan</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section-container py-8">
        <div ref={tabsAnchorRef} className="relative mb-7 border-b border-gold/15 pb-4">
          <span className="absolute bottom-0 left-0 h-[2px] rounded-full bg-gold transition-all duration-300" style={{ width: `${100 / tabItems.length}%`, transform: `translateX(${Math.max(0, activeTabIndex) * 100}%)` }} />
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
            {tabItems.map((key) => <button key={key} type="button" onClick={() => setActiveTab(key)} className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.14em] ${activeTab === key ? 'border-gold/60 bg-gold/15 text-gold-light' : 'border-gold/20 bg-gold/5 text-foreground/65'}`}>{TAB_LABELS[key]}</button>)}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 lg:grid-cols-5">
              <div className="space-y-6 lg:col-span-3">
                <div className="ancient-card p-6"><h2 className="mb-3 text-2xl text-gold">Tanim ve onem</h2><p className="text-foreground/75">{mythology.description}</p><p className="mt-3 text-foreground/65">{mythology.significance}</p></div>
                <div className="ancient-card p-6"><h3 className="mb-4 text-xl text-gold">Veri durumu</h3><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Kanonik panteon" value={datasetCounts.canonicalPantheonSize} hint="Mitolojik olcekte beklenen genislik" /><Metric label="Kayitli mit" value={datasetCounts.myths} /><Metric label="Kayitli tanri" value={datasetCounts.deities} /><Metric label="Kayitli mekan" value={datasetCounts.sites} /></div><div className="mt-4 rounded-lg border border-gold/20 bg-black/20 p-4 text-sm text-foreground/70">{missingSections.length > 0 ? `Henuz tamamlanmayan alanlar: ${missingText}.` : 'Tum temel detail alanlari veri setinde mevcut.'}</div></div>
                <div className="ancient-card p-6"><h3 className="mb-4 text-xl text-gold">Okuma listesi</h3><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{readingList.map((book) => <article key={book} className="rounded-md border border-gold/20 bg-black/20 p-4"><div className="flex h-16 w-12 items-center justify-center rounded-md border border-gold/25 bg-elevated text-2xl text-gold-light">✦</div><p className="mt-3 text-sm text-primary">{book}</p><p className="mt-1 text-xs text-secondary">Kapak gorseli yoksa stilize yer tutucu gosterilir.</p></article>)}</div></div>
              </div>
              <div className="space-y-6 lg:col-span-2"><TimelineChart era={mythology.era} /><MiniWorldMap title="Mitolojinin cografi cekirdegi" markers={[{ id: mythology.id, label: mythology.name, lat: mythology.origin.lat, lng: mythology.origin.lng, color: mythology.color }]} highlightBox={mythology.boundingBox} /></div>
            </motion.div>
          )}

          {activeTab === 'pantheon' && (
            <motion.div key="pantheon" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {!completeness.hasDeities ? <EmptyState title="Panteon verisi henuz tamamlanmadi" body="Bu mitoloji icin tanri/tanrica kayitlari veri setinde henuz yeterli kapsama ulasmadi." note="Panteon sekmesi sadece dogrulanmis kayitlar geldikce dolar." /> : <>
                <div className="flex items-center justify-between gap-3"><h2 className="text-2xl text-gold">Panteon</h2><select value={pantheonSort} onChange={(event) => setPantheonSort(event.target.value as PantheonSort)} className="rounded-md border border-gold/30 bg-ink/70 px-2 py-1 text-xs text-foreground"><option value="importance">Oneme gore</option><option value="domain">Alana gore</option><option value="type">Ture gore</option></select></div>
                <div className="ancient-card p-5"><h3 className="mb-3 text-lg text-gold">En gorunur figurler</h3><div className="grid gap-2 md:grid-cols-2">{topPowerDeities.map((deity, index) => <div key={deity.id} className="rounded-md border border-gold/20 bg-black/20 px-3 py-2 text-sm text-foreground/75"><span className="text-gold-light">#{index + 1} {deity.name}</span><span className="ml-2 text-xs text-foreground/55">{deity.myths.length} mit ile bagli</span></div>)}</div></div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{sortedDeities.map((deity) => <button key={deity.id} type="button" onClick={() => setSelectedDeity(deity)} title={deity.description} className="ancient-card overflow-hidden text-left"><div className="relative h-40 overflow-hidden"><AncientImage src={deity.imageUrl} alt={deity.name} fill sizes="(max-width: 1280px) 50vw, 33vw" className="h-full w-full object-cover opacity-80" /></div><div className="p-4"><h3 className="text-lg text-gold">{deity.name}</h3><p className="mt-1 text-xs text-foreground/55">{deity.equivalents.length} kulturde esdeger bag</p><div className="mt-3 grid grid-cols-3 gap-2">{deity.domain.slice(0, 3).map((domain) => <div key={`${deity.id}-${domain}`} className="text-center"><p className="text-lg text-gold-light">{domainIcon(domain)}</p><p className="text-[10px] text-foreground/65">{formatSlugLabel(domain)}</p></div>)}</div></div></button>)}</div>
              </>}
            </motion.div>
          )}

          {activeTab === 'stories' && (
            <motion.div key="stories" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {!completeness.hasMyths ? <EmptyState title="Mit verisi henuz tamamlanmadi" body="Bu mitoloji icin anlati kayitlari veri setinde henuz yeterli kapsama ulasmadi." note="Paralel baglantilar ve DNA kartlari dogrulanmis mitler geldikce acilir." /> : <>
                <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setMythFilter('all')} className="rounded-full border border-gold/20 px-3 py-1 text-xs">Tum mitler</button>{mythTypes.map((type) => <button key={type} type="button" onClick={() => setMythFilter(type)} className="rounded-full border border-gold/20 px-3 py-1 text-xs">{mythTypeLabel(type)}</button>)}</div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filteredMyths.map((myth) => { const parallelIds = mythParallelIds(myth); const firstParallels = myth.parallels.slice(0, 2).map((reference) => typeof reference === 'string' ? reference : reference.mythId).map((id) => mythById.get(id)).filter(Boolean) as MythData[]; const cultureCount = new Set([mythology.id, ...parallelIds.map((id) => mythById.get(id)?.mythologyId).filter((value): value is string => Boolean(value))]).size; return <HoverPrefetchLink key={myth.id} href={`/myth/${myth.id}`} className="group ancient-card overflow-hidden" style={{ borderLeft: `3px solid ${MYTH_TYPE_ACCENT[myth.type] || '#c9a84c'}` }}><div className="relative h-44 overflow-hidden"><AncientImage src={myth.imageUrl} alt={myth.name} fill sizes="(max-width: 1280px) 50vw, 33vw" className="h-full w-full object-cover opacity-80" /></div><div className="space-y-2 p-4"><h3 className="text-lg text-gold">{myth.name}</h3><div className="flex flex-wrap gap-1.5">{myth.themes.slice(0, 3).map((theme) => <span key={`${myth.id}-${theme}`} className="rounded-full border border-gold/20 px-2 py-0.5 text-[11px] text-foreground/65">{formatSlugLabel(theme)}</span>)}{cultureCount >= 5 ? <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] text-gold-light">Evrensel tema</span> : null}</div><div className="flex items-center gap-2 text-xs text-foreground/65">{firstParallels.map((item) => <span key={`${myth.id}-${item.id}`} className="rounded-full border border-gold/15 px-2 py-0.5">{cultureFlag(item.mythologyId)} {item.name.slice(0, 10)}</span>)}</div><p className="line-clamp-1 text-xs text-foreground/0 transition-colors group-hover:text-foreground/70">{myth.summary}</p><div className="pt-1"><MythDNA myth={myth} size="mini" showRadar={false} showFingerprint={false} showHoverLegend /></div></div></HoverPrefetchLink>; })}</div>
              </>}
            </motion.div>
          )}

          {activeTab === 'sites' && (
            <motion.div key="sites" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {!completeness.hasSites ? <EmptyState title="Kutsal mekan verisi henuz tamamlanmadi" body="Bu mitoloji icin site kayitlari veri setinde henuz yeterli kapsama ulasmadi." note="Harita ve rota kartlari dogrulanmis mekan kaydi geldikce dolar." /> : <>
                <MiniWorldMap title="Kutsal mekan haritasi" markers={sites.map((site) => ({ id: site.id, label: site.name, lat: site.coordinates.lat, lng: site.coordinates.lng, color: mythology.color }))} />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{sites.map((site) => { const lost = /ruin|destroyed|lost|abandoned/i.test(site.modernStatus || ''); const distance = userCoords ? Math.round(haversineKm(userCoords, site.coordinates)) : null; return <HoverPrefetchLink key={site.id} href={`/site/${site.id}`} className="group ancient-card overflow-hidden"><div className="relative h-40 overflow-hidden"><AncientImage src={site.imageUrl} alt={site.name} fill sizes="(max-width: 1280px) 50vw, 33vw" className="h-full w-full object-cover opacity-80" /><span className={`absolute left-2 top-2 rounded-full border px-2 py-1 text-[10px] ${lost ? 'border-red-300/35 bg-red-500/10 text-red-200' : 'border-emerald-300/35 bg-emerald-500/10 text-emerald-200'}`}>{lost ? 'Tarihe karismis' : 'Hala mevcut'}</span></div><div className="space-y-2 p-4"><h3 className="text-lg text-gold">{site.name}</h3><p className="text-xs uppercase tracking-[0.12em] text-foreground/55">{siteTypeLabel(site.type)} · {site.country || 'Konum bilgisi eksik'}</p>{distance != null ? <p className="text-xs text-foreground/60">Size uzaklik: {distance} km</p> : null}<p className="line-clamp-3 text-sm text-foreground/65">{site.description}</p><p className="text-[11px] text-foreground/0 transition-colors group-hover:text-foreground/65">{site.coordinates.lat.toFixed(3)}, {site.coordinates.lng.toFixed(3)}</p></div></HoverPrefetchLink>; })}</div>
              </>}
            </motion.div>
          )}

          {activeTab === 'interactions' && (
            <motion.div key="interactions" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {!completeness.hasConnections ? <EmptyState title="Etkilesim verisi henuz tamamlanmadi" body="Bu mitoloji icin dogrulanmis etki akisi kaydi bulunmuyor." note="Bu alan sadece kaynakli giris-cikis baglantilari oldugunda gosterilir." /> : <>
                <div className="ancient-card p-6"><h2 className="mb-2 text-2xl text-gold">Etkilesimler</h2><p className="text-sm text-foreground/70">Bu alan, secili mitolojinin bir adimlik etki agini gosterir: kimleri etkiledi ve kimlerden etkilendi.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><Metric label="Etkiledigi kultur" value={safeInfluence.outgoing.length} /><Metric label="Etkilendigi kultur" value={safeInfluence.incoming.length} /></div></div>
                <MythologyInfluenceMiniGraph mythologyId={mythology.id} />
              </>}
            </motion.div>
          )}

          {activeTab === 'parallels' && (
            <motion.div key="parallels" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {similarMythologies.length === 0 ? <EmptyState title="Paralel kultur verisi henuz tamamlanmadi" body="Bu mitoloji icin guvenli paralel veya karsilastirma verisi bulunmuyor." note="Sekme yalnizca dogrulanmis paralel anlatilar veya etki baglantilari oldugunda dolar." /> : <>
                <div className="ancient-card p-6"><h2 className="mb-2 text-2xl text-gold">Paralel kulturler</h2><p className="text-sm text-foreground/70">Kartlar yalnizca guvenli paralel anlatilar veya dogrulanmis etki baglantilarindan uretilir.</p></div>
                {closestParallel ? <div className="ancient-card p-6"><h3 className="mb-3 text-xl text-gold">En yakin paralel kume</h3><svg viewBox="0 0 360 220" className="mx-auto w-full max-w-xl"><circle cx="140" cy="110" r="70" fill="rgba(201,168,76,0.25)" stroke="rgba(201,168,76,0.6)" /><circle cx="220" cy="110" r="70" fill="rgba(122,215,244,0.23)" stroke="rgba(122,215,244,0.65)" /><text x="180" y="110" fill="#fff0c7" fontSize="12" textAnchor="middle">{closestParallel.sharedThemes.length}</text></svg></div> : null}
                <div className="space-y-4">{similarMythologies.map((item) => <div key={item.id} className="ancient-card overflow-hidden"><div className="grid gap-0 lg:grid-cols-3"><div className="relative h-48 lg:h-full"><AncientImage src={item.imageUrl} alt={item.name} fill sizes="(max-width: 1280px) 40vw, 25vw" className="h-full w-full object-cover opacity-80" /></div><div className="space-y-3 p-5 lg:col-span-2"><div className="flex flex-wrap items-center gap-2 text-xs text-foreground/60"><span className="rounded-full border border-gold/25 px-2 py-1">{item.region}</span><span className="rounded-full border border-gold/25 px-2 py-1">{item.era}</span><span className="rounded-full border border-gold/25 px-2 py-1">{Math.round(item.distanceKm)} km</span></div><h3 className="text-xl text-gold"><HoverPrefetchLink href={`/mythology/${item.id}`}>{item.name}</HoverPrefetchLink></h3><div className="flex flex-wrap gap-2">{(item.sharedConcepts.length > 0 ? item.sharedConcepts : item.sharedThemes.map((theme) => formatSlugLabel(theme))).slice(0, 4).map((concept) => <span key={`${item.id}-${concept}`} className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-xs text-gold-light">{concept}</span>)}</div><div className="grid gap-2 sm:grid-cols-2">{item.comparison.filter((row) => row.baseHas || row.compareHas).slice(0, 4).map((row) => <div key={`${item.id}-${row.id}`} className="rounded-md border border-gold/15 bg-black/20 px-3 py-2 text-xs text-foreground/70"><span className="text-gold-light">{row.label}</span><span className="ml-2">{row.baseHas && row.compareHas ? 'ortak' : row.compareHas ? 'sadece karsida' : 'sadece burada'}</span></div>)}</div></div></div></div>)}</div>
              </>}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <Modal
        open={Boolean(selectedDeity)}
        onClose={() => setSelectedDeity(null)}
        title={selectedDeity?.name}
        description="Panteon ici hizli profil gorunumu"
        panelClassName="max-w-2xl"
      >
        {selectedDeity ? <div className="space-y-4"><div className="relative h-56 overflow-hidden rounded-card border border-gold/20"><AncientImage src={selectedDeity.imageUrl} alt={selectedDeity.name} fill sizes="(max-width: 1024px) 92vw, 640px" className="h-full w-full object-cover" /></div><p className="leading-relaxed text-foreground/70">{selectedDeity.description}</p><HoverPrefetchLink href={`/deity/${selectedDeity.id}`} className="app-button app-button-secondary min-h-10 px-4 text-xs uppercase tracking-[0.14em]">Tanri detayini ac</HoverPrefetchLink></div> : null}
      </Modal>
    </>
  );
}
