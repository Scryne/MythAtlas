import {
  deities,
  getMythologyBundles,
  mythParallelIds,
  mythById,
  mythologies,
  myths,
  sacredSites,
  siteArtifactCount,
  type DeityData,
  type MythData,
  type MythologyData,
} from '@/lib/myth-data';
import { getMythsByDNA } from '@/lib/dna';
import { parseEraRange } from '@/lib/myth-utils';

interface ThemeDefinition {
  id: string;
  name: string;
  icon: string;
  terms: string[];
  mythTypes?: string[];
}

interface CollectionDefinition {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  featured?: boolean;
  matchMyth: (myth: MythData) => boolean;
}

export interface ThemeSummary {
  id: string;
  name: string;
  icon: string;
  mythCount: number;
  topCultures: string[];
  description: string;
}

export interface ThemeNetworkNode {
  id: string;
  label: string;
  icon: string;
  count: number;
}

export interface ThemeNetworkEdge {
  source: string;
  target: string;
  weight: number;
}

export interface ThematicCollection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  featured: boolean;
  mythCount: number;
  mythologyCount: number;
  previewMyths: Array<{ id: string; name: string }>;
}

export interface DailyMythFeature {
  myth: MythData;
  mythology: MythologyData | undefined;
  similar: MythData[];
}

export interface ExploreTarget {
  kind: 'myth' | 'deity' | 'site';
  id: string;
  label: string;
  href: string;
}

export interface TotalsData {
  mythologies: number;
  myths: number;
  deities: number;
  sacredSites: number;
}

export interface MythsByTypeDatum {
  type: string;
  count: number;
}

export interface MythologyHeatDatum {
  id: string;
  name: string;
  mythCount: number;
  boundingBox: [number, number, number, number];
  color: string;
}

export interface ConnectedMythDatum {
  id: string;
  name: string;
  mythology: string;
  connections: number;
}

export interface DomainBubbleDatum {
  domain: string;
  count: number;
  x: number;
  y: number;
  z: number;
}

export interface SacredSiteTypeDatum {
  type: string;
  count: number;
}

export interface TimelineDatum {
  id: string;
  name: string;
  region: string;
  startYear: number;
  endYear: number;
  startOffset: number;
  duration: number;
  mythCount: number;
}

export interface TimelineMeta {
  minYear: number;
  maxYear: number;
}

export interface FunFact {
  label: string;
  value: string;
  detail: string;
  href?: string;
}

export interface ArchaeologyProtectionDatum {
  status: string;
  count: number;
}

export interface ExcavationDecadeDatum {
  decade: string;
  decadeStart: number;
  count: number;
}

export interface ArtifactCountryDatum {
  country: string;
  artifactCount: number;
  boundingBox?: [number, number, number, number];
}

export interface ArtifactRichMythologyDatum {
  id: string;
  name: string;
  artifactCount: number;
  siteCount: number;
}

const themeDefinitions: ThemeDefinition[] = [
  { id: 'death', name: 'Olum', icon: '☠', terms: ['death', 'afterlife', 'underworld', 'loss'] },
  { id: 'rebirth', name: 'Yeniden Dogus', icon: '◌', terms: ['rebirth', 'resurrection', 'renewal'] },
  { id: 'creation', name: 'Yaratilis', icon: '✶', terms: ['creation', 'origin', 'primordial'], mythTypes: ['creation'] },
  { id: 'flood', name: 'Tufan', icon: '≈', terms: ['flood', 'deluge', 'ark', 'inundation', 'water'] },
  { id: 'trickster', name: 'Hilebaz', icon: '⚝', terms: ['trickster', 'trickery', 'cleverness', 'theft'], mythTypes: ['trickster'] },
  { id: 'hero', name: 'Kahramanlik', icon: '⚔', terms: ['hero', 'heroism', 'trial', 'journey', 'quest'], mythTypes: ['hero', 'quest'] },
  { id: 'love', name: 'Ask', icon: '♥', terms: ['love', 'devotion', 'betrayal'] },
  { id: 'war', name: 'Savas', icon: '🛡', terms: ['war', 'battle', 'conflict'], mythTypes: ['war'] },
  { id: 'nature', name: 'Doga', icon: '❧', terms: ['nature', 'seasons', 'fertility', 'harvest'], mythTypes: ['nature'] },
  { id: 'transformation', name: 'Donusum', icon: '◇', terms: ['transformation', 'metamorphosis', 'change'], mythTypes: ['transformation'] },
];

const collectionDefinitions: CollectionDefinition[] = [
  {
    id: 'great-floods',
    title: 'Buyuk Tufan Mitleri',
    subtitle: '20 kultur',
    description: 'Kulturel hafizada su baskini ve yeniden baslangic anlatilari.',
    accent: '#5aa7d9',
    matchMyth: (myth) => matchesTheme(myth, themeDefinitionById.get('flood')),
  },
  {
    id: 'oldest-gods',
    title: 'Dunyanin En Eski Tanrilari',
    subtitle: 'Ilk panteonlar',
    description: 'En eski mitolojik sistemlerde ortaya cikan ilahlar.',
    accent: '#d9b15a',
    matchMyth: (myth) => {
      const mythology = mythologyById.get(myth.mythologyId);
      if (!mythology) return false;
      return parseEraRange(mythology.era).startYear <= -1200;
    },
  },
  {
    id: 'hero-journeys',
    title: 'Kahraman Yolculuklari',
    subtitle: 'Sinav ve donusum',
    description: 'Kahramanlarin zorlu yolculuklari ve kader testleri.',
    accent: '#e88b4d',
    matchMyth: (myth) => matchesTheme(myth, themeDefinitionById.get('hero')),
  },
  {
    id: 'love-tragedy',
    title: 'Ask ve Trajedi',
    subtitle: 'Tutku ve kayip',
    description: 'Ask, fedakarlik ve aci sonlarin mitolojik kesismeleri.',
    accent: '#da6f8d',
    matchMyth: (myth) => {
      const blob = mythBlob(myth);
      return matchesTheme(myth, themeDefinitionById.get('love')) || blob.includes('traged') || blob.includes('loss');
    },
  },
  {
    id: 'dragons-monsters',
    title: 'Ejderhalar ve Canavarlar',
    subtitle: 'Kaosla savas',
    description: 'Duzen ve kaos arasindaki efsanevi canavar anlatilari.',
    accent: '#8f7cf2',
    matchMyth: (myth) => {
      const blob = mythBlob(myth);
      return blob.includes('dragon') || blob.includes('monster') || blob.includes('slaying');
    },
  },
  {
    id: 'creation-stories',
    title: 'Yaratilis Hikayeleri',
    subtitle: 'Kozmik baslangic',
    description: 'Evrenin ve insanligin kokenine dair kutsal anlatilar.',
    accent: '#4dc2ae',
    matchMyth: (myth) => matchesTheme(myth, themeDefinitionById.get('creation')),
  },
  {
    id: 'turkic-central-asia',
    title: 'Turk ve Orta Asya Mitolojisi',
    subtitle: 'Ozel secki',
    description: 'Anadolu ve Orta Asya ekseninde bicimlenen mitik aglar.',
    accent: '#f09e44',
    featured: true,
    matchMyth: (myth) => {
      const mythology = mythologyById.get(myth.mythologyId);
      if (!mythology) return false;
      const text = normalizeText(`${mythology.name} ${mythology.region} ${mythology.culture} ${mythology.tags.join(' ')}`);
      return (
        text.includes('turk') ||
        text.includes('anatolia') ||
        text.includes('central asia') ||
        text.includes('mongol') ||
        text.includes('steppe')
      );
    },
  },
  {
    id: 'lost-mythologies',
    title: 'Kayip Mitolojiler',
    subtitle: 'Sinirli kaynak',
    description: 'Yetersiz belgelenmis veya parcali ulasan mitolojik sistemler.',
    accent: '#9a9a9a',
    matchMyth: (myth) => {
      const mythology = mythologyById.get(myth.mythologyId);
      if (!mythology) return false;
      const tags = normalizeText(mythology.tags.join(' '));
      return (
        tags.includes('lost') ||
        tags.includes('fragment') ||
        tags.includes('extinct') ||
        mythology.pantheonSize <= 18
      );
    },
  },
];

const mythologyById = new Map(mythologies.map((item) => [item.id, item]));
const mythologyBundles = getMythologyBundles();
const mythologyBundleById = new Map(mythologyBundles.map((item) => [item.mythology.id, item]));
const deitiesById = new Map(deities.map((item) => [item.id, item]));
const mythsByMythology = buildGroupMap(myths, (item) => item.mythologyId);
const sitesByMythology = buildGroupMap(sacredSites, (item) => item.mythologyId);
const themeDefinitionById = new Map(themeDefinitions.map((item) => [item.id, item]));

const COUNTRY_BOUNDING_BOXES: Record<string, [number, number, number, number]> = {
  turkey: [26, 36, 45, 42.5],
  greece: [19, 34.5, 29.8, 41.7],
  egypt: [24, 21.5, 36.9, 31.8],
  italy: [7, 36.5, 18.7, 47.2],
  'united kingdom': [-8.7, 49.8, 1.8, 59.2],
  france: [-5.2, 41.2, 8.5, 51.2],
  germany: [5.8, 47.1, 15.1, 55.1],
  iraq: [38.7, 29.1, 48.6, 37.4],
  iran: [44, 24.8, 63.3, 39.9],
  peru: [-81.5, -18.6, -68.5, -0.1],
  mexico: [-117.2, 14.5, -86.4, 32.7],
  cambodia: [102.3, 10.1, 107.8, 14.7],
  indonesia: [95, -10.9, 141, 5.9],
  india: [68.1, 6.5, 97.5, 35.7],
  usa: [-125, 24.2, -66.8, 49.4],
  'united states': [-125, 24.2, -66.8, 49.4],
  russia: [19, 41.2, 180, 81.9],
  china: [73.5, 18, 134.8, 53.6],
};

function buildGroupMap<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
}

function normalizeText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toLabel(input: string): string {
  return input
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join(' ');
}

function mythBlob(myth: MythData): string {
  return normalizeText([
    myth.name,
    myth.type,
    myth.summary,
    myth.significance,
    ...(myth.themes || []),
    ...(myth.tags || []),
  ].join(' '));
}

function matchesTheme(myth: MythData, definition: ThemeDefinition | undefined): boolean {
  if (!definition) return false;
  const blob = mythBlob(myth);
  const hasType = definition.mythTypes?.some((type) => normalizeText(myth.type) === normalizeText(type)) ?? false;
  const hasTerm = definition.terms.some((term) => blob.includes(normalizeText(term)));
  return hasType || hasTerm;
}

function scoreSimilarity(base: MythData, candidate: MythData): number {
  if (base.id === candidate.id) return -1;
  let score = 0;

  if (base.type === candidate.type) score += 4;
  if (base.mythologyId === candidate.mythologyId) score += 2;

  const baseThemes = new Set((base.themes || []).map((theme) => normalizeText(theme)));
  for (const theme of candidate.themes || []) {
    if (baseThemes.has(normalizeText(theme))) score += 1.5;
  }

  const baseChars = new Set((base.characters || []).map((name) => normalizeText(name)));
  for (const character of candidate.characters || []) {
    if (baseChars.has(normalizeText(character))) score += 0.9;
  }

  if (mythParallelIds(base).includes(candidate.id)) score += 8;
  if (mythParallelIds(candidate).includes(base.id)) score += 6;

  return score;
}

function mythologiesCovered(mythItems: MythData[]): Set<string> {
  return new Set(mythItems.map((item) => item.mythologyId));
}

function directAndReverseEquivalents(base: DeityData): DeityData[] {
  const linkedIds = new Set<string>();
  for (const id of base.equivalents) linkedIds.add(id);
  for (const deity of deities) {
    if (deity.id !== base.id && deity.equivalents.includes(base.id)) linkedIds.add(deity.id);
  }
  return Array.from(linkedIds)
    .map((id) => deitiesById.get(id))
    .filter((item): item is DeityData => Boolean(item));
}

export function getUniversalThemeDefinitions(): ThemeDefinition[] {
  return themeDefinitions;
}

export function getThemeSummaries(): ThemeSummary[] {
  return themeDefinitions
    .map((definition) => {
      const matchingMyths = myths.filter((myth) => matchesTheme(myth, definition));

      const cultureFrequency = new Map<string, number>();
      for (const myth of matchingMyths) {
        const mythology = mythologyById.get(myth.mythologyId);
        if (!mythology) continue;
        cultureFrequency.set(mythology.name, (cultureFrequency.get(mythology.name) ?? 0) + 1);
      }

      const topCultures = Array.from(cultureFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name);

      return {
        id: definition.id,
        name: definition.name,
        icon: definition.icon,
        mythCount: matchingMyths.length,
        topCultures,
        description: `${definition.name} temasini tasiyan mitler`,
      };
    })
    .filter((theme) => theme.mythCount > 0)
    .sort((a, b) => b.mythCount - a.mythCount);
}

export function getMythsForTheme(themeId: string): MythData[] {
  const definition = themeDefinitionById.get(themeId);
  if (!definition) return [];
  return myths
    .filter((myth) => matchesTheme(myth, definition))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function buildThemeNetwork(minEdgeWeight = 3): { nodes: ThemeNetworkNode[]; edges: ThemeNetworkEdge[] } {
  const activeThemes = getThemeSummaries();
  const activeDefinitionIds = new Set(activeThemes.map((item) => item.id));

  const coOccurrence = new Map<string, number>();

  for (const myth of myths) {
    const present = themeDefinitions
      .filter((definition) => activeDefinitionIds.has(definition.id))
      .filter((definition) => matchesTheme(myth, definition))
      .map((definition) => definition.id);

    for (let i = 0; i < present.length; i += 1) {
      for (let j = i + 1; j < present.length; j += 1) {
        const [a, b] = [present[i], present[j]].sort();
        const key = `${a}::${b}`;
        coOccurrence.set(key, (coOccurrence.get(key) ?? 0) + 1);
      }
    }
  }

  const edges = Array.from(coOccurrence.entries())
    .map(([key, weight]) => {
      const [source, target] = key.split('::');
      return { source, target, weight };
    })
    .filter((edge) => edge.weight >= minEdgeWeight)
    .sort((a, b) => b.weight - a.weight);

  const connectedIds = new Set<string>();
  for (const edge of edges) {
    connectedIds.add(edge.source);
    connectedIds.add(edge.target);
  }

  const nodes = activeThemes
    .filter((theme) => connectedIds.has(theme.id))
    .map((theme) => ({
      id: theme.id,
      label: theme.name,
      icon: theme.icon,
      count: theme.mythCount,
    }));

  return { nodes, edges };
}

export function getDailyMythFeature(date = new Date()): DailyMythFeature {
  const seed = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000);
  const index = Math.abs(seed) % myths.length;
  const myth = myths[index];
  const mythology = mythologyById.get(myth.mythologyId);
  const similar = getSimilarMyths(myth, 5);
  return { myth, mythology, similar };
}

export function getSimilarMyths(baseMyth: MythData, limit = 5): MythData[] {
  const dnaMatches = getMythsByDNA(baseMyth.id, myths, limit).map((match) => match.myth);
  if (dnaMatches.length >= limit) return dnaMatches.slice(0, limit);

  const candidates = myths
    .map((myth) => ({ myth, score: scoreSimilarity(baseMyth, myth) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.myth);

  return candidates;
}

export function getThematicCollections(): ThematicCollection[] {
  return collectionDefinitions.map((definition) => {
    const matchingMyths = myths.filter((myth) => definition.matchMyth(myth));
    const mythologyCount = mythologiesCovered(matchingMyths).size;
    const previewMyths = matchingMyths.slice(0, 4).map((myth) => ({ id: myth.id, name: myth.name }));

    return {
      id: definition.id,
      title: definition.title,
      subtitle: definition.subtitle,
      description: definition.description,
      accent: definition.accent,
      featured: Boolean(definition.featured),
      mythCount: matchingMyths.length,
      mythologyCount,
      previewMyths,
    };
  });
}

export function getRandomExploreTarget(): ExploreTarget {
  const pool: ExploreTarget[] = [
    ...myths.map((myth) => ({ kind: 'myth' as const, id: myth.id, label: myth.name, href: `/myth/${myth.id}` })),
    ...deities.map((deity) => ({ kind: 'deity' as const, id: deity.id, label: deity.name, href: `/deity/${deity.id}` })),
    ...sacredSites.map((site) => ({ kind: 'site' as const, id: site.id, label: site.name, href: `/site/${site.id}` })),
  ];
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

export function getTotalsData(): TotalsData {
  return {
    mythologies: mythologies.length,
    myths: myths.length,
    deities: deities.length,
    sacredSites: sacredSites.length,
  };
}

export function getMythsByTypeData(): MythsByTypeDatum[] {
  const grouped = new Map<string, number>();
  for (const myth of myths) {
    grouped.set(myth.type, (grouped.get(myth.type) ?? 0) + 1);
  }

  return Array.from(grouped.entries())
    .map(([type, count]) => ({ type: toLabel(type), count }))
    .sort((a, b) => b.count - a.count);
}

export function getMythologyHeatData(): MythologyHeatDatum[] {
  return mythologyBundles.map((bundle) => ({
    id: bundle.mythology.id,
    name: bundle.mythology.name,
    mythCount: bundle.datasetCounts.myths,
    boundingBox: bundle.mythology.boundingBox,
    color: bundle.mythology.color,
  }));
}

export function getMostConnectedMyths(limit = 10): ConnectedMythDatum[] {
  const reverseLinks = new Map<string, Set<string>>();
  for (const myth of myths) {
    for (const linked of mythParallelIds(myth)) {
      const bucket = reverseLinks.get(linked);
      if (bucket) {
        bucket.add(myth.id);
      } else {
        reverseLinks.set(linked, new Set([myth.id]));
      }
    }
  }

  return myths
    .map((myth) => {
      const linked = new Set<string>(mythParallelIds(myth));
      const reverse = reverseLinks.get(myth.id);
      if (reverse) {
        reverse.forEach((id) => linked.add(id));
      }

      const mythology = mythologyById.get(myth.mythologyId);
      return {
        id: myth.id,
        name: myth.name,
        mythology: mythology?.name || myth.mythologyId,
        connections: linked.size,
      };
    })
    .sort((a, b) => b.connections - a.connections)
    .slice(0, limit);
}

export function getDeitiesByDomainData(limit = 24): DomainBubbleDatum[] {
  const grouped = new Map<string, number>();

  for (const deity of deities) {
    for (const domain of deity.domain || []) {
      const key = normalizeText(domain);
      if (!key) continue;
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    }
  }

  return Array.from(grouped.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([domain, count], index) => ({
      domain: toLabel(domain),
      count,
      x: index % 6,
      y: Math.floor(index / 6),
      z: count,
    }));
}

export function getSacredSitesByTypeData(): SacredSiteTypeDatum[] {
  const grouped = new Map<string, number>();
  for (const site of sacredSites) {
    grouped.set(site.type, (grouped.get(site.type) ?? 0) + 1);
  }

  return Array.from(grouped.entries())
    .map(([type, count]) => ({ type: toLabel(type), count }))
    .sort((a, b) => b.count - a.count);
}

export function getTimelineData(limit = 14): { data: TimelineDatum[]; meta: TimelineMeta } {
  const rows = mythologyBundles
    .map((bundle) => {
      const era = parseEraRange(bundle.mythology.era);
      return {
        id: bundle.mythology.id,
        name: bundle.mythology.name,
        region: bundle.mythology.region,
        startYear: era.startYear,
        endYear: era.endYear,
        mythCount: bundle.datasetCounts.myths,
      };
    })
    .sort((a, b) => a.startYear - b.startYear)
    .slice(0, limit);

  const minYear = Math.min(...rows.map((row) => row.startYear));
  const maxYear = Math.max(...rows.map((row) => row.endYear));

  const data = rows.map((row) => ({
    ...row,
    startOffset: row.startYear - minYear,
    duration: Math.max(1, row.endYear - row.startYear),
  }));

  return {
    data,
    meta: { minYear, maxYear },
  };
}

function parseYearToken(value?: string): number | null {
  if (!value) return null;
  const text = value.toLowerCase().replace(/[–—]/g, '-');
  const match = text.match(/-?\d{3,4}/);
  if (!match) return null;
  const raw = Number(match[0]);
  if (!Number.isFinite(raw)) return null;
  if (text.includes('bce') || text.includes('bc')) return -Math.abs(raw);
  return Math.abs(raw);
}

function countryKey(country: string): string {
  return normalizeText(country).replace(/\s+/g, ' ');
}

export function getArchaeologyProtectionStatusData(): ArchaeologyProtectionDatum[] {
  const grouped = new Map<string, number>();
  for (const site of sacredSites) {
    const status = site.archaeology?.discoveryHistory?.protectionStatus || 'unprotected';
    grouped.set(status, (grouped.get(status) ?? 0) + 1);
  }
  return Array.from(grouped.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}

export function getExcavationActivityByDecadeData(): ExcavationDecadeDatum[] {
  const grouped = new Map<number, number>();
  const currentYear = new Date().getUTCFullYear();

  sacredSites.forEach((site) => {
    (site.archaeology?.discoveryHistory?.majorExcavations || []).forEach((entry) => {
      const year = parseYearToken(entry.year);
      if (year == null || year < 1700 || year > currentYear + 1) return;
      const decadeStart = Math.floor(year / 10) * 10;
      grouped.set(decadeStart, (grouped.get(decadeStart) ?? 0) + 1);
    });
  });

  return Array.from(grouped.entries())
    .map(([decadeStart, count]) => ({
      decade: `${decadeStart}s`,
      decadeStart,
      count,
    }))
    .sort((a, b) => a.decadeStart - b.decadeStart);
}

export function getArtifactsByCurrentCountryData(): ArtifactCountryDatum[] {
  const grouped = new Map<string, number>();

  sacredSites.forEach((site) => {
    (site.archaeology?.museumConnections || []).forEach((museum) => {
      const country = museum.country?.trim() || 'Unknown';
      grouped.set(country, (grouped.get(country) ?? 0) + Number(museum.artifactCount || 0));
    });
  });

  return Array.from(grouped.entries())
    .map(([country, artifactCount]) => ({
      country,
      artifactCount,
      boundingBox: COUNTRY_BOUNDING_BOXES[countryKey(country)],
    }))
    .sort((a, b) => b.artifactCount - a.artifactCount);
}

export function getMostArtifactRichMythologiesData(limit = 8): ArtifactRichMythologyDatum[] {
  return mythologyBundles
    .map((bundle) => {
      const sites = bundle.sites;
      const artifactCount = sites.reduce((total, site) => total + siteArtifactCount(site), 0);
      const siteCount = sites.filter((site) => siteArtifactCount(site) > 0).length;
      return {
        id: bundle.mythology.id,
        name: bundle.mythology.name,
        artifactCount,
        siteCount,
      };
    })
    .sort((a, b) => b.artifactCount - a.artifactCount)
    .slice(0, limit);
}

function cultureCountForMyth(myth: MythData): number {
  const cultures = new Set<string>();
  cultures.add(myth.mythologyId);
  for (const linkedId of mythParallelIds(myth)) {
    const linked = mythById.get(linkedId);
    if (linked) cultures.add(linked.mythologyId);
  }
  return cultures.size;
}

function equivalentCultureCount(deity: DeityData): number {
  const cultures = new Set<string>([deity.mythologyId]);
  for (const equivalent of directAndReverseEquivalents(deity)) {
    cultures.add(equivalent.mythologyId);
  }
  return cultures.size;
}

export function getFunFacts(): FunFact[] {
  const mostUniversal = myths
    .map((myth) => ({ myth, cultures: cultureCountForMyth(myth) }))
    .sort((a, b) => b.cultures - a.cultures)[0];

  const oldestMyth = myths
    .map((myth) => ({ myth, start: parseEraRange(myth.era).startYear }))
    .sort((a, b) => a.start - b.start)[0];

  const mostParallelDeity = deities
    .map((deity) => ({ deity, cultures: equivalentCultureCount(deity) }))
    .sort((a, b) => b.cultures - a.cultures)[0];

  const mostSiteRich = mythologies
    .map((mythology) => ({
      mythology,
      sites: mythologyBundleById.get(mythology.id)?.datasetCounts.sites ?? 0,
    }))
    .sort((a, b) => b.sites - a.sites)[0];

  const mostComplexPantheon = [...mythologies].sort((a, b) => b.pantheonSize - a.pantheonSize)[0];

  return [
    {
      label: 'En evrensel mit',
      value: mostUniversal ? mostUniversal.myth.name : '-',
      detail: mostUniversal ? `${mostUniversal.cultures} farkli mitolojik sistemde paralel iz` : 'Veri bulunamadi',
      href: mostUniversal ? `/myth/${mostUniversal.myth.id}` : undefined,
    },
    {
      label: 'En eski kayitli mit',
      value: oldestMyth ? oldestMyth.myth.name : '-',
      detail: oldestMyth ? `${oldestMyth.myth.era}` : 'Veri bulunamadi',
      href: oldestMyth ? `/myth/${oldestMyth.myth.id}` : undefined,
    },
    {
      label: 'En cok kulturlerarasi esdegeri olan tanri',
      value: mostParallelDeity ? mostParallelDeity.deity.name : '-',
      detail: mostParallelDeity ? `${mostParallelDeity.cultures} kulturde karsilik` : 'Veri bulunamadi',
      href: mostParallelDeity ? `/deity/${mostParallelDeity.deity.id}` : undefined,
    },
    {
      label: 'En cok kutsal mekana sahip mitoloji',
      value: mostSiteRich ? mostSiteRich.mythology.name : '-',
      detail: mostSiteRich ? `${mostSiteRich.sites} kutsal mekan kaydi` : 'Veri bulunamadi',
      href: mostSiteRich ? `/mythology/${mostSiteRich.mythology.id}` : undefined,
    },
    {
      label: 'En karmasik panteon',
      value: mostComplexPantheon ? mostComplexPantheon.name : '-',
      detail: mostComplexPantheon ? `${mostComplexPantheon.pantheonSize} tanri/tanrica` : 'Veri bulunamadi',
      href: mostComplexPantheon ? `/mythology/${mostComplexPantheon.id}` : undefined,
    },
  ];
}
