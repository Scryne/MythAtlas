import type { MythData } from '@/lib/myth-data';

export const DNA_ELEMENT_UNIVERSE = [
  'flood',
  'fire',
  'forbidden_fruit',
  'underworld',
  'divine_birth',
  'betrayal',
  'sacrifice',
  'resurrection',
  'transformation',
  'quest',
  'creation_from_chaos',
  'cosmic_battle',
  'trickery',
  'forbidden_knowledge',
  'descent',
  'ascent',
  'prophecy',
  'revenge',
  'love_tragedy',
  'monster_slaying',
] as const;

export const DNA_ARCHETYPE_UNIVERSE = [
  'hero',
  'shadow',
  'trickster',
  'wise_old_man',
  'great_mother',
  'anima',
  'animus',
  'self',
  'threshold_guardian',
  'herald',
  'shapeshifter',
  'ally',
] as const;

export const DNA_STRUCTURE_UNIVERSE = [
  'ordinary_world',
  'call_to_adventure',
  'refusal',
  'mentor',
  'crossing_threshold',
  'tests',
  'ordeal',
  'reward',
  'road_back',
  'resurrection',
  'return',
] as const;

export type DNAElement = (typeof DNA_ELEMENT_UNIVERSE)[number];
export type DNAArchetype = (typeof DNA_ARCHETYPE_UNIVERSE)[number];
export type DNAStructureBeat = (typeof DNA_STRUCTURE_UNIVERSE)[number];

export interface MythMatch {
  myth: MythData;
  score: number;
  sharedElements: DNAElement[];
  sharedArchetypes: DNAArchetype[];
}

export interface DNAQueryFilters {
  elements: DNAElement[];
  archetypes: DNAArchetype[];
  remainingQuery: string;
}

export const ORIGIN_THEORY_EXPLANATIONS: Record<string, string> = {
  diffusion: 'Anlatinin kulturel temaslar, ticaret ve goc yoluyla yayildigi gorusu.',
  convergent: 'Benzer insan deneyimlerinden bagimsiz olarak tekrar tekrar ortaya cikmis olabilir.',
  universal: 'Insan zihninin ortak mitik kaliplari nedeniyle kulturler arasi yaygin bir cekirdek tasir.',
  unknown: 'Mevcut kaynaklar yayilim mekanizmasini acik sekilde gostermiyor.',
};

const FINGERPRINT_FILLED = '1';
const FINGERPRINT_EMPTY = '0';

function normalizeToken(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_\-]/g, '_')
    .replace(/-+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function toOrderedShared<T extends string>(left: readonly string[], right: readonly string[], order: readonly T[]): T[] {
  const rightSet = new Set(right);
  return order.filter((item) => left.includes(item) && rightSet.has(item));
}

function dnaList(myth: MythData, key: 'elements' | 'archetypes' | 'structure'): string[] {
  return myth.dna?.[key] || [];
}

export function calculateDNASimilarity(myth1: MythData, myth2: MythData): number {
  if (myth1.id === myth2.id) return 100;

  const elements1 = Array.from(new Set(dnaList(myth1, 'elements')));
  const elements2 = Array.from(new Set(dnaList(myth2, 'elements')));
  const archetypes1 = Array.from(new Set(dnaList(myth1, 'archetypes')));
  const archetypes2 = Array.from(new Set(dnaList(myth2, 'archetypes')));
  const structure1 = Array.from(new Set(dnaList(myth1, 'structure')));
  const structure2 = Array.from(new Set(dnaList(myth2, 'structure')));

  // Guardrail: DNA matching should gracefully handle incomplete records.
  if (elements1.length === 0 || elements2.length === 0) return 0;

  const sharedElements = elements1.filter((item) => elements2.includes(item)).length;
  const sharedArchetypes = archetypes1.filter((item) => archetypes2.includes(item)).length;
  const sharedStructure = structure1.filter((item) => structure2.includes(item)).length;

  const elementsDenominator = Math.max(1, Math.min(elements1.length, elements2.length));
  const archetypesDenominator = Math.max(1, Math.min(archetypes1.length || 1, archetypes2.length || 1));
  const structureDenominator = Math.max(1, Math.min(structure1.length || 1, structure2.length || 1));

  const elementScore = (sharedElements / elementsDenominator) * 35;
  const archetypeScore = (sharedArchetypes / archetypesDenominator) * 30;
  const structureScore = (sharedStructure / structureDenominator) * 25;
  const emotionalScore =
    myth1.dna?.emotionalCore && myth1.dna.emotionalCore === myth2.dna?.emotionalCore ? 10 : 0;
  const scopeScore =
    myth1.dna?.cosmicScope && myth1.dna.cosmicScope === myth2.dna?.cosmicScope ? 5 : 0;

  const rawScore = elementScore + archetypeScore + structureScore + emotionalScore + scopeScore;
  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

export function getMythsByDNA(mythId: string, allMyths: MythData[], topN: number): MythMatch[] {
  const target = allMyths.find((myth) => myth.id === mythId);
  if (!target) return [];

  return allMyths
    .filter((candidate) => candidate.id !== target.id && candidate.mythologyId !== target.mythologyId)
    .map((candidate) => ({
      myth: candidate,
      score: calculateDNASimilarity(target, candidate),
      sharedElements: toOrderedShared(
        dnaList(target, 'elements'),
        dnaList(candidate, 'elements'),
        DNA_ELEMENT_UNIVERSE
      ),
      sharedArchetypes: toOrderedShared(
        dnaList(target, 'archetypes'),
        dnaList(candidate, 'archetypes'),
        DNA_ARCHETYPE_UNIVERSE
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

export function getDNAFingerprint(myth: MythData): string {
  const elements = new Set(dnaList(myth, 'elements'));
  return DNA_ELEMENT_UNIVERSE.map((element) => (elements.has(element) ? FINGERPRINT_FILLED : FINGERPRINT_EMPTY)).join('');
}

export function formatDNAKeyLabel(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join(' ');
}

export function parseDNAQueryFilters(query: string): DNAQueryFilters {
  const allowedElements = new Set<string>(DNA_ELEMENT_UNIVERSE);
  const allowedArchetypes = new Set<string>(DNA_ARCHETYPE_UNIVERSE);
  const elements = new Set<DNAElement>();
  const archetypes = new Set<DNAArchetype>();

  const tokens = query.trim().split(/\s+/).filter(Boolean);
  const retainedTokens: string[] = [];

  for (const token of tokens) {
    const match = token.match(/^(elements?|archetypes?):(.+)$/i);
    if (!match) {
      retainedTokens.push(token);
      continue;
    }

    const [, rawKey, rawValue] = match;
    const values = rawValue
      .split(/[,+|]/)
      .map((item) => normalizeToken(item))
      .filter(Boolean);

    if (rawKey.toLowerCase().startsWith('element')) {
      values.forEach((value) => {
        if (allowedElements.has(value)) elements.add(value as DNAElement);
      });
      continue;
    }

    values.forEach((value) => {
      if (allowedArchetypes.has(value)) archetypes.add(value as DNAArchetype);
    });
  }

  return {
    elements: Array.from(elements),
    archetypes: Array.from(archetypes),
    remainingQuery: retainedTokens.join(' ').trim(),
  };
}

export function mythMatchesDNAFilters(
  myth: Pick<MythData, 'dna'>,
  filters: Pick<DNAQueryFilters, 'elements' | 'archetypes'>
): boolean {
  if (!myth.dna) return false;

  if (filters.elements.length) {
    const mythElements = new Set(myth.dna.elements || []);
    for (const element of filters.elements) {
      if (!mythElements.has(element)) return false;
    }
  }

  if (filters.archetypes.length) {
    const mythArchetypes = new Set(myth.dna.archetypes || []);
    for (const archetype of filters.archetypes) {
      if (!mythArchetypes.has(archetype)) return false;
    }
  }

  return true;
}

