import { mythParallelIds, type DeityData, type MythData, type MythologyData } from '@/lib/myth-data';

const CURRENT_YEAR = new Date().getUTCFullYear();

interface ConceptDefinition {
  id: string;
  label: string;
  mythTypes?: string[];
  keywords?: string[];
  deityTypes?: string[];
}

const CONCEPT_DEFINITIONS: ConceptDefinition[] = [
  {
    id: 'creation',
    label: 'Creation Story',
    mythTypes: ['creation'],
    keywords: ['creation', 'origin', 'cosmos', 'primordial'],
  },
  {
    id: 'flood',
    label: 'Flood Myth',
    keywords: ['flood', 'deluge', 'ark', 'inundation'],
  },
  {
    id: 'trickster',
    label: 'Trickster Figure',
    mythTypes: ['trickster'],
    keywords: ['trickster', 'trickery', 'deception', 'chaos'],
    deityTypes: ['trickster'],
  },
  {
    id: 'afterlife',
    label: 'Afterlife Journey',
    mythTypes: ['afterlife'],
    keywords: ['underworld', 'afterlife', 'death', 'resurrection'],
  },
  {
    id: 'hero',
    label: 'Heroic Quest',
    mythTypes: ['hero', 'quest'],
    keywords: ['hero', 'quest', 'journey', 'trial'],
  },
  {
    id: 'apocalypse',
    label: 'Cosmic Renewal',
    mythTypes: ['cosmology'],
    keywords: ['apocalypse', 'rebirth', 'renewal', 'ragnarok', 'pralaya'],
  },
];

const SOURCE_DESCRIPTIONS: Record<string, string> = {
  Iliad: 'Epic poem attributed to Homer on the Trojan War and heroic honor.',
  Odyssey: 'Epic poem attributed to Homer about Odysseus and homecoming.',
  Theogony: 'Hesiodic genealogy of gods and the ordering of the cosmos.',
  'Works and Days': 'Hesiodic didactic poem on justice, labor, and divine order.',
  'Prometheus Bound': 'Classical tragedy centered on defiance, punishment, and fire.',
  Aeneid: 'Virgilian national epic connecting Rome to Trojan destiny.',
  'Prose Edda': 'Snorri Sturluson compilation preserving Norse mythic lore.',
  'Poetic Edda': 'Collection of Old Norse mythological and heroic poems.',
  'Epic of Gilgamesh': 'Mesopotamian epic exploring mortality, kingship, and legacy.',
  'Enuma Elish': 'Babylonian creation epic centered on Marduk and cosmic order.',
  Ramayana: 'Sanskrit epic about Rama, duty, devotion, and kingship.',
  Mahabharata: 'Sanskrit epic of dynastic war, dharma, and moral complexity.',
  'Book of the Dead': 'Egyptian funerary corpus guiding souls through the afterlife.',
  Metamorphoses: 'Ovidian myth compendium of transformation narratives.',
};

export interface EraRange {
  startYear: number;
  endYear: number;
  label: string;
}

export interface TimelinePoint {
  label: string;
  year: number;
  displayYear: string;
}

export interface SimilarMythology {
  mythology: MythologyData;
  score: number;
  sharedThemes: string[];
  sharedConcepts: string[];
  distanceKm: number;
}

export interface ConceptComparison {
  id: string;
  label: string;
  baseHas: boolean;
  compareHas: boolean;
}

function normalizeEraEncoding(input: string): string {
  return input
    .replace(/MÖ/gi, 'BC')
    .replace(/M\.?\s*Ö/gi, 'BC')
    .replace(/MS/gi, 'AD')
    .replace(/–/g, '-')
    .replace(/—/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseEraToken(token: string): number | null {
  const normalized = normalizeEraEncoding(token).toLowerCase();
  if (!normalized) return null;

  if (normalized.includes('present') || normalized.includes('today') || normalized.includes('now')) {
    return CURRENT_YEAR;
  }

  if (normalized.includes('years ago')) {
    const match = normalized.match(/([\d,]+)/);
    if (!match) return null;
    const value = Number(match[1].replace(/,/g, ''));
    if (!Number.isFinite(value)) return null;
    return -value;
  }

  const match = normalized.match(/-?[\d,]+/);
  if (!match) return null;
  const value = Number(match[0].replace(/,/g, ''));
  if (!Number.isFinite(value)) return null;

  const isBc = normalized.includes('bc') || normalized.includes('bce');
  const isAd = normalized.includes('ad') || normalized.includes('ce') || normalized.includes('ms');

  if (isBc) return -Math.abs(value);
  if (isAd) return Math.abs(value);
  if (value < 0) return value;

  return value;
}

function fallbackEraRange(era: string): EraRange {
  const text = era.toLowerCase();
  if (text.includes('ancient')) {
    return { startYear: -3000, endYear: 500, label: era };
  }
  if (text.includes('medieval')) {
    return { startYear: 500, endYear: 1500, label: era };
  }
  if (text.includes('modern')) {
    return { startYear: 1500, endYear: CURRENT_YEAR, label: era };
  }
  return { startYear: -1200, endYear: 800, label: era };
}

export function parseEraRange(era: string): EraRange {
  const normalized = normalizeEraEncoding(era);
  const parts = normalized
    .split('-')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return fallbackEraRange(era);
  if (parts.length === 1) {
    const year = parseEraToken(parts[0]);
    if (year === null) return fallbackEraRange(era);
    return { startYear: year - 100, endYear: year, label: era };
  }

  const maybeStart = parseEraToken(parts[0]);
  const maybeEnd = parseEraToken(parts[1]);
  if (maybeStart === null || maybeEnd === null) return fallbackEraRange(era);

  return {
    startYear: Math.min(maybeStart, maybeEnd),
    endYear: Math.max(maybeStart, maybeEnd),
    label: era,
  };
}

export function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(Math.round(year))} BCE`;
  if (year === 0) return '0';
  return `${Math.round(year)} CE`;
}

export function timelinePointsFromEra(era: string): TimelinePoint[] {
  const range = parseEraRange(era);
  const midpoint = Math.round((range.startYear + range.endYear) / 2);

  return [
    { label: 'Origin', year: range.startYear, displayYear: formatYear(range.startYear) },
    { label: 'Peak', year: midpoint, displayYear: formatYear(midpoint) },
    { label: 'Late', year: range.endYear, displayYear: formatYear(range.endYear) },
  ];
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

function toLowerSet(values: string[]): Set<string> {
  return new Set(values.map((value) => value.toLowerCase().trim()).filter(Boolean));
}

function intersection(valuesA: Set<string>, valuesB: Set<string>): string[] {
  const shared: string[] = [];
  valuesA.forEach((value) => {
    if (valuesB.has(value)) shared.push(value);
  });
  return shared;
}

function mythologyProfile(mythItems: MythData[], deityItems: DeityData[]): Record<string, boolean> {
  const mythTypeSet = toLowerSet(mythItems.map((myth) => myth.type));
  const textBlob = [
    ...mythItems.flatMap((myth) => [myth.name, myth.summary, ...(myth.themes || []), ...(myth.tags || [])]),
    ...deityItems.flatMap((deity) => [deity.name, deity.description, ...(deity.domain || []), ...(deity.symbols || [])]),
  ]
    .join(' ')
    .toLowerCase();
  const deityTypeSet = toLowerSet(deityItems.map((deity) => deity.type));

  return CONCEPT_DEFINITIONS.reduce<Record<string, boolean>>((acc, concept) => {
    const hasMythType = (concept.mythTypes || []).some((type) => mythTypeSet.has(type));
    const hasKeywords = (concept.keywords || []).some((keyword) => textBlob.includes(keyword));
    const hasDeityType = (concept.deityTypes || []).some((type) => deityTypeSet.has(type));
    acc[concept.id] = hasMythType || hasKeywords || hasDeityType;
    return acc;
  }, {});
}

function themeSetForMythology(mythItems: MythData[]): Set<string> {
  return toLowerSet(mythItems.flatMap((myth) => [...(myth.themes || []), ...(myth.tags || [])]));
}

export function findSimilarMythologies(
  base: MythologyData,
  allMythologies: MythologyData[],
  allMyths: MythData[],
  allDeities: DeityData[],
  limit = 4,
  allowedIds?: Iterable<string>
): SimilarMythology[] {
  const mythsByMythology = new Map<string, MythData[]>();
  const deitiesByMythology = new Map<string, DeityData[]>();

  for (const mythology of allMythologies) {
    mythsByMythology.set(
      mythology.id,
      allMyths.filter((myth) => myth.mythologyId === mythology.id)
    );
    deitiesByMythology.set(
      mythology.id,
      allDeities.filter((deity) => deity.mythologyId === mythology.id)
    );
  }

  const baseMyths = mythsByMythology.get(base.id) || [];
  const baseDeities = deitiesByMythology.get(base.id) || [];
  const baseThemeSet = themeSetForMythology(baseMyths);
  const baseProfile = mythologyProfile(baseMyths, baseDeities);

  const allowedIdSet = allowedIds ? new Set(allowedIds) : null;
  const scored = allMythologies
    .filter((item) => item.id !== base.id && (!allowedIdSet || allowedIdSet.has(item.id)))
    .map((candidate) => {
      const candidateMyths = mythsByMythology.get(candidate.id) || [];
      const candidateDeities = deitiesByMythology.get(candidate.id) || [];
      const candidateThemeSet = themeSetForMythology(candidateMyths);
      const candidateProfile = mythologyProfile(candidateMyths, candidateDeities);

      const sharedThemes = intersection(baseThemeSet, candidateThemeSet).slice(0, 8);
      const sharedConcepts = CONCEPT_DEFINITIONS.filter(
        (concept) => baseProfile[concept.id] && candidateProfile[concept.id]
      ).map((concept) => concept.label);

      const distanceKm = haversineKm(base.origin, candidate.origin);
      const proximityScore = Math.max(0, 6 - distanceKm / 1200);
      const score =
        sharedConcepts.length * 4 +
        Math.min(sharedThemes.length, 8) * 1.2 +
        proximityScore;

      return {
        mythology: candidate,
        score,
        sharedThemes,
        sharedConcepts,
        distanceKm,
      };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

export function buildConceptComparison(
  baseMyths: MythData[],
  baseDeities: DeityData[],
  compareMyths: MythData[],
  compareDeities: DeityData[]
): ConceptComparison[] {
  const baseProfile = mythologyProfile(baseMyths, baseDeities);
  const compareProfile = mythologyProfile(compareMyths, compareDeities);

  return CONCEPT_DEFINITIONS.map((concept) => ({
    id: concept.id,
    label: concept.label,
    baseHas: Boolean(baseProfile[concept.id]),
    compareHas: Boolean(compareProfile[concept.id]),
  }));
}

export function formatSlugLabel(value: string): string {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function mythTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    creation: 'Creation',
    hero: 'Heroic',
    trickster: 'Trickster',
    love: 'Love',
    war: 'War',
    afterlife: 'Afterlife',
    nature: 'Nature',
    cosmology: 'Cosmology',
    transformation: 'Transformation',
    quest: 'Quest',
  };
  return labels[type.toLowerCase()] || formatSlugLabel(type);
}

export function deityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    god: 'God',
    goddess: 'Goddess',
    demigod: 'Demigod',
    titan: 'Titan',
    spirit: 'Spirit',
    trickster: 'Trickster',
    monster: 'Monster',
  };
  return labels[type.toLowerCase()] || formatSlugLabel(type);
}

export function domainIcon(domain: string): string {
  const key = domain.toLowerCase();
  if (key.includes('sky') || key.includes('storm')) return '☁';
  if (key.includes('thunder') || key.includes('lightning')) return '⚡';
  if (key.includes('sea') || key.includes('water') || key.includes('ocean')) return '🌊';
  if (key.includes('war') || key.includes('battle')) return '🛡';
  if (key.includes('love') || key.includes('beauty')) return '❤';
  if (key.includes('death') || key.includes('underworld')) return '☠';
  if (key.includes('sun') || key.includes('fire')) return '☀';
  if (key.includes('moon') || key.includes('night')) return '☾';
  if (key.includes('wisdom') || key.includes('knowledge')) return '📜';
  if (key.includes('magic') || key.includes('prophecy')) return '✦';
  if (key.includes('nature') || key.includes('earth')) return '🌿';
  if (key.includes('fertility')) return '🌾';
  return '◆';
}

export function sourceDescription(source: string): string {
  if (SOURCE_DESCRIPTIONS[source]) return SOURCE_DESCRIPTIONS[source];

  const lower = source.toLowerCase();
  if (lower.includes('oral tradition')) return 'Transmitted orally across generations before written compilation.';
  if (lower.includes('epic')) return 'Epic narrative source preserving core mythic cycles of its culture.';
  if (lower.includes('hymn')) return 'Ritual or devotional hymn preserving theological and mythic material.';
  if (lower.includes('saga')) return 'Saga literature preserving mythic memory through heroic storytelling.';
  if (lower.includes('purana')) return 'Purana literature blending cosmology, theology, and legendary narrative.';
  return 'Classical source text connected to this mythic tradition.';
}

export interface CharacterCardData {
  name: string;
  role: string;
  deityId?: string;
}

function normalizeName(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function buildDeityNameIndex(items: DeityData[]): Map<string, DeityData> {
  const index = new Map<string, DeityData>();
  for (const deity of items) {
    index.set(normalizeName(deity.name), deity);
    for (const alt of deity.alternateNames || []) {
      index.set(normalizeName(alt), deity);
    }
  }
  return index;
}

export function buildCharacterCards(myth: MythData, allDeities: DeityData[]): CharacterCardData[] {
  const deityByName = buildDeityNameIndex(allDeities);

  return myth.characters.map((character, index) => {
    const deity = deityByName.get(normalizeName(character));
    const lowerType = myth.type.toLowerCase();
    const role =
      deity
        ? `${deityTypeLabel(deity.type)} figure`
        : index === 0 && lowerType === 'hero'
          ? 'Primary hero'
          : lowerType === 'trickster'
            ? 'Narrative trickster'
            : lowerType === 'creation'
              ? 'Primordial figure'
              : index === 0
                ? 'Central figure'
                : 'Supporting figure';

    return {
      name: character,
      role,
      deityId: deity?.id,
    };
  });
}

export function explainMythSimilarity(base: MythData, parallel: MythData): string {
  const baseThemes = toLowerSet(base.themes || []);
  const parallelThemes = toLowerSet(parallel.themes || []);
  const sharedThemes = intersection(baseThemes, parallelThemes).slice(0, 3);
  const sameType = base.type.toLowerCase() === parallel.type.toLowerCase();

  if (sharedThemes.length > 0 && sameType) {
    return `Both are ${mythTypeLabel(base.type).toLowerCase()} narratives with shared motifs like ${sharedThemes.join(', ')}.`;
  }
  if (sharedThemes.length > 0) {
    return `The stories converge on themes such as ${sharedThemes.join(', ')}, even though they differ in structure.`;
  }
  if (sameType) {
    return `Both are ${mythTypeLabel(base.type).toLowerCase()} narratives that express similar cultural concerns in different regions.`;
  }
  return 'These narratives are linked through comparable symbolic patterns and mythic functions across cultures.';
}

export function mythSimilarityPercent(base: MythData, parallel: MythData): number {
  const baseThemes = toLowerSet(base.themes || []);
  const targetThemes = toLowerSet(parallel.themes || []);
  const sharedThemes = intersection(baseThemes, targetThemes).length;

  const baseCharacters = toLowerSet(base.characters || []);
  const targetCharacters = toLowerSet(parallel.characters || []);
  const sharedCharacters = intersection(baseCharacters, targetCharacters).length;

  const typeScore = base.type === parallel.type ? 28 : 0;
  const baseParallelIds = mythParallelIds(base);
  const targetParallelIds = mythParallelIds(parallel);
  const parallelLinkBoost =
    baseParallelIds.includes(parallel.id) || targetParallelIds.includes(base.id) ? 16 : 0;
  const themeScore = Math.min(38, sharedThemes * 9);
  const characterScore = Math.min(18, sharedCharacters * 6);

  return Math.max(18, Math.min(98, Math.round(typeScore + parallelLinkBoost + themeScore + characterScore + 18)));
}

export function mythParallelCultureCount(base: MythData, allMyths: MythData[]): number {
  const mythById = new Map(allMyths.map((item) => [item.id, item]));
  const cultures = new Set<string>([base.mythologyId]);
  mythParallelIds(base).forEach((id) => {
    const linked = mythById.get(id);
    if (linked) cultures.add(linked.mythologyId);
  });
  return cultures.size;
}

export function deityEquivalentCultureCount(base: DeityData, allDeities: DeityData[]): number {
  const deityById = new Map(allDeities.map((item) => [item.id, item]));
  const cultures = new Set<string>([base.mythologyId]);

  base.equivalents.forEach((id) => {
    const linked = deityById.get(id);
    if (linked) cultures.add(linked.mythologyId);
  });

  allDeities.forEach((item) => {
    if (item.id !== base.id && item.equivalents.includes(base.id)) {
      cultures.add(item.mythologyId);
    }
  });

  return cultures.size;
}

export function sourceCitation(source: string): string {
  const estimatedDates: Record<string, string> = {
    Iliad: 'c. 8th century BCE',
    Odyssey: 'c. 8th century BCE',
    Theogony: 'c. 700 BCE',
    'Works and Days': 'c. 700 BCE',
    'Prometheus Bound': 'c. 5th century BCE',
    Aeneid: 'c. 29-19 BCE',
    'Prose Edda': 'c. 13th century CE',
    'Poetic Edda': 'c. 13th century CE',
    'Epic of Gilgamesh': 'c. 2100-1200 BCE',
    'Enuma Elish': 'c. 2nd millennium BCE',
    Ramayana: 'c. 5th-1st century BCE',
    Mahabharata: 'c. 4th century BCE-4th century CE',
    'Book of the Dead': 'c. 1550 BCE onward',
    Metamorphoses: '8 CE',
  };

  const year = estimatedDates[source] || 'undated classical transmission';
  return `${source}. Critical tradition reference; estimated composition ${year}.`;
}

export function siteTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    temple: 'Temple',
    mountain: 'Mountain',
    natural: 'Natural Site',
    city: 'Sacred City',
    oracle: 'Oracle',
    ruins: 'Ruins',
    palace: 'Palace',
  };
  return labels[type.toLowerCase()] || formatSlugLabel(type);
}

export function toWorldMapPoint(
  lat: number,
  lng: number,
  width: number,
  height: number
): { x: number; y: number } {
  return {
    x: ((lng + 180) / 360) * width,
    y: ((90 - lat) / 180) * height,
  };
}
