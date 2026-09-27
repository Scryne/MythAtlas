'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import AncientImage from '@/components/common/AncientImage';
import HoverPrefetchLink from '@/components/common/HoverPrefetchLink';
import MiniWorldMap from '@/components/detail/MiniWorldMap';
import {
  mythologyById,
  sacredSites,
  siteArtifactCount,
  siteProtectionStatus,
  siteWorldHeritage,
} from '@/lib/myth-data';

const ArchaeologyHubCharts = dynamic(
  () => import('@/components/archaeology/ArchaeologyHubCharts'),
  {
    ssr: false,
    loading: () => (
      <section className="ancient-card p-6">
        <h2 className="text-2xl text-gold">Timeline of Discovery</h2>
        <p className="meta-text mt-1 text-sm">Grafikler yukleniyor...</p>
        <div className="mt-4 h-[360px] rounded-md border border-gold/20 bg-black/20" />
      </section>
    ),
  }
);

interface MuseumAggregate {
  id: string;
  museumName: string;
  city: string;
  country: string;
  collectionUrl: string;
  artifactCount: number;
  siteIds: string[];
}

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  athens: { lat: 37.98, lng: 23.72 },
  london: { lat: 51.51, lng: -0.13 },
  rome: { lat: 41.9, lng: 12.5 },
  luxor: { lat: 25.69, lng: 32.64 },
  cairo: { lat: 30.04, lng: 31.24 },
  giza: { lat: 29.98, lng: 31.13 },
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
  delphi: { lat: 38.48, lng: 22.5 },
  olympia: { lat: 37.64, lng: 21.63 },
};

const SIGNIFICANT_FINDS = [
  {
    id: 'rosetta-stone',
    name: 'Rosetta Stone',
    period: '196 BCE',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Rosetta_Stone.JPG',
    discoveryStory: 'Discovered in 1799, it enabled decipherment of Egyptian hieroglyphs.',
    significance: 'Unlocked textual access to Egyptian myth and religious vocabulary.',
  },
  {
    id: 'gilgamesh-tablets',
    name: 'Epic of Gilgamesh Tablets',
    period: '2nd millennium BCE copies',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Sumerian_cuneiform_tablet.jpg',
    discoveryStory: 'Recovered from Nineveh library excavations in the 19th century.',
    significance: 'Reframed flood myth transmission and Mesopotamian narrative depth.',
  },
  {
    id: 'linear-b',
    name: 'Linear B Tablets',
    period: 'Late Bronze Age',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Linear_B_tablet_Knossos.jpg',
    discoveryStory: 'Excavated at Knossos and Pylos, deciphered in the 1950s.',
    significance: 'Connected Aegean archaeology with early Greek linguistic history.',
  },
  {
    id: 'antikythera',
    name: 'Antikythera Mechanism',
    period: 'c. 2nd century BCE',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/76/NAMA_Machine_d%27Anticyth%C3%A8re_1.jpg',
    discoveryStory: 'Recovered from a shipwreck in 1901.',
    significance: 'Changed assumptions about ancient cosmological instrumentation.',
  },
  {
    id: 'dead-sea-scrolls',
    name: 'Dead Sea Scrolls',
    period: '3rd century BCE-1st century CE',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Dead_Sea_Scrolls.jpg',
    discoveryStory: 'Found in Qumran caves from 1947 onward.',
    significance: 'Expanded context for apocalyptic and mythic-religious traditions.',
  },
  {
    id: 'tutankhamun-mask',
    name: 'Mask of Tutankhamun',
    period: 'c. 1323 BCE',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7f/CairoEgMuseumTaaMaskMostlyPhotographed.jpg',
    discoveryStory: 'Discovered by Howard Carter in 1922 in KV62, Valley of the Kings.',
    significance: 'Provides material evidence for Egyptian afterlife ideology and royal mythic kingship.',
  },
  {
    id: 'gobekli-tepe-pillars',
    name: 'Göbekli Tepe T-pillars',
    period: 'c. 9600-8200 BCE',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/38/G%C3%B6bekli_Tepe_site_%282%29.jpg',
    discoveryStory: 'Systematic excavations from the 1990s revealed monumental ritual enclosures.',
    significance: 'Reshaped narratives about early ritual spaces and prehistoric symbolic systems.',
  },
  {
    id: 'codex-borgia',
    name: 'Codex Borgia',
    period: 'Pre-Columbian (Postclassic)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d2/Codex_Borgia_page_53.jpg',
    discoveryStory: 'Preserved in Europe and studied as a key ritual-divinatory manuscript.',
    significance: 'Core visual source for Central Mexican cosmology, gods, and ritual calendars.',
  },
  {
    id: 'codex-borbonicus',
    name: 'Codex Borbonicus',
    period: 'Early colonial copy of pre-Hispanic tradition',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Codex_Borbonicus_page_13.jpg',
    discoveryStory: 'Identified in European collections and later interpreted by Mesoamericanists.',
    significance: 'Preserves Aztec calendrical-mythic cycles and priestly ritual structure.',
  },
  {
    id: 'gundestrup-cauldron',
    name: 'Gundestrup Cauldron',
    period: 'c. 2nd-1st century BCE',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Gundestrupkedlen.jpg',
    discoveryStory: 'Found in 1891 in a peat bog in Denmark.',
    significance: 'Important iconographic source for Celtic mythic motifs and divine imagery.',
  },
  {
    id: 'parthenon-frieze',
    name: 'Parthenon Frieze',
    period: '5th century BCE',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Parthenon_frieze_BM.jpg',
    discoveryStory: 'Recovered in fragments from the Acropolis and later museum collections.',
    significance: 'Links civic ritual, divine order, and Athena-centered Athenian identity.',
  },
  {
    id: 'ishtar-gate-reliefs',
    name: 'Ishtar Gate Relief Bricks',
    period: 'c. 575 BCE',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Babylon_Ishtar_Gate.jpg',
    discoveryStory: 'Excavated in Babylon and reconstructed in Berlin.',
    significance: 'Demonstrates imperial theology and mythic animal symbolism in Babylonian state cult.',
  },
  {
    id: 'eleusis-curse-tablets',
    name: 'Orphic and Gold Funerary Tablets',
    period: '4th-2nd century BCE',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/63/Orphic_gold_tablet_Hipponion.jpg',
    discoveryStory: 'Discovered across Greek and Magna Graecia burial contexts.',
    significance: 'Direct textual evidence for afterlife belief and initiatory mythic formulas.',
  },
  {
    id: 'popol-vuh-manuscript',
    name: 'Popol Vuh Manuscript Tradition',
    period: '16th-18th century copies of older traditions',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Popol_Vuh.jpg',
    discoveryStory: 'Copied in colonial Guatemala and preserved through later archival transmission.',
    significance: 'Principal textual source for Kʼicheʼ Maya creation and hero-twin myth cycles.',
  },
  {
    id: 'knossos-snake-goddess',
    name: 'Knossos Snake Goddess Figurines',
    period: 'c. 1600 BCE',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/80/Minoan_Snake_Goddess_Heraklion.jpg',
    discoveryStory: 'Excavated by Arthur Evans at Knossos in the early 20th century.',
    significance: 'Key artifact set for reconstructing Aegean cult imagery and sacred femininity motifs.',
  },
  {
    id: 'terracotta-warriors',
    name: 'Terracotta Army and Mythic Cosmology Contexts',
    period: '3rd century BCE',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/80/Terracotta_Army%2C_View_of_Pit_1.jpg',
    discoveryStory: 'Discovered near Xiʼan in 1974 during well digging.',
    significance: 'Shows imperial afterlife cosmology and ritual beliefs tied to state mythic narratives.',
  },
  {
    id: 'viking-oseberg',
    name: 'Oseberg Ship Grave Finds',
    period: '9th century CE',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Oseberg_ship.jpg',
    discoveryStory: 'Excavated in Norway in 1904.',
    significance: 'Material evidence for elite funerary ritual and Norse mythic-symbolic motifs.',
  },
  {
    id: 'olmec-colossal-heads',
    name: 'Olmec Colossal Heads',
    period: 'c. 1200-400 BCE',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Olmec_Head_No_1.jpg',
    discoveryStory: 'Documented and excavated in Gulf Coast Mesoamerican sites.',
    significance: 'Critical for understanding early Mesoamerican sacred rulership iconography.',
  },
  {
    id: 'hallstatt-ritual-finds',
    name: 'Hallstatt Ritual Deposits',
    period: 'Early Iron Age',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Hallstatt_Culture_Objects.jpg',
    discoveryStory: 'Recovered from Alpine and Central European excavation contexts.',
    significance: 'Supports reconstruction of early Indo-European ritual and myth-linked practices.',
  },
  {
    id: 'delphi-inscriptions',
    name: 'Delphi Inscriptions',
    period: 'Archaic-Hellenistic',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Delphi_inscription.jpg',
    discoveryStory: 'Excavated and cataloged during major French campaigns at Delphi.',
    significance: 'Primary textual evidence for oracle ritual, Apollo cult, and pan-Hellenic mythic politics.',
  },
];

export default function ArchaeologyHubPage() {
  const [selectedMuseumId, setSelectedMuseumId] = useState<string | null>(null);

  const archaeologySites = useMemo(
    () => sacredSites.filter((site) => Boolean(site.archaeology && site.archaeology.chronology.length > 0)),
    []
  );

  // Yalnız Wikidata'da doğrulanmış UNESCO kaydı olan alanlar öne çıkar.
  const worldHeritageSites = useMemo(
    () => sacredSites.filter((site) => siteWorldHeritage(site) !== null).slice(0, 6),
    []
  );

  const excavationTimeline = useMemo(() => {
    const regionIndex = new Map<string, number>();
    const rows: Array<{ siteName: string; year: number; region: string; regionIdx: number; excavator: string; finding: string }> = [];

    archaeologySites.forEach((site) => {
      const first = site.archaeology?.discoveryHistory.majorExcavations?.[0];
      if (!first) return;
      const match = first.year.match(/\d{3,4}/);
      if (!match) return;
      const year = Number(match[0]);
      if (!Number.isFinite(year) || year < 1700) return;
      const region = mythologyById.get(site.mythologyId)?.region || site.mythologyId;
      if (!regionIndex.has(region)) regionIndex.set(region, regionIndex.size + 1);
      rows.push({
        siteName: site.name,
        year,
        region,
        regionIdx: regionIndex.get(region) || 1,
        excavator: first.led_by,
        finding: first.findings,
      });
    });

    return rows.sort((a, b) => a.year - b.year);
  }, [archaeologySites]);

  const museums = useMemo(() => {
    const map = new Map<string, MuseumAggregate>();
    archaeologySites.forEach((site) => {
      (site.archaeology?.museumConnections || []).forEach((museum) => {
        const id = `${museum.museumName}-${museum.city}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const existing = map.get(id);
        if (!existing) {
          map.set(id, {
            id,
            museumName: museum.museumName,
            city: museum.city,
            country: museum.country,
            collectionUrl: museum.collectionUrl,
            artifactCount: museum.notableArtifacts?.length ?? 0,
            siteIds: [site.id],
          });
          return;
        }
        existing.artifactCount += museum.notableArtifacts?.length ?? 0;
        if (!existing.siteIds.includes(site.id)) existing.siteIds.push(site.id);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.artifactCount - a.artifactCount);
  }, [archaeologySites]);

  const museumMarkers = useMemo(
    () =>
      museums
        .map((museum) => {
          const coords = CITY_COORDS[museum.city.trim().toLowerCase()];
          if (!coords) return null;
          return {
            id: museum.id,
            label: `${museum.museumName} (${museum.city})`,
            lat: coords.lat,
            lng: coords.lng,
            color: '#f0d58d',
          };
        })
        .filter((item): item is { id: string; label: string; lat: number; lng: number; color: string } => Boolean(item)),
    [museums]
  );

  const selectedMuseum = useMemo(
    () => museums.find((museum) => museum.id === selectedMuseumId) || null,
    [museums, selectedMuseumId]
  );

  const selectedMuseumSites = useMemo(
    () => (selectedMuseum ? archaeologySites.filter((site) => selectedMuseum.siteIds.includes(site.id)) : []),
    [archaeologySites, selectedMuseum]
  );

  const protectionStats = useMemo(() => {
    const counts = new Map<string, number>();
    archaeologySites.forEach((site) => {
      const key = siteProtectionStatus(site) || 'unknown';
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([status, count]) => ({ status, count }));
  }, [archaeologySites]);

  return (
    <div className="section-container space-y-8 py-8">
      <section className="ancient-card p-6">
        <h1 className="text-3xl text-gold">Arkeoloji Merkezi</h1>
        <p className="meta-text mt-2 text-sm">Kutsal alanlarin arkeolojik kesifleri, eser dagilimlari ve kazi etkinligi.</p>
      </section>

      <section className="ancient-card p-6">
        <h2 className="text-2xl text-gold">UNESCO Dünya Mirası</h2>
        <p className="meta-text mt-1 text-sm">Dünya Mirası kaydı Wikidata üzerinden doğrulanmış kutsal alanlar.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {worldHeritageSites.map((site) => {
            const heritage = siteWorldHeritage(site);
            return (
              <HoverPrefetchLink key={site.id} href={`/site/${site.id}`} className="overflow-hidden rounded-lg border border-gold/25 bg-black/25">
                <div className="relative h-40">
                  <AncientImage src={site.imageUrl} alt={site.name} fill sizes="(max-width:1280px) 33vw, 360px" className="h-full w-full object-cover" />
                </div>
                <div className="space-y-1 p-4">
                  <p className="text-base text-gold-light">{site.name}</p>
                  <p className="text-xs text-foreground/70">{site.country}</p>
                  {heritage && heritage.name !== site.name && (
                    <p className="line-clamp-2 text-xs text-foreground/65">Liste kaydı: {heritage.name}</p>
                  )}
                  <span className="mt-2 inline-flex rounded-full border border-sky-400/35 bg-sky-400/10 px-2 py-0.5 text-[11px] text-sky-100">
                    UNESCO #{heritage?.listId}
                  </span>
                </div>
              </HoverPrefetchLink>
            );
          })}
        </div>
      </section>

      <ArchaeologyHubCharts excavationTimeline={excavationTimeline} protectionStats={protectionStats} />

      <section className="ancient-card p-6">
        <h2 className="text-2xl text-gold">Artifacts by Museum</h2>
        <p className="meta-text mt-1 text-sm">Bazi eserlerin hangi ulkede olmasi gerektigi tartisma konusudur.</p>
        <div className="mt-4 grid gap-4 xl:grid-cols-[2fr_1fr]">
          <MiniWorldMap markers={museumMarkers} title="Museum Distribution" className="p-3" />
          <div className="space-y-2">
            {museums.slice(0, 10).map((museum) => (
              <button
                key={museum.id}
                type="button"
                onClick={() => setSelectedMuseumId(museum.id)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                  selectedMuseumId === museum.id
                    ? 'border-gold/45 bg-gold/10 text-gold-light'
                    : 'border-gold/20 bg-black/20 text-foreground/75'
                }`}
              >
                <p>{museum.museumName}</p>
                <p className="text-xs text-foreground/60">
                  {museum.city}, {museum.country} · ~{museum.artifactCount}
                </p>
              </button>
            ))}
          </div>
        </div>

        {selectedMuseum && (
          <div className="mt-4 rounded-lg border border-gold/25 bg-black/20 p-4">
            <p className="text-gold-light">{selectedMuseum.museumName}</p>
            <p className="meta-text text-xs uppercase tracking-[0.12em]">
              {selectedMuseum.city} · {selectedMuseum.country}
            </p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {selectedMuseumSites.map((site) => (
                <HoverPrefetchLink key={site.id} href={`/site/${site.id}`} className="rounded-md border border-gold/20 bg-black/20 p-3">
                  <p className="text-sm text-gold-light">{site.name}</p>
                  <p className="text-xs text-foreground/65">Eser kaydi: {siteArtifactCount(site)}</p>
                </HoverPrefetchLink>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="ancient-card p-6">
        <h2 className="text-2xl text-gold">Insanligin En Onemli Mitolojik Buluntulari</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {SIGNIFICANT_FINDS.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-lg border border-gold/20 bg-black/20">
              <div className="relative h-40">
                <AncientImage src={item.imageUrl} alt={item.name} fill sizes="(max-width:1280px) 33vw, 320px" className="h-full w-full object-cover" />
              </div>
              <div className="space-y-1 p-4">
                <p className="text-gold-light">{item.name}</p>
                <p className="meta-text text-xs uppercase tracking-[0.12em]">{item.period}</p>
                <p className="text-sm text-foreground/75">{item.discoveryStory}</p>
                <p className="text-sm text-foreground/65">{item.significance}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
