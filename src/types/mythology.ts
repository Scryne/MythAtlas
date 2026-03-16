// ═══════════════════════════════════════════════════════════
// MythAtlas — Core Type Definitions
// ═══════════════════════════════════════════════════════════

export interface Coordinates {
  lat: number;
  lng: number;
}

export type BoundingBox = [number, number, number, number]; // [sw_lng, sw_lat, ne_lng, ne_lat]

// ── Mythology System ──────────────────────────────────────

export interface Mythology {
  id: string;
  name: string;
  region: string;
  culture: string;
  era: string;
  origin: Coordinates;
  boundingBox: BoundingBox;
  color: string;
  description: string;
  significance: string;
  pantheonSize: number;
  primaryLanguage: string;
  imageUrl: string;
  tags: string[];
}

// ── Myth / Story ──────────────────────────────────────────

export type MythType =
  | 'creation'
  | 'hero'
  | 'trickster'
  | 'love'
  | 'war'
  | 'afterlife'
  | 'nature'
  | 'cosmology'
  | 'transformation'
  | 'quest';

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

export type MythConnectionType =
  | 'diffusion'
  | 'convergent_evolution'
  | 'common_ancestor'
  | 'unknown';

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

export interface Myth {
  id: string;
  mythologyId: string;
  name: string;
  type: MythType;
  origin: Coordinates;
  characters: string[];
  summary: string;
  significance: string;
  themes: string[];
  parallels: Array<string | MythParallelEvidence>;
  era: string;
  imageUrl: string;
  sources: string[];
  tags: string[];
  dna: MythDNA;
  academicSources: AcademicSource[];
}

// ── Deity ─────────────────────────────────────────────────

export type DeityType =
  | 'god'
  | 'goddess'
  | 'demigod'
  | 'titan'
  | 'spirit'
  | 'trickster'
  | 'monster';

export interface Deity {
  id: string;
  mythologyId: string;
  name: string;
  alternateNames: string[];
  domain: string[];
  type: DeityType;
  origin: Coordinates;
  description: string;
  myths: string[];
  equivalents: string[];
  imageUrl: string;
  symbols: string[];
  era: string;
}

// ── Sacred Site ───────────────────────────────────────────

export type SacredSiteType =
  | 'temple'
  | 'oracle'
  | 'burial'
  | 'battlefield'
  | 'birthplace'
  | 'natural'
  | 'ruins';

export interface SacredSite {
  id: string;
  mythologyId: string;
  name: string;
  coordinates: Coordinates;
  type: SacredSiteType;
  description: string;
  myths: string[];
  deities: string[];
  imageUrl: string;
  stillExists: boolean;
  visitInfo?: string;
  archaeology?: {
    discoveryHistory: {
      firstDocumented: string;
      majorExcavations: Array<{
        year: string;
        led_by: string;
        institution: string;
        findings: string;
      }>;
      currentStatus:
        | 'active_excavation'
        | 'completed'
        | 'protected'
        | 'unexcavated'
        | 'inaccessible';
      protectionStatus:
        | 'UNESCO'
        | 'national_heritage'
        | 'local_protection'
        | 'unprotected'
        | 'disputed';
    };
    artifacts: Array<{
      id: string;
      name: string;
      type:
        | 'sculpture'
        | 'inscription'
        | 'vessel'
        | 'jewelry'
        | 'architecture'
        | 'text'
        | 'relief'
        | 'mosaic';
      period: string;
      currentLocation: string;
      description: string;
      mythologicalSignificance: string;
      imageUrl: string;
      museumUrl: string;
    }>;
    inscriptions: Array<{
      id: string;
      text: string;
      translation: string;
      language: string;
      period: string;
      significance: string;
      scholar: string;
    }>;
    architecture: {
      originalStructure: string;
      constructionPeriod: string;
      dimensions: string;
      materials: string[];
      constructionTechnique: string;
      modifications: Array<{ period: string; description: string }>;
      currentState: string;
    };
    museumConnections: Array<{
      museumName: string;
      city: string;
      country: string;
      collectionUrl: string;
      artifactCount: number;
      notableArtifacts: string[];
    }>;
    chronology: Array<{
      period: string;
      event: string;
      type:
        | 'construction'
        | 'destruction'
        | 'rediscovery'
        | 'excavation'
        | 'cultural_event'
        | 'conquest';
    }>;
  };
}

// ── Map Marker (UI helper) ────────────────────────────────

export interface MapMarker {
  id: string;
  coordinates: [number, number]; // [lng, lat] for MapLibre
  label: string;
  color: string;
  type: 'mythology' | 'myth' | 'deity' | 'site';
  parentId: string;
}

// ── Localized String (i18n helper) ────────────────────────

export interface LocalizedString {
  tr: string;
  en: string;
}

// ── UI-Level Types (used by pages/hooks) ─────────────────
// These bridge the raw JSON data into the shape existing pages expect.

export interface Culture {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  region: string;
  coordinates: [number, number]; // [lng, lat] for MapLibre
  period: string;
  color: string;
  image: string;
  mythCount: number;
}

export interface MythUI {
  id: string;
  cultureId: string;
  name: LocalizedString;
  description: LocalizedString;
  type: string;
  imageUrl: string;
  domains: string[];
  wikiSlug?: string;
}
