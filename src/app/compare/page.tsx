'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createPairKey, curatedComparisons } from '@/lib/parallels-data';
import {
  deities as deitiesCatalog,
  getMythologyBundles,
  myths as mythsCatalog,
  type DeityData,
  type MythData,
} from '@/lib/myth-data';

interface ComparableEntity {
  id: string;
  name: string;
  kind: 'myth' | 'deity' | 'curated' | 'mythology';
  mythologyId: string;
  mythologyName: string;
  plotStructure: string;
  keyCharacters: string[];
  themes: string[];
  moral: string;
  coordinates?: [number, number];
}

interface PresetItem {
  id: string;
  label: string;
  leftId: string;
  rightId: string;
  extraId?: string;
  secondaryExtraId?: string;
  hint: string;
}

const presets: PresetItem[] = [
  {
    id: 'noah-vs-utnapishtim',
    label: 'Noah vs Utnapishtim',
    leftId: 'noah-flood-curated',
    rightId: 'mesopotamian-flood',
    hint: 'Biblical vs Mesopotamian flood',
  },
  {
    id: 'prometheus-vs-maui',
    label: 'Prometheus vs Maui',
    leftId: 'prometheus-fire',
    rightId: 'maui-fire',
    hint: 'Fire theft archetype',
  },
  {
    id: 'zeus-jupiter-odin',
    label: 'Zeus vs Jupiter vs Odin',
    leftId: 'zeus',
    rightId: 'jupiter',
    extraId: 'odin',
    hint: 'Sky father line + Norse contrast',
  },
  {
    id: 'heracles-vs-gilgamesh',
    label: 'Herkul vs Gilgamis',
    leftId: 'heracles-labors',
    rightId: 'gilgamesh-quest',
    hint: 'Hero journey super-pair',
  },
  {
    id: 'osiris-vs-persephone',
    label: 'Osiris vs Persephone',
    leftId: 'osiris-isis',
    rightId: 'persephone-seasons',
    hint: 'Death and rebirth cycle',
  },
  {
    id: 'dragon-myths',
    label: 'Ejderha Mitleri',
    leftId: 'st-george-dragon',
    rightId: 'susanoo-serpent',
    extraId: 'apep-serpent',
    secondaryExtraId: 'vritra-slaying',
    hint: 'St. George vs Susanoo vs Apep vs Vritra',
  },
];

const curatedExtraEntities: ComparableEntity[] = [
  {
    id: 'noah-flood-curated',
    name: 'Noah Flood Narrative',
    kind: 'curated',
    mythologyId: 'abrahamic',
    mythologyName: 'Biblical / Abrahamic',
    plotStructure:
      'Divine warning, ark construction, preservation of life, global flood, covenantal renewal.',
    keyCharacters: ['Noah', 'God', "Noah's family"],
    themes: ['flood', 'judgment', 'survival', 'renewal', 'covenant'],
    moral:
      'Ethical fidelity and obedience can preserve life through civilizational collapse.',
    coordinates: [35.2, 31.8],
  },
  {
    id: 'st-george-dragon',
    name: 'St. George and the Dragon',
    kind: 'curated',
    mythologyId: 'christian-legend',
    mythologyName: 'Christian Legendary Corpus',
    plotStructure:
      'A dragon terrorizes a community, a sacred warrior confronts it, and order is restored through faith and courage.',
    keyCharacters: ['St. George', 'Dragon', 'Princess', 'Town community'],
    themes: ['dragon', 'hero', 'chaos-vs-order', 'sacred-protection'],
    moral:
      'Collective fear can be transformed when ethical courage and symbolic order confront chaos.',
    coordinates: [35.2, 31.8],
  },
  {
    id: 'apep-serpent',
    name: 'Ra vs Apep',
    kind: 'curated',
    mythologyId: 'egyptian',
    mythologyName: 'Egyptian',
    plotStructure:
      'Nightly cosmic combat where the solar order is threatened by the serpent of chaos and repeatedly restored.',
    keyCharacters: ['Ra', 'Apep', 'Solar crew'],
    themes: ['serpent', 'cosmic-war', 'order-vs-chaos', 'renewal'],
    moral:
      'Order is not permanent; it must be defended cyclically against the return of disorder.',
    coordinates: [31.2, 30.0],
  },
  {
    id: 'vritra-slaying',
    name: 'Indra Slays Vritra',
    kind: 'curated',
    mythologyId: 'hindu',
    mythologyName: 'Hindu',
    plotStructure:
      'Storm god defeats a drought-serpent, releasing waters and renewing fertility and cosmic balance.',
    keyCharacters: ['Indra', 'Vritra'],
    themes: ['dragon', 'storm-god', 'water-release', 'cosmic-order'],
    moral:
      'Life-giving abundance emerges when obstruction and hoarding are overcome by righteous force.',
    coordinates: [77.2, 28.6],
  },
];

function normalizeTokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/gi, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function jaccard(a: string[], b: string[]): number {
  const setA = new Set(a.map((item) => item.toLowerCase()));
  const setB = new Set(b.map((item) => item.toLowerCase()));
  let intersection = 0;
  setA.forEach((item) => {
    if (setB.has(item)) intersection += 1;
  });
  const unionSet = new Set<string>();
  setA.forEach((item) => unionSet.add(item));
  setB.forEach((item) => unionSet.add(item));
  const union = unionSet.size || 1;
  return intersection / union;
}

function haversineKm(a?: [number, number], b?: [number, number]): number {
  if (!a || !b) return 9999;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const p1 = toRad(lat1);
  const p2 = toRad(lat2);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 6371 * (2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

function similarityBand(score: number) {
  if (score >= 90) return 'Cok Yuksek';
  if (score >= 75) return 'Yuksek';
  if (score >= 60) return 'Orta';
  return 'Dusuk-Orta';
}

export default function ComparePage() {
  const bundles = useMemo(() => getMythologyBundles(), []);
  const mythologies = useMemo(() => bundles.map((bundle) => bundle.mythology), [bundles]);
  const myths = useMemo(() => mythsCatalog as MythData[], []);
  const deities = useMemo(() => deitiesCatalog as DeityData[], []);

  const mythologyById = useMemo(
    () => new Map(mythologies.map((mythology) => [mythology.id, mythology])),
    [mythologies]
  );

  const mythById = useMemo(() => new Map(myths.map((myth) => [myth.id, myth])), [myths]);

  const comparableEntities = useMemo(() => {
    const mythologyEntities: ComparableEntity[] = bundles.map((bundle) => {
      const mythology = bundle.mythology;
      const mythologyMyths = bundle.myths;
      const mythologyDeities = bundle.deities;
      const topThemes = Array.from(
        new Set(mythologyMyths.flatMap((myth) => myth.themes || []))
      ).slice(0, 8);
      const topFigures = mythologyDeities.map((deity) => deity.name).slice(0, 8);
      const qualityNote =
        bundle.missingSections.length > 0
          ? `Veri durumu ${bundle.completeness.label}; eksik alanlar: ${bundle.missingSections.join(', ')}.`
          : mythology.significance;

      return {
        id: mythology.id,
        name: mythology.name,
        kind: 'mythology',
        mythologyId: mythology.id,
        mythologyName: mythology.name,
        plotStructure: mythology.description,
        keyCharacters: topFigures,
        themes: topThemes,
        moral: qualityNote,
        coordinates: [mythology.origin.lng, mythology.origin.lat],
      };
    });

    const mythEntities: ComparableEntity[] = myths.map((myth) => ({
      id: myth.id,
      name: myth.name,
      kind: 'myth',
      mythologyId: myth.mythologyId,
      mythologyName: mythologyById.get(myth.mythologyId)?.name ?? myth.mythologyId,
      plotStructure: myth.summary,
      keyCharacters: myth.characters.slice(0, 8),
      themes: myth.themes.slice(0, 8),
      moral: myth.significance,
      coordinates: [myth.origin.lng, myth.origin.lat],
    }));

    const deityEntities: ComparableEntity[] = deities.map((deity) => ({
      id: deity.id,
      name: deity.name,
      kind: 'deity',
      mythologyId: deity.mythologyId,
      mythologyName: mythologyById.get(deity.mythologyId)?.name ?? deity.mythologyId,
      plotStructure: deity.description,
      keyCharacters: deity.myths.map((mythId) => mythById.get(mythId)?.name ?? mythId).slice(0, 8),
      themes: deity.domain.slice(0, 8),
      moral: `${deity.name} figuru ${deity.domain.slice(0, 3).join(', ')} ekseninde kulturel duzeni sembolize eder.`,
      coordinates: [deity.origin.lng, deity.origin.lat],
    }));

    return [...curatedExtraEntities, ...mythologyEntities, ...mythEntities, ...deityEntities];
  }, [bundles, deities, mythById, mythologyById, myths]);

  const entityById = useMemo(
    () => new Map(comparableEntities.map((entity) => [entity.id, entity])),
    [comparableEntities]
  );

  const [leftId, setLeftId] = useState('mesopotamian-flood');
  const [rightId, setRightId] = useState('manu-flood');
  const [thirdSuggestionId, setThirdSuggestionId] = useState<string | null>(null);
  const [fourthSuggestionId, setFourthSuggestionId] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const leftFromQuery = params.get('left');
    const rightFromQuery = params.get('right');
    if (leftFromQuery && entityById.has(leftFromQuery)) setLeftId(leftFromQuery);
    if (rightFromQuery && entityById.has(rightFromQuery)) setRightId(rightFromQuery);
  }, [entityById]);

  useEffect(() => {
    if (!entityById.has(leftId)) setLeftId(comparableEntities[0]?.id ?? '');
    if (!entityById.has(rightId)) setRightId(comparableEntities[1]?.id ?? '');
  }, [comparableEntities, entityById, leftId, rightId]);

  useEffect(() => {
    if (!leftId || !rightId) return;
    const params = new URLSearchParams(window.location.search);
    const currentLeft = params.get('left');
    const currentRight = params.get('right');
    if (currentLeft === leftId && currentRight === rightId) return;

    params.set('left', leftId);
    params.set('right', rightId);
    window.history.replaceState(window.history.state, '', `/compare?${params.toString()}`);
  }, [leftId, rightId]);

  const left = entityById.get(leftId) ?? comparableEntities[0];
  const right = entityById.get(rightId) ?? comparableEntities[1];
  const sameSelection = leftId === rightId;

  const curatedByKey = useMemo(() => {
    const map = new Map<string, (typeof curatedComparisons)[number]>();
    curatedComparisons.forEach((item) => {
      map.set(createPairKey(item.ids[0], item.ids[1]), item);
    });
    return map;
  }, []);

  const activeCurated = left && right ? curatedByKey.get(createPairKey(left.id, right.id)) : undefined;

  const similarityScore = useMemo(() => {
    if (!left || !right) return 0;
    if (activeCurated) return activeCurated.similarity;

    const themeScore = jaccard(left.themes, right.themes) * 58;
    const characterScore = jaccard(left.keyCharacters, right.keyCharacters) * 17;
    const structureScore = jaccard(normalizeTokens(left.plotStructure), normalizeTokens(right.plotStructure)) * 18;
    const sameSystemBonus = left.mythologyId === right.mythologyId ? 8 : 0;

    const score = themeScore + characterScore + structureScore + sameSystemBonus + 16;
    return Math.max(26, Math.min(98, Math.round(score)));
  }, [activeCurated, left, right]);

  const probableConnection = useMemo(() => {
    if (!left || !right) return '';
    if (activeCurated) return activeCurated.probableConnection;

    if (left.mythologyId === right.mythologyId) {
      return 'Ayni mitolojik sistem icinde varyantlasma: ortak teolojik cekirdek, farkli anlati islevleri.';
    }

    const distance = haversineKm(left.coordinates, right.coordinates);
    if (distance < 2500) {
      return 'Cografi yakinlik yuksek: ticaret aglari, savas/ittifak iliskileri ve goc hareketleri uzerinden kulturel gecis olasi.';
    }
    if (distance < 6000) {
      return 'Orta mesafe baglantisi: Ipek Yolu benzeri cok durakli aktarim zincirleri veya imparatorluk temas bolgeleri olasi.';
    }
    return 'Dogrudan aktarim olasiligi zayif: daha cok bagimsiz ama benzer toplumsal sorunlara verilen arketipsel cevaplar goruluyor.';
  }, [activeCurated, left, right]);

  const generatedAnalysis = useMemo(() => {
    if (!left || !right) return '';
    if (activeCurated) return activeCurated.analysis;

    const sharedThemes = left.themes.filter((theme) =>
      right.themes.map((item) => item.toLowerCase()).includes(theme.toLowerCase())
    );
    const highlights = sharedThemes.slice(0, 4).join(', ');
    const motifText = highlights
      ? `Ortak temalar: ${highlights}.`
      : 'Dogrudan tema cakismasi sinirli; benzerlik daha cok yapisal duzeyde.';

    return `${left.name} ve ${right.name} karsilastirmasinda anlati akisi, kahraman/figur islevi ve toplumsal duzen mesaji birlikte okunmali. ${motifText} Bu eslesme, yerel semboller farkli olsa da insan deneyiminin benzer krizlerini mitik duzlemde cozdugunu gosteriyor.`;
  }, [activeCurated, left, right]);

  const winnerSummary = useMemo(() => {
    if (!left || !right) return [] as Array<{ field: string; winner: 'left' | 'right' | 'draw' }>;
    const rows = [
      {
        field: 'Tema Cesitliligi',
        leftScore: left.themes.length,
        rightScore: right.themes.length,
      },
      {
        field: 'Karakter Yogunlugu',
        leftScore: left.keyCharacters.length,
        rightScore: right.keyCharacters.length,
      },
      {
        field: 'Anlati Derinligi',
        leftScore: normalizeTokens(left.plotStructure).length,
        rightScore: normalizeTokens(right.plotStructure).length,
      },
      {
        field: 'Yapisal Uyum',
        leftScore: similarityScore,
        rightScore: similarityScore,
      },
    ];

    return rows.map((row) => {
      if (row.leftScore > row.rightScore) return { field: row.field, winner: 'left' as const };
      if (row.rightScore > row.leftScore) return { field: row.field, winner: 'right' as const };
      return { field: row.field, winner: 'draw' as const };
    });
  }, [left, right, similarityScore]);

  const groupedEntities = useMemo(() => {
    const groups = new Map<string, ComparableEntity[]>();
    comparableEntities.forEach((entity) => {
      const key = entity.mythologyName;
      const existing = groups.get(key) ?? [];
      existing.push(entity);
      groups.set(key, existing);
    });
    return Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([groupName, entries]) => [groupName, entries.sort((a, b) => a.name.localeCompare(b.name))] as const);
  }, [comparableEntities]);

  const copyShareUrl = async () => {
    if (sameSelection) return;
    const shareUrl = `${window.location.origin}/compare?left=${encodeURIComponent(leftId)}&right=${encodeURIComponent(rightId)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage('Link copied');
    } catch {
      setShareMessage('Copy failed');
    }
    window.setTimeout(() => setShareMessage(null), 2000);
  };

  const copyShareSummary = async () => {
    if (sameSelection) return;
    if (!left || !right) return;
    const summary = `Biliyor muydunuz? ${left.name} ve ${right.name} anlatilarinin benzerlik skoru ${similarityScore}. ${probableConnection}`;
    try {
      await navigator.clipboard.writeText(summary);
      setShareMessage('Summary copied');
    } catch {
      setShareMessage('Copy failed');
    }
    window.setTimeout(() => setShareMessage(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background px-4 pb-16 pt-24 text-primary sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="featured-card rounded-card border p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Comparison Tool</p>
          <h1 className="mt-3 font-heading text-3xl text-gold-light sm:text-4xl">Mitler Arasi Paralel Karsilastirma</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-secondary sm:text-base">
            Iki anlatiyi veya figuru yan yana getir, yapi ve tema benzerliklerini oku, ardindan olasi kulturel baglantiyi degerlendir.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/parallels"
              className="app-button app-button-secondary min-h-10 rounded-full px-4 text-xs tracking-[0.15em]"
            >
              PARALEL EXPLORER
            </Link>
            <Link
              href="/map"
              className="app-button app-button-ghost min-h-10 rounded-full px-4 text-xs tracking-[0.15em] text-secondary"
            >
              ANA HARITA
            </Link>
          </div>
        </div>

        <section className="app-card mt-8 rounded-card p-5">
          <h2 className="font-heading text-xl text-gold-light">Presetler</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setLeftId(preset.leftId);
                  setRightId(preset.rightId);
                  setThirdSuggestionId(preset.extraId ?? null);
                  setFourthSuggestionId(preset.secondaryExtraId ?? null);
                }}
                className="featured-card rounded-card border p-4 text-left transition-colors hover:border-[color:var(--color-border-hover)]"
              >
                <p className="text-sm font-semibold text-gold-light">{preset.label}</p>
                <p className="mt-1 text-xs text-secondary">{preset.hint}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="app-card mt-6 rounded-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading text-xl text-gold-light">Iki Oge Sec</h2>
              <div className="flex items-center gap-2">
                {shareMessage && <span className="text-xs text-secondary">{shareMessage}</span>}
                <button
                  type="button"
                  onClick={copyShareUrl}
                  disabled={sameSelection}
                  className="app-button app-button-secondary min-h-10 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.12em]"
                >
                  Share URL
                </button>
                <button
                  type="button"
                  onClick={copyShareSummary}
                  disabled={sameSelection}
                  className="app-button app-button-secondary min-h-10 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.12em]"
                >
                  Bu karsilastirmayi paylas
                </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <label className="text-sm text-secondary">
              Sol Karsilastirma
              <select
                value={leftId}
                onChange={(event) => setLeftId(event.target.value)}
                className="mt-2 w-full rounded-card border border-[color:var(--color-border)] bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-[color:var(--color-border-hover)]"
              >
                {groupedEntities.map(([groupName, entities]) => (
                  <optgroup key={groupName} label={groupName}>
                    {entities.map((entity) => (
                      <option key={entity.id} value={entity.id}>
                        {entity.name} ({entity.kind})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>

            <label className="text-sm text-secondary">
              Sag Karsilastirma
              <select
                value={rightId}
                onChange={(event) => setRightId(event.target.value)}
                className="mt-2 w-full rounded-card border border-[color:var(--color-border)] bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-[color:var(--color-border-hover)]"
              >
                {groupedEntities.map(([groupName, entities]) => (
                  <optgroup key={groupName} label={groupName}>
                    {entities.map((entity) => (
                      <option key={entity.id} value={entity.id}>
                        {entity.name} ({entity.kind})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          </div>

          {sameSelection ? (
            <div className="mt-4 rounded-card border border-red/35 bg-red/15 px-4 py-3 text-sm text-parchment">
              Ayni miti karsilastiramazsiniz.
            </div>
          ) : null}

          {thirdSuggestionId && entityById.get(thirdSuggestionId) && (
            <div className="mt-4 rounded-card border border-[color:var(--color-border-hover)] bg-elevated/70 p-3 text-sm text-primary">
              Bu preset icin ucuncu kiyas onerisi: <strong>{entityById.get(thirdSuggestionId)?.name}</strong>
              <button
                type="button"
                onClick={() => setRightId(thirdSuggestionId)}
                className="ml-3 rounded-full border border-[color:var(--color-border-hover)] px-3 py-1 text-xs text-gold-light hover:bg-gold/10"
              >
                Sag tarafa koy
              </button>
            </div>
          )}
          {fourthSuggestionId && entityById.get(fourthSuggestionId) && (
            <div className="mt-2 rounded-card border border-[color:var(--color-border)] bg-surface/70 p-3 text-sm text-primary">
              Ek dorduncu eslesme: <strong>{entityById.get(fourthSuggestionId)?.name}</strong>
            </div>
          )}
        </section>

        {left && right && !sameSelection && (
          <>
            <section className="app-card mt-6 rounded-card p-5">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-heading text-xl text-gold-light">Benzerlik Skoru</h2>
                  <p className="text-xs text-secondary">Curated + heuristic model</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-semibold text-gold-light">{similarityScore}</p>
                  <p className="text-xs text-secondary">{similarityBand(similarityScore)}</p>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-overlay">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-gold-dim),var(--color-gold-light))]"
                  style={{ width: `${similarityScore}%` }}
                />
              </div>
            </section>

            <section className="app-card mt-6 rounded-card p-5">
              <h3 className="font-heading text-lg text-gold-light">Winner Summary</h3>
              <div className="mt-3 grid gap-2">
                {winnerSummary.map((row) => (
                  <div key={row.field} className="flex items-center justify-between rounded-md border border-[color:var(--color-border)] bg-surface/60 px-3 py-2 text-sm">
                    <span className="text-secondary">{row.field}</span>
                    {row.winner === 'draw' ? (
                      <span className="text-primary">Berabere</span>
                    ) : (
                      <span className="text-gold-light">🏆 {row.winner === 'left' ? left.name : right.name}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="app-card mt-6 overflow-hidden rounded-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="bg-surface/80">
                    <th className="border-b border-[color:var(--color-border)] px-4 py-3 text-left text-secondary">Boyut</th>
                    <th className="border-b border-[color:var(--color-border)] px-4 py-3 text-left text-gold-light">{left.name}</th>
                    <th className="border-b border-[color:var(--color-border)] px-4 py-3 text-left text-gold-light">{right.name}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-b border-[color:var(--color-border)] px-4 py-3 text-secondary">Plot Structure</td>
                    <td className="border-b border-[color:var(--color-border)] px-4 py-3 text-primary">{left.plotStructure}</td>
                    <td className="border-b border-[color:var(--color-border)] px-4 py-3 text-primary">{right.plotStructure}</td>
                  </tr>
                  <tr>
                    <td className="border-b border-[color:var(--color-border)] px-4 py-3 text-secondary">Key Characters</td>
                    <td className="border-b border-[color:var(--color-border)] px-4 py-3 text-primary">{left.keyCharacters.join(', ') || '-'}</td>
                    <td className="border-b border-[color:var(--color-border)] px-4 py-3 text-primary">{right.keyCharacters.join(', ') || '-'}</td>
                  </tr>
                  <tr>
                    <td className="border-b border-[color:var(--color-border)] px-4 py-3 text-secondary">Themes</td>
                    <td className="border-b border-[color:var(--color-border)] px-4 py-3 text-primary">{left.themes.join(', ') || '-'}</td>
                    <td className="border-b border-[color:var(--color-border)] px-4 py-3 text-primary">{right.themes.join(', ') || '-'}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-secondary">Moral / Lesson</td>
                    <td className="px-4 py-3 text-primary">{left.moral}</td>
                    <td className="px-4 py-3 text-primary">{right.moral}</td>
                  </tr>
                </tbody>
                </table>
              </div>
            </section>

            <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="app-card rounded-card p-5">
                <h3 className="font-heading text-lg text-gold-light">Muhtemel Baglanti</h3>
                <p className="mt-3 text-sm leading-7 text-primary">{probableConnection}</p>
              </div>

              <div className="app-card rounded-card p-5">
                <h3 className="font-heading text-lg text-gold-light">Karsilastirma Ozeti</h3>
                <p className="mt-3 text-sm leading-7 text-primary">{generatedAnalysis}</p>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
