import mythologiesJson from '@/data/mythologies.json';
import mythsJson from '@/data/myths.json';
import deitiesJson from '@/data/deities.json';
import sitesJson from '@/data/sacred-sites.json';
import mythologyConnectionsJson from '../../data/mythology-connections.json';

export interface Coordinates {
  lat: number;
  lng: number;
}

export type AcademicSourceType = 'primary' | 'secondary' | 'archaeological';

export interface AcademicSource {
  id: string;
  type: AcademicSourceType;
  title: string;
  author: string;
  year: number;
  originalLanguage: string;
  estimatedDate: string;
  description: string;
  relevantPassage: string;
  url: string;
  isOpenAccess: boolean;
  citationAPA: string;
  citationChicago: string;
}

export type MythConnectionType = 'diffusion' | 'convergent_evolution' | 'common_ancestor' | 'unknown';
export type MythControversyLevel = 'consensus' | 'accepted' | 'debated' | 'fringe';

export interface MythParallelEvidence {
  mythId: string;
  similarityScore: number;
  sharedElements: string[];
  divergences: string[];
  connectionType: MythConnectionType;
  connectionExplanation: string;
  keyScholars: string[];
  academicSourceIds: string[];
  controversyLevel: MythControversyLevel;
}

export type MythParallelReference = string | MythParallelEvidence;

export interface MythologyData {
  id: string;
  name: string;
  region: string;
  culture: string;
  era: string;
  origin: Coordinates;
  boundingBox: [number, number, number, number];
  color: string;
  description: string;
  significance: string;
  pantheonSize: number;
  primaryLanguage: string;
  imageUrl: string;
  tags: string[];
}

export type MythologyConnectionType =
  | 'influenced'
  | 'evolved_from'
  | 'absorbed'
  | 'parallel_development'
  | 'trade_contact'
  | 'conquest'
  | 'syncretism';

export type MythologyConnectionConsensus = 'established' | 'debated' | 'theory';

export interface MythologyInfluenceData {
  id: string;
  sourceId: string;
  targetId: string;
  type: MythologyConnectionType;
  strength: 1 | 2 | 3;
  description: string;
  examples: string[];
  period: string;
  academicConsensus: MythologyConnectionConsensus;
  sources: string[];
}

export interface MythData {
  id: string;
  mythologyId: string;
  name: string;
  type: string;
  origin: Coordinates;
  characters: string[];
  summary: string;
  significance: string;
  themes: string[];
  parallels: MythParallelReference[];
  era: string;
  imageUrl: string;
  sources: string[];
  tags: string[];
  dna: MythDNA;
  academicSources: AcademicSource[];
}

export type MythDNAEmotionalCore =
  | 'fear'
  | 'hope'
  | 'love'
  | 'grief'
  | 'wonder'
  | 'rage'
  | 'shame'
  | 'pride';

export type MythDNACosmicScope = 'personal' | 'communal' | 'civilizational' | 'universal';

export type MythDNAOriginTheory = 'diffusion' | 'convergent' | 'universal' | 'unknown';

export interface MythDNA {
  elements: string[];
  archetypes: string[];
  structure: string[];
  moralLesson: string;
  emotionalCore: MythDNAEmotionalCore;
  cosmicScope: MythDNACosmicScope;
  originTheory: MythDNAOriginTheory;
}

interface MythParallelRecord {
  mythId?: string;
  similarityScore?: number;
  sharedElements?: string[];
  divergences?: string[];
  connectionType?: MythConnectionType;
  connectionExplanation?: string;
  keyScholars?: string[];
  academicSourceIds?: string[];
  controversyLevel?: MythControversyLevel;
}

function normalizeParallelReferences(input: unknown): MythParallelReference[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && typeof (item as MythParallelRecord).mythId === 'string') {
        const typed = item as MythParallelRecord;
        return {
          mythId: typed.mythId as string,
          similarityScore: Number(typed.similarityScore ?? 65),
          sharedElements: Array.isArray(typed.sharedElements) ? typed.sharedElements : [],
          divergences: Array.isArray(typed.divergences) ? typed.divergences : [],
          connectionType: typed.connectionType ?? 'unknown',
          connectionExplanation: typed.connectionExplanation ?? '',
          keyScholars: Array.isArray(typed.keyScholars) ? typed.keyScholars : [],
          academicSourceIds: Array.isArray(typed.academicSourceIds) ? typed.academicSourceIds : [],
          controversyLevel: typed.controversyLevel ?? 'debated',
        } as MythParallelEvidence;
      }
      return null;
    })
    .filter((item): item is MythParallelReference => Boolean(item));
}

function normalizeAcademicSources(input: unknown): AcademicSource[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const typed = item as Partial<AcademicSource>;
      if (!typed.id || !typed.title || !typed.author) return null;
      return {
        id: typed.id,
        type: (typed.type as AcademicSourceType) || 'secondary',
        title: typed.title,
        author: typed.author,
        year: Number(typed.year ?? 0),
        originalLanguage: typed.originalLanguage || 'N/A',
        estimatedDate: typed.estimatedDate || 'N/A',
        description: typed.description || '',
        relevantPassage: typed.relevantPassage || '',
        url: typed.url || '',
        isOpenAccess: Boolean(typed.isOpenAccess),
        citationAPA: typed.citationAPA || '',
        citationChicago: typed.citationChicago || '',
      } as AcademicSource;
    })
    .filter((item): item is AcademicSource => Boolean(item));
}

function normalizeMythRecord(record: any): MythData {
  return {
    ...record,
    parallels: normalizeParallelReferences(record?.parallels),
    academicSources: normalizeAcademicSources(record?.academicSources),
  } as MythData;
}

export interface DeityData {
  id: string;
  mythologyId: string;
  name: string;
  alternateNames: string[];
  domain: string[];
  type: string;
  origin: Coordinates;
  description: string;
  myths: string[];
  equivalents: string[];
  imageUrl: string;
  symbols: string[];
  era: string;
}

export type ArchaeologyCurrentStatus =
  | 'active_excavation'
  | 'completed'
  | 'protected'
  | 'unexcavated'
  | 'inaccessible';

export type ArchaeologyProtectionStatus =
  | 'UNESCO'
  | 'national_heritage'
  | 'local_protection'
  | 'unprotected'
  | 'disputed';

export type ArchaeologyArtifactType =
  | 'sculpture'
  | 'inscription'
  | 'vessel'
  | 'jewelry'
  | 'architecture'
  | 'text'
  | 'relief'
  | 'mosaic';

export type ArchaeologyChronologyType =
  | 'construction'
  | 'destruction'
  | 'rediscovery'
  | 'excavation'
  | 'cultural_event'
  | 'conquest';

export interface ArchaeologyExcavationEntry {
  year: string;
  led_by: string;
  institution: string;
  findings: string;
}

export interface ArchaeologyArtifactEntry {
  id: string;
  name: string;
  type: ArchaeologyArtifactType;
  period: string;
  currentLocation: string;
  description: string;
  mythologicalSignificance: string;
  imageUrl: string;
  museumUrl: string;
}

export interface ArchaeologyInscriptionEntry {
  id: string;
  text: string;
  translation: string;
  language: string;
  period: string;
  significance: string;
  scholar: string;
}

export interface ArchaeologyModificationEntry {
  period: string;
  description: string;
}

export interface ArchaeologyMuseumConnectionEntry {
  museumName: string;
  city: string;
  country: string;
  collectionUrl: string;
  artifactCount: number;
  notableArtifacts: string[];
}

export interface ArchaeologyChronologyEntry {
  period: string;
  event: string;
  type: ArchaeologyChronologyType;
}

export interface ArchaeologyData {
  discoveryHistory: {
    firstDocumented: string;
    majorExcavations: ArchaeologyExcavationEntry[];
    currentStatus: ArchaeologyCurrentStatus;
    protectionStatus: ArchaeologyProtectionStatus;
  };
  artifacts: ArchaeologyArtifactEntry[];
  inscriptions: ArchaeologyInscriptionEntry[];
  architecture: {
    originalStructure: string;
    constructionPeriod: string;
    dimensions: string;
    materials: string[];
    constructionTechnique: string;
    modifications: ArchaeologyModificationEntry[];
    currentState: string;
  };
  museumConnections: ArchaeologyMuseumConnectionEntry[];
  chronology: ArchaeologyChronologyEntry[];
}

export interface SiteData {
  id: string;
  mythologyId: string;
  name: string;
  type: string;
  coordinates: Coordinates;
  description: string;
  significance?: string;
  associatedMyths?: string[];
  associatedDeities?: string[];
  myths?: string[];
  deities?: string[];
  era?: string;
  imageUrl: string;
  modernStatus?: string;
  country?: string;
  tags?: string[];
  stillExists?: boolean;
  archaeology?: ArchaeologyData;
}

export type MythologyBundleSection =
  | 'myths'
  | 'deities'
  | 'sites'
  | 'connections'
  | 'parallels'
  | 'comparable';

export interface MythologyBundleFlags {
  hasMyths: boolean;
  hasDeities: boolean;
  hasSites: boolean;
  hasConnections: boolean;
  hasComparableData: boolean;
}

export interface MythologyBundleDatasetCounts {
  canonicalPantheonSize: number;
  myths: number;
  deities: number;
  sites: number;
  outgoingConnections: number;
  incomingConnections: number;
  parallelMyths: number;
  parallelMythologies: number;
}

export interface MythologyBundleCompleteness extends MythologyBundleFlags {
  score: number;
  ratio: number;
  label: 'complete' | 'partial' | 'sparse';
}

export interface MythologyBundle {
  mythology: MythologyData;
  myths: MythData[];
  deities: DeityData[];
  sites: SiteData[];
  datasetCounts: MythologyBundleDatasetCounts;
  missingSections: MythologyBundleSection[];
  completeness: MythologyBundleCompleteness;
  safeParallels: {
    myths: MythData[];
    mythologies: MythologyData[];
  };
  safeInfluence: {
    incoming: MythologyInfluenceData[];
    outgoing: MythologyInfluenceData[];
  };
}

export const mythologies = mythologiesJson as MythologyData[];
export const myths = (mythsJson as any[]).map((record) => normalizeMythRecord(record));
export const deities = deitiesJson as DeityData[];
export const sacredSites = sitesJson as SiteData[];
export const mythologyConnections = mythologyConnectionsJson as MythologyInfluenceData[];

export const mythologyById = new Map(mythologies.map((item) => [item.id, item]));
export const mythById = new Map(myths.map((item) => [item.id, item]));
export const deityById = new Map(deities.map((item) => [item.id, item]));
export const siteById = new Map(sacredSites.map((item) => [item.id, item]));
const mythsByMythology = buildGroupMap(myths, (item) => item.mythologyId);
const deitiesByMythology = buildGroupMap(deities, (item) => item.mythologyId);
const sitesByMythology = buildGroupMap(sacredSites, (item) => item.mythologyId);
const outgoingConnectionsByMythology = buildGroupMap(mythologyConnections, (item) => item.sourceId);
const incomingConnectionsByMythology = buildGroupMap(mythologyConnections, (item) => item.targetId);

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

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function safeParallelMythsForMythology(mythologyId: string): MythData[] {
  return uniqueById(
    (mythsByMythology.get(mythologyId) || [])
      .flatMap((item) => mythParallelIds(item))
      .map((parallelId) => mythById.get(parallelId))
      .filter((item): item is MythData => Boolean(item && item.mythologyId !== mythologyId))
  );
}

function safeParallelMythologiesForMythology(mythologyId: string): MythologyData[] {
  return uniqueById(
    safeParallelMythsForMythology(mythologyId)
      .map((item) => mythologyById.get(item.mythologyId))
      .filter((item): item is MythologyData => Boolean(item))
  );
}

function buildMythologyCompleteness(flags: MythologyBundleFlags): MythologyBundleCompleteness {
  const score = Object.values(flags).filter(Boolean).length;
  return {
    ...flags,
    score,
    ratio: score / 5,
    label: score === 5 ? 'complete' : score >= 3 ? 'partial' : 'sparse',
  };
}

function buildMythologyBundle(mythology: MythologyData): MythologyBundle {
  const mythologyMyths = mythsByMythology.get(mythology.id) || [];
  const mythologyDeities = deitiesByMythology.get(mythology.id) || [];
  const mythologySites = sitesByMythology.get(mythology.id) || [];
  const safeParallelMyths = safeParallelMythsForMythology(mythology.id);
  const safeParallelMythologies = safeParallelMythologiesForMythology(mythology.id);
  const incoming = incomingConnectionsByMythology.get(mythology.id) || [];
  const outgoing = outgoingConnectionsByMythology.get(mythology.id) || [];

  const flags: MythologyBundleFlags = {
    hasMyths: mythologyMyths.length > 0,
    hasDeities: mythologyDeities.length > 0,
    hasSites: mythologySites.length > 0,
    hasConnections: incoming.length + outgoing.length > 0,
    hasComparableData: safeParallelMythologies.length > 0 || incoming.length + outgoing.length > 0,
  };

  const missingSections: MythologyBundleSection[] = [];
  if (!flags.hasMyths) missingSections.push('myths');
  if (!flags.hasDeities) missingSections.push('deities');
  if (!flags.hasSites) missingSections.push('sites');
  if (!flags.hasConnections) missingSections.push('connections');
  if (safeParallelMythologies.length === 0) missingSections.push('parallels');
  if (!flags.hasComparableData) missingSections.push('comparable');

  return {
    mythology,
    myths: mythologyMyths,
    deities: mythologyDeities,
    sites: mythologySites,
    datasetCounts: {
      canonicalPantheonSize: mythology.pantheonSize,
      myths: mythologyMyths.length,
      deities: mythologyDeities.length,
      sites: mythologySites.length,
      outgoingConnections: outgoing.length,
      incomingConnections: incoming.length,
      parallelMyths: safeParallelMyths.length,
      parallelMythologies: safeParallelMythologies.length,
    },
    missingSections,
    completeness: buildMythologyCompleteness(flags),
    safeParallels: {
      myths: safeParallelMyths,
      mythologies: safeParallelMythologies,
    },
    safeInfluence: {
      incoming,
      outgoing,
    },
  };
}

const mythologyBundles = mythologies.map((item) => buildMythologyBundle(item));
const mythologyBundleById = new Map(mythologyBundles.map((item) => [item.mythology.id, item]));

export function getMythology(id: string): MythologyData | undefined {
  return mythologyById.get(id);
}

export function getMyth(id: string): MythData | undefined {
  return mythById.get(id);
}

export function getDeity(id: string): DeityData | undefined {
  return deityById.get(id);
}

export function getSite(id: string): SiteData | undefined {
  return siteById.get(id);
}

export function mythsForMythology(mythologyId: string): MythData[] {
  return mythsByMythology.get(mythologyId) || [];
}

export function deitiesForMythology(mythologyId: string): DeityData[] {
  return deitiesByMythology.get(mythologyId) || [];
}

export function sitesForMythology(mythologyId: string): SiteData[] {
  return sitesByMythology.get(mythologyId) || [];
}

export function getMythologyBundle(id: string): MythologyBundle | undefined {
  return mythologyBundleById.get(id);
}

export function getMythologyBundles(): MythologyBundle[] {
  return mythologyBundles;
}

export function siteMythIds(site: SiteData): string[] {
  return site.associatedMyths ?? site.myths ?? [];
}

export function siteDeityIds(site: SiteData): string[] {
  return site.associatedDeities ?? site.deities ?? [];
}

export function isParallelEvidence(reference: MythParallelReference): reference is MythParallelEvidence {
  return Boolean(reference) && typeof reference !== 'string' && typeof reference.mythId === 'string';
}

export function getParallelMythId(reference: MythParallelReference): string {
  return typeof reference === 'string' ? reference : reference.mythId;
}

export function mythParallelIds(myth: Pick<MythData, 'parallels'>): string[] {
  return (myth.parallels || []).map((reference) => getParallelMythId(reference));
}

export function mythParallelEvidence(myth: Pick<MythData, 'parallels'>): MythParallelEvidence[] {
  return (myth.parallels || []).filter((reference): reference is MythParallelEvidence =>
    isParallelEvidence(reference)
  );
}

function firstYearFromText(input?: string): number | null {
  if (!input) return null;
  const normalized = String(input)
    .replace(/MÃ–/gi, 'BCE')
    .replace(/MS/gi, 'CE')
    .replace(/MÖ/gi, 'BCE')
    .replace(/â€“|—/g, '-');
  const match = normalized.match(/-?\d{1,4}/);
  if (!match) return null;
  const raw = Number(match[0]);
  if (!Number.isFinite(raw)) return null;
  const lowered = normalized.toLowerCase();
  if (lowered.includes('bce') || lowered.includes('bc')) return -Math.abs(raw);
  return raw;
}

function countryToken(value?: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

export function siteArchaeology(site: SiteData): ArchaeologyData | null {
  return site.archaeology ?? null;
}

export function siteArtifactCount(site: SiteData): number {
  return site.archaeology?.artifacts?.length ?? 0;
}

export function siteMuseumCount(site: SiteData): number {
  return site.archaeology?.museumConnections?.length ?? 0;
}

export function siteProtectionStatus(site: SiteData): ArchaeologyProtectionStatus | null {
  return site.archaeology?.discoveryHistory?.protectionStatus ?? null;
}

export function siteExcavationStatus(site: SiteData): ArchaeologyCurrentStatus | null {
  return site.archaeology?.discoveryHistory?.currentStatus ?? null;
}

export function siteExcavationStartYear(site: SiteData): number | null {
  const firstExcavation = site.archaeology?.discoveryHistory?.majorExcavations?.[0];
  if (!firstExcavation) return null;
  return firstYearFromText(firstExcavation.year);
}

export function siteHasForeignMuseumHoldings(site: SiteData): boolean {
  const siteCountry = countryToken(site.country);
  if (!siteCountry) return false;
  return (site.archaeology?.museumConnections || []).some(
    (museum) => countryToken(museum.country) && countryToken(museum.country) !== siteCountry
  );
}

export type ArchaeologyPeriodBucket =
  | 'prehistoric'
  | 'ancient'
  | 'classical'
  | 'medieval'
  | 'early_modern';

export function siteArchaeologyPeriod(site: SiteData): ArchaeologyPeriodBucket {
  const source =
    site.archaeology?.architecture?.constructionPeriod ||
    site.archaeology?.chronology?.[0]?.period ||
    site.era ||
    '';
  const year = firstYearFromText(source);
  if (year === null) return 'ancient';
  if (year < -3000) return 'prehistoric';
  if (year < -500) return 'ancient';
  if (year <= 500) return 'classical';
  if (year <= 1500) return 'medieval';
  return 'early_modern';
}
