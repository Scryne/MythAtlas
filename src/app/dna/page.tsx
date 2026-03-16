'use client';

import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react';
import HoverPrefetchLink from '@/components/common/HoverPrefetchLink';
import MiniWorldMap from '@/components/detail/MiniWorldMap';
import {
  calculateDNASimilarity,
  DNA_ARCHETYPE_UNIVERSE,
  DNA_ELEMENT_UNIVERSE,
  formatDNAKeyLabel,
  mythMatchesDNAFilters,
} from '@/lib/dna';
import { mythologies, myths } from '@/lib/myth-data';
import { haversineKm } from '@/lib/myth-utils';

type DNAElement = (typeof DNA_ELEMENT_UNIVERSE)[number];
type DNAArchetype = (typeof DNA_ARCHETYPE_UNIVERSE)[number];

interface SimilarPair {
  left: (typeof myths)[number];
  right: (typeof myths)[number];
  score: number;
  sharedElements: string[];
  distanceKm: number;
}

const ELEMENT_ICONS: Record<string, string> = {
  flood: '~',
  fire: '*',
  forbidden_fruit: 'o',
  underworld: 'U',
  divine_birth: '+',
  betrayal: 'x',
  sacrifice: 'A',
  resurrection: 'R',
  transformation: '<>',
  quest: '->',
  creation_from_chaos: '0',
  cosmic_battle: 'X',
  trickery: '?',
  forbidden_knowledge: 'K',
  descent: 'v',
  ascent: '^',
  prophecy: '!',
  revenge: '>',
  love_tragedy: '<3',
  monster_slaying: 'M',
};

const ARCHETYPE_ICONS: Record<string, string> = {
  hero: 'H',
  shadow: 'Sh',
  trickster: 'Tr',
  wise_old_man: 'W',
  great_mother: 'M',
  anima: 'An',
  animus: 'Am',
  self: 'Sf',
  threshold_guardian: 'G',
  herald: 'He',
  shapeshifter: 'Ss',
  ally: 'Al',
};

const ARCHETYPE_DESCRIPTIONS: Record<string, string> = {
  hero: 'Sinavlardan gecerek duzeni yeniden kuran figurdur.',
  shadow: 'Bastirilan korku, siddet ve kaos kutbudur.',
  trickster: 'Kurallari buken ve sistemi aciga cikaran zihin tipidir.',
  wise_old_man: 'Bilgi, rehberlik ve anlam tasiyan mentor figurdur.',
  great_mother: 'Koruyucu, dogurgan ve yikici doga gucunu temsil eder.',
  anima: 'Duygusal iliski, hassasiyet ve cekim eksenidir.',
  animus: 'Irade, yon verme ve disa vurum enerjisidir.',
  self: 'Karsitliklari birlestiren butunluk ilkesidir.',
  threshold_guardian: 'Gecisi zorlayan engel veya sinir bekcisidir.',
  herald: 'Degisim cagrisini getiren isaretci figurdur.',
  shapeshifter: 'Kimlik degistiren, belirsizlik ureten roldur.',
  ally: 'Kahramanin yolculugunda destekleyen bag figurdur.',
};

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toPercent(value: number): string {
  return `${Math.round(value)}%`;
}

interface DNAStatsSummary {
  sortedElements: Array<[string, number]>;
  sortedArchetypes: Array<[string, number]>;
  withinAvg: number;
  acrossAvg: number;
  universalElements: string[];
}

function buildSimilarPairs(allMyths: typeof myths): SimilarPair[] {
  const pairs: SimilarPair[] = [];

  for (let i = 0; i < allMyths.length; i += 1) {
    for (let j = i + 1; j < allMyths.length; j += 1) {
      const left = allMyths[i];
      const right = allMyths[j];
      if (left.mythologyId === right.mythologyId) continue;

      const score = calculateDNASimilarity(left, right);
      if (score <= 0) continue;

      const sharedElements = left.dna.elements.filter((item) => right.dna.elements.includes(item));
      const distanceKm = haversineKm(left.origin, right.origin);

      pairs.push({ left, right, score, sharedElements, distanceKm });
    }
  }

  return pairs.sort((a, b) => b.score - a.score).slice(0, 20);
}

function buildDNAStats(allMyths: typeof myths): DNAStatsSummary {
  const elementCounts = new Map<string, number>();
  const archetypeCounts = new Map<string, number>();

  allMyths.forEach((myth) => {
    myth.dna.elements.forEach((item) => {
      elementCounts.set(item, (elementCounts.get(item) ?? 0) + 1);
    });
    myth.dna.archetypes.forEach((item) => {
      archetypeCounts.set(item, (archetypeCounts.get(item) ?? 0) + 1);
    });
  });

  const sortedElements = Array.from(elementCounts.entries()).sort((a, b) => b[1] - a[1]);
  const sortedArchetypes = Array.from(archetypeCounts.entries()).sort((a, b) => b[1] - a[1]);

  const withinScores: number[] = [];
  const acrossScores: number[] = [];

  for (let i = 0; i < allMyths.length; i += 1) {
    for (let j = i + 1; j < allMyths.length; j += 1) {
      const score = calculateDNASimilarity(allMyths[i], allMyths[j]);
      if (allMyths[i].mythologyId === allMyths[j].mythologyId) withinScores.push(score);
      else acrossScores.push(score);
    }
  }

  const universalElements = sortedElements
    .filter(([, count]) => count / allMyths.length >= 0.8)
    .map(([element]) => formatDNAKeyLabel(element));

  return {
    sortedElements,
    sortedArchetypes,
    withinAvg: average(withinScores),
    acrossAvg: average(acrossScores),
    universalElements,
  };
}

export default function DNAExplorerPage() {
  const mythologyNameById = useMemo(() => new Map(mythologies.map((item) => [item.id, item.name])), []);

  const elementStats = useMemo(
    () =>
      DNA_ELEMENT_UNIVERSE
        .map((element) => ({
          element,
          count: myths.filter((myth) => myth.dna.elements.includes(element)).length,
        }))
        .sort((a, b) => b.count - a.count),
    []
  );

  const archetypeStats = useMemo(
    () =>
      DNA_ARCHETYPE_UNIVERSE
        .map((archetype) => {
          const hits = myths.filter((myth) => myth.dna.archetypes.includes(archetype));
          const ranked = hits
            .slice()
            .sort((a, b) => b.dna.elements.length - a.dna.elements.length);
          const seenMythologies = new Set<string>();
          const topExamples: typeof hits = [];
          ranked.forEach((myth) => {
            if (topExamples.length >= 3) return;
            if (seenMythologies.has(myth.mythologyId)) return;
            seenMythologies.add(myth.mythologyId);
            topExamples.push(myth);
          });

          return {
            archetype,
            count: hits.length,
            topExamples,
          };
        })
        .sort((a, b) => b.count - a.count),
    []
  );

  const [selectedElement, setSelectedElement] = useState<string>('');
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [selectedArchetypes, setSelectedArchetypes] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedElement && elementStats.length) setSelectedElement(elementStats[0].element);
  }, [elementStats, selectedElement]);

  const mythsForSelectedElement = useMemo(
    () => myths.filter((myth) => selectedElement && myth.dna.elements.includes(selectedElement)),
    [selectedElement]
  );

  const dnaSearchResults = useMemo(
    () => {
      const filteredElements = selectedElements.filter(
        (item): item is DNAElement => (DNA_ELEMENT_UNIVERSE as readonly string[]).includes(item)
      );
      const filteredArchetypes = selectedArchetypes.filter(
        (item): item is DNAArchetype => (DNA_ARCHETYPE_UNIVERSE as readonly string[]).includes(item)
      );

      return myths.filter((myth) =>
        mythMatchesDNAFilters(myth, {
          elements: filteredElements,
          archetypes: filteredArchetypes,
        })
      );
    },
    [selectedArchetypes, selectedElements]
  );

  const [similarPairs, setSimilarPairs] = useState<SimilarPair[]>([]);
  const [dnaStats, setDnaStats] = useState<DNAStatsSummary>({
    sortedElements: [],
    sortedArchetypes: [],
    withinAvg: 0,
    acrossAvg: 0,
    universalElements: [],
  });
  const [analysisReady, setAnalysisReady] = useState(false);

  const surprisingPair = useMemo(() => {
    const farPairs = similarPairs.filter((pair) => pair.distanceKm >= 6000);
    return (farPairs[0] || similarPairs[0]) ?? null;
  }, [similarPairs]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    const runAnalysis = () => {
      const nextPairs = buildSimilarPairs(myths);
      const nextStats = buildDNAStats(myths);
      if (!cancelled) {
        setSimilarPairs(nextPairs);
        setDnaStats(nextStats);
        setAnalysisReady(true);
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = (window as Window & { requestIdleCallback: (cb: () => void, options?: { timeout: number }) => number }).requestIdleCallback(
        runAnalysis,
        { timeout: 1500 }
      );
    } else {
      timeoutId = setTimeout(runAnalysis, 120);
    }

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (idleId && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      }
    };
  }, []);

  const toggleItem = (value: string, setter: Dispatch<SetStateAction<string[]>>) => {
    setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  return (
    <div className="section-container space-y-8 py-8">
      <section className="ancient-card p-6">
        <h1 className="text-3xl text-gold">Myth DNA Explorer</h1>
        <p className="mt-2 max-w-3xl text-sm text-foreground/75">
          Mitleri ortak anlati atomlarina ayiran fingerprint katmani: elementler, arketipler ve anlati iskeletleri.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl text-gold">Element Universe</h2>
          <p className="text-xs text-foreground/60">En evrensel elementlerden baslayarak siralanir.</p>
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {elementStats.map((item) => {
            const active = selectedElement === item.element;
            return (
              <button
                key={item.element}
                type="button"
                onClick={() => setSelectedElement(item.element)}
                className={`rounded-xl border p-4 text-left transition ${
                  active ? 'border-gold/50 bg-gold/10' : 'border-gold/20 bg-black/20 hover:border-gold/40'
                }`}
              >
                <p className="text-lg text-gold-light">{ELEMENT_ICONS[item.element] || '?'}</p>
                <p className="mt-2 text-sm text-gold">{formatDNAKeyLabel(item.element)}</p>
                <p className="text-xs text-foreground/60">{item.count} mit</p>
              </button>
            );
          })}
        </div>

        {selectedElement && (
          <div className="ancient-card grid gap-4 p-5 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <h3 className="text-lg text-gold">{formatDNAKeyLabel(selectedElement)} mitleri</h3>
              <p className="mt-1 text-xs text-foreground/60">{mythsForSelectedElement.length} mit bulundu</p>
              <div className="mt-3 max-h-44 space-y-2 overflow-y-auto pr-1 text-sm">
                {mythsForSelectedElement.map((myth) => (
                  <HoverPrefetchLink key={myth.id} href={`/myth/${myth.id}`} className="block rounded-md border border-gold/15 px-3 py-2 hover:border-gold/35">
                    <span className="text-gold-light">{myth.name}</span>
                    <span className="ml-2 text-xs text-foreground/55">{mythologyNameById.get(myth.mythologyId) || myth.mythologyId}</span>
                  </HoverPrefetchLink>
                ))}
              </div>
            </div>
            <MiniWorldMap
              title="Element Dagilimi"
              markers={mythsForSelectedElement.map((myth) => ({
                id: myth.id,
                label: myth.name,
                lat: myth.origin.lat,
                lng: myth.origin.lng,
              }))}
            />
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl text-gold">Archetype Universe</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {archetypeStats.map((item) => (
            <article key={item.archetype} className="rounded-xl border border-gold/20 bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <p className="text-lg text-gold-light">{ARCHETYPE_ICONS[item.archetype] || '?'}</p>
                <span className="text-xs text-foreground/60">{item.count} mit</span>
              </div>
              <h3 className="mt-2 text-base text-gold">{formatDNAKeyLabel(item.archetype)}</h3>
              <p className="mt-1 text-xs text-foreground/65">{ARCHETYPE_DESCRIPTIONS[item.archetype]}</p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.12em] text-foreground/50">Top 3 ornek</p>
              <ul className="mt-1 space-y-1 text-xs text-foreground/70">
                {item.topExamples.map((myth) => (
                  <li key={`${item.archetype}-${myth.id}`}>
                    {myth.name} · {mythologyNameById.get(myth.mythologyId) || myth.mythologyId}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="ancient-card space-y-4 p-6">
        <h2 className="text-2xl text-gold">DNA Search Tool</h2>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setSelectedElements([]);
              setSelectedArchetypes([]);
            }}
            className="rounded-full border border-gold/30 px-3 py-1 text-xs text-gold-light hover:border-gold/55"
          >
            Tum secimleri temizle
          </button>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.12em] text-foreground/55">Element secimi</p>
          <div className="flex flex-wrap gap-2">
            {DNA_ELEMENT_UNIVERSE.map((element) => {
              const active = selectedElements.includes(element);
              return (
                <button
                  key={`search-${element}`}
                  type="button"
                  onClick={() => toggleItem(element, setSelectedElements)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    active ? 'border-gold/55 bg-gold/15 text-gold-light' : 'border-gold/25 text-foreground/70'
                  }`}
                >
                  {formatDNAKeyLabel(element)}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.12em] text-foreground/55">Arketip secimi</p>
          <div className="flex flex-wrap gap-2">
            {DNA_ARCHETYPE_UNIVERSE.map((archetype) => {
              const active = selectedArchetypes.includes(archetype);
              return (
                <button
                  key={`search-${archetype}`}
                  type="button"
                  onClick={() => toggleItem(archetype, setSelectedArchetypes)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    active ? 'border-gold/55 bg-gold/15 text-gold-light' : 'border-gold/25 text-foreground/70'
                  }`}
                >
                  {formatDNAKeyLabel(archetype)}
                </button>
              );
            })}
          </div>
        </div>

        <p className="rounded-md border border-gold/20 bg-gold/5 px-3 py-2 text-sm text-gold-light">
          Bu kombinasyona sahip <strong>{dnaSearchResults.length}</strong> mit bulundu.
        </p>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <MiniWorldMap
            title="DNA Arama Sonuclari"
            markers={dnaSearchResults.map((myth) => ({
              id: myth.id,
              label: myth.name,
              lat: myth.origin.lat,
              lng: myth.origin.lng,
            }))}
          />

          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {dnaSearchResults.map((myth) => (
              <HoverPrefetchLink key={myth.id} href={`/myth/${myth.id}`} className="block rounded-md border border-gold/15 p-2 hover:border-gold/35">
                <p className="text-sm text-gold-light">{myth.name}</p>
                <p className="text-xs text-foreground/60">{mythologyNameById.get(myth.mythologyId) || myth.mythologyId}</p>
              </HoverPrefetchLink>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl text-gold">Most Similar Myth Pairs</h2>
        {!analysisReady && (
          <p className="rounded-md border border-gold/20 bg-black/20 px-3 py-2 text-xs text-foreground/70">
            Benzerlik matrisi hesaplanıyor...
          </p>
        )}
        {surprisingPair && (
          <div className="rounded-lg border border-sky-300/35 bg-sky-900/20 p-4 text-sm text-sky-100">
            <p className="text-xs uppercase tracking-[0.12em] text-sky-200">En sasirtici benzerlik</p>
            <p className="mt-1">
              {surprisingPair.left.name} ({mythologyNameById.get(surprisingPair.left.mythologyId)}) -{' '}
              {surprisingPair.right.name} ({mythologyNameById.get(surprisingPair.right.mythologyId)}) · {surprisingPair.score}%
            </p>
            <p className="mt-1 text-xs text-sky-200/85">Yaklasik mesafe: {Math.round(surprisingPair.distanceKm)} km</p>
          </div>
        )}

        <div className="space-y-2">
          {similarPairs.map((pair) => (
            <div key={`${pair.left.id}-${pair.right.id}`} className="rounded-lg border border-gold/20 bg-black/20 p-3">
              <p className="text-sm text-gold-light">
                {pair.left.name} · {pair.right.name}
              </p>
              <p className="text-xs text-foreground/60">
                {mythologyNameById.get(pair.left.mythologyId)} - {mythologyNameById.get(pair.right.mythologyId)}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#2d2213]">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,#7ad7f4,#f3d78d)]" style={{ width: `${pair.score}%` }} />
                </div>
                <span className="text-xs text-gold-light">{pair.score}%</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {pair.sharedElements.slice(0, 5).map((element) => (
                  <span key={`${pair.left.id}-${pair.right.id}-${element}`} className="rounded-full border border-gold/25 px-2 py-0.5 text-[11px] text-foreground/75">
                    {formatDNAKeyLabel(element)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="ancient-card space-y-5 p-6">
        <h2 className="text-2xl text-gold">DNA Statistics</h2>
        {!analysisReady && (
          <p className="rounded-md border border-gold/20 bg-black/20 px-3 py-2 text-xs text-foreground/70">
            Istatistikler hazırlanıyor...
          </p>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-gold-light">En yaygin elementler</p>
            <div className="space-y-2">
              {dnaStats.sortedElements.slice(0, 6).map(([element, count]) => (
                <div key={`stat-element-${element}`}>
                  <div className="mb-1 flex items-center justify-between text-xs text-foreground/70">
                    <span>{formatDNAKeyLabel(element)}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#2f2314]">
                    <div className="h-full rounded-full bg-[#dfbe73]" style={{ width: `${(count / myths.length) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-gold-light">En yaygin arketipler</p>
            <div className="space-y-2">
              {dnaStats.sortedArchetypes.slice(0, 6).map(([archetype, count]) => (
                <div key={`stat-archetype-${archetype}`}>
                  <div className="mb-1 flex items-center justify-between text-xs text-foreground/70">
                    <span>{formatDNAKeyLabel(archetype)}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#2f2314]">
                    <div className="h-full rounded-full bg-[#7ad7f4]" style={{ width: `${(count / myths.length) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-gold/20 bg-black/20 p-3 text-sm text-foreground/80">
            Ayni mitoloji icindeki ortalama DNA benzerligi: <strong>{toPercent(dnaStats.withinAvg)}</strong>
          </div>
          <div className="rounded-md border border-gold/20 bg-black/20 p-3 text-sm text-foreground/80">
            Mitolojiler arasi ortalama DNA benzerligi: <strong>{toPercent(dnaStats.acrossAvg)}</strong>
          </div>
        </div>

        <div className="rounded-lg border border-emerald-300/35 bg-emerald-900/20 p-3 text-sm text-emerald-100">
          <p className="text-xs uppercase tracking-[0.12em]">Insanligin evrensel hikayeleri</p>
          <p className="mt-1">
            80%+ mitte gorulen elementler:{' '}
            {dnaStats.universalElements.length ? dnaStats.universalElements.join(', ') : 'Henuz 80% esigini gecen element yok.'}
          </p>
        </div>
      </section>
    </div>
  );
}

