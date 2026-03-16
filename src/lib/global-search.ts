import { deities, mythologies, myths, sacredSites } from '@/lib/myth-data';
import { getUniversalThemeDefinitions } from '@/lib/insights';
import { mythMatchesDNAFilters, parseDNAQueryFilters } from '@/lib/dna';

export type SearchCategory =
  | 'mythology'
  | 'myth'
  | 'deity'
  | 'site'
  | 'theme'
  | 'character';

export interface CategoryMeta {
  id: SearchCategory;
  label: string;
  icon: string;
}

export interface SearchEntry {
  id: string;
  category: SearchCategory;
  label: string;
  subtitle: string;
  href: string;
  scoreBoost: number;
  searchText: string;
}

export interface SearchResult extends SearchEntry {
  score: number;
}

export interface HighlightPart {
  text: string;
  matched: boolean;
}

const categoryMetaList: CategoryMeta[] = [
  { id: 'mythology', label: 'Mitolojiler', icon: '◇' },
  { id: 'myth', label: 'Mitler', icon: '✦' },
  { id: 'deity', label: 'Tanrilar', icon: '☼' },
  { id: 'site', label: 'Kutsal Mekanlar', icon: '⌂' },
  { id: 'theme', label: 'Temalar', icon: '◎' },
  { id: 'character', label: 'Karakterler', icon: '⚑' },
];

const categoryMetaById = new Map(categoryMetaList.map((item) => [item.id, item]));
const mythById = new Map(myths.map((item) => [item.id, item]));

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreByContains(query: string, haystack: string): number {
  if (!query || !haystack) return 0;
  const index = haystack.indexOf(query);
  if (index === -1) return 0;
  if (index === 0) return 140 - Math.min(query.length, 30);
  return 100 - Math.min(index, 90);
}

function scoreBySubsequence(query: string, haystack: string): number {
  if (!query || !haystack) return 0;
  let qIndex = 0;
  let score = 0;
  let streak = 0;
  let maxStreak = 0;
  let lastMatch = -1;

  for (let i = 0; i < haystack.length; i += 1) {
    if (haystack[i] !== query[qIndex]) continue;

    if (lastMatch === i - 1) {
      streak += 1;
    } else {
      streak = 1;
    }

    maxStreak = Math.max(maxStreak, streak);
    lastMatch = i;
    qIndex += 1;
    score += 3 + Math.max(0, 8 - i * 0.1);

    if (qIndex === query.length) break;
  }

  if (qIndex !== query.length) return 0;
  return score + maxStreak * 4;
}

function computeScore(query: string, entry: SearchEntry): number {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return 0;
  const haystack = normalize(entry.searchText);

  const fullMatch = scoreByContains(normalizedQuery, haystack);

  const tokenScore = normalizedQuery
    .split(' ')
    .filter(Boolean)
    .reduce((sum, token) => sum + scoreByContains(token, haystack), 0);

  const subsequence = scoreBySubsequence(normalizedQuery.replace(/\s/g, ''), haystack.replace(/\s/g, ''));

  return fullMatch + tokenScore * 0.45 + subsequence * 0.35 + entry.scoreBoost;
}

function buildEntries(): SearchEntry[] {
  const mythologyEntries = mythologies.map((item) => ({
    id: `mythology:${item.id}`,
    category: 'mythology' as const,
    label: item.name,
    subtitle: `${item.region} · ${item.era}`,
    href: `/mythology/${item.id}`,
    scoreBoost: 12,
    searchText: [item.name, item.region, item.culture, item.era, ...item.tags].join(' '),
  }));

  const mythEntries = myths.map((item) => {
    const mythology = mythologies.find((mythologyItem) => mythologyItem.id === item.mythologyId);
    return {
      id: `myth:${item.id}`,
      category: 'myth' as const,
      label: item.name,
      subtitle: mythology ? `${mythology.name} · ${item.type}` : item.type,
      href: `/map?focusKind=myth&focusId=${item.id}&lat=${item.origin.lat}&lng=${item.origin.lng}&mythologyId=${item.mythologyId}`,
      scoreBoost: 10,
      searchText: [
        item.name,
        item.type,
        item.summary,
        item.significance,
        ...item.themes,
        ...item.tags,
        ...item.characters,
        ...(item.dna?.elements || []),
        ...(item.dna?.archetypes || []),
        ...(item.dna?.structure || []),
        item.dna?.moralLesson || '',
        item.dna?.emotionalCore || '',
        item.dna?.cosmicScope || '',
        item.dna?.originTheory || '',
      ].join(' '),
    };
  });

  const deityEntries = deities.map((item) => {
    const mythology = mythologies.find((mythologyItem) => mythologyItem.id === item.mythologyId);
    return {
      id: `deity:${item.id}`,
      category: 'deity' as const,
      label: item.name,
      subtitle: mythology ? `${mythology.name} · ${item.type}` : item.type,
      href: `/map?focusKind=deity&focusId=${item.id}&lat=${item.origin.lat}&lng=${item.origin.lng}&mythologyId=${item.mythologyId}`,
      scoreBoost: 9,
      searchText: [
        item.name,
        item.type,
        item.description,
        ...item.alternateNames,
        ...item.domain,
        ...item.symbols,
      ].join(' '),
    };
  });

  const siteEntries = sacredSites.map((item) => {
    const mythology = mythologies.find((mythologyItem) => mythologyItem.id === item.mythologyId);
    return {
      id: `site:${item.id}`,
      category: 'site' as const,
      label: item.name,
      subtitle: mythology ? `${mythology.name} · ${item.type}` : item.type,
      href: `/map?focusKind=site&focusId=${item.id}&lat=${item.coordinates.lat}&lng=${item.coordinates.lng}&mythologyId=${item.mythologyId}`,
      scoreBoost: 9,
      searchText: [
        item.name,
        item.type,
        item.description,
        item.country || '',
        ...(item.tags || []),
      ].join(' '),
    };
  });

  const themeEntries = getUniversalThemeDefinitions().map((theme) => ({
    id: `theme:${theme.id}`,
    category: 'theme' as const,
    label: theme.name,
    subtitle: 'Tema gezgini',
    href: `/themes?theme=${theme.id}`,
    scoreBoost: 8,
    searchText: [theme.name, ...theme.terms, ...(theme.mythTypes || [])].join(' '),
  }));

  const characterIndex = new Map<
    string,
    {
      name: string;
      count: number;
      mythId: string;
      mythologyId: string;
      lat: number;
      lng: number;
    }
  >();

  for (const myth of myths) {
    for (const character of myth.characters || []) {
      const key = normalize(character);
      if (!key) continue;
      const existing = characterIndex.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        characterIndex.set(key, {
          name: character,
          count: 1,
          mythId: myth.id,
          mythologyId: myth.mythologyId,
          lat: myth.origin.lat,
          lng: myth.origin.lng,
        });
      }
    }
  }

  const characterEntries = Array.from(characterIndex.values())
    .filter((item) => item.count >= 2)
    .map((item) => ({
      id: `character:${normalize(item.name)}`,
      category: 'character' as const,
      label: item.name,
      subtitle: `${item.count} farkli mitte geciyor`,
      href: `/map?focusKind=myth&focusId=${item.mythId}&lat=${item.lat}&lng=${item.lng}&mythologyId=${item.mythologyId}`,
      scoreBoost: 7,
      searchText: `${item.name} character hero`,
    }));

  return [
    ...mythologyEntries,
    ...mythEntries,
    ...deityEntries,
    ...siteEntries,
    ...themeEntries,
    ...characterEntries,
  ];
}

const entries = buildEntries();

export const searchCategories = categoryMetaList;

export const popularSearches = ['Zeus', 'Tufan', 'Yaratilis', 'elements:flood archetypes:hero', 'Kahraman'];

export function runGlobalSearch(query: string, limit = 30): SearchResult[] {
  const dnaFilters = parseDNAQueryFilters(query);
  const normalized = normalize(dnaFilters.remainingQuery);
  const hasDNAFilters = dnaFilters.elements.length > 0 || dnaFilters.archetypes.length > 0;
  if (!normalized && !hasDNAFilters) return [];

  const dnaFilterBoost = (entry: SearchEntry): number => {
    if (!hasDNAFilters || entry.category !== 'myth') return 0;
    const mythId = entry.id.split(':')[1] || '';
    const myth = mythById.get(mythId);
    if (!myth || !mythMatchesDNAFilters(myth, dnaFilters)) return -1000;

    const elementMatches = dnaFilters.elements.filter((item) => myth.dna.elements.includes(item)).length;
    const archetypeMatches = dnaFilters.archetypes.filter((item) => myth.dna.archetypes.includes(item)).length;
    return 130 + elementMatches * 22 + archetypeMatches * 16;
  };

  const sourceEntries = entries.filter((entry) => {
    if (!hasDNAFilters) return true;
    if (entry.category === 'myth') {
      const mythId = entry.id.split(':')[1] || '';
      const myth = mythById.get(mythId);
      return Boolean(myth && mythMatchesDNAFilters(myth, dnaFilters));
    }
    return normalized.length > 0;
  });

  return sourceEntries
    .map((entry) => ({
      ...entry,
      score: (normalized ? computeScore(normalized, entry) : 0) + dnaFilterBoost(entry),
    }))
    .filter((result) => result.score > (hasDNAFilters ? 0 : 20))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function groupResultsByCategory(results: SearchResult[]): Array<{ category: CategoryMeta; items: SearchResult[] }> {
  return searchCategories
    .map((category) => ({
      category,
      items: results.filter((result) => result.category === category.id),
    }))
    .filter((group) => group.items.length > 0);
}

export function getEntryForQuery(query: string): SearchEntry | null {
  const results = runGlobalSearch(query, 1);
  if (results.length === 0) return null;
  const [top] = results;
  return {
    id: top.id,
    category: top.category,
    label: top.label,
    subtitle: top.subtitle,
    href: top.href,
    scoreBoost: top.scoreBoost,
    searchText: top.searchText,
  };
}

export function highlightParts(text: string, query: string): HighlightPart[] {
  if (!query.trim()) return [{ text, matched: false }];

  const lowerText = text.toLowerCase();
  const lowerQuery = query.trim().toLowerCase();
  const directIndex = lowerText.indexOf(lowerQuery);

  if (directIndex >= 0) {
    return [
      { text: text.slice(0, directIndex), matched: false },
      { text: text.slice(directIndex, directIndex + lowerQuery.length), matched: true },
      { text: text.slice(directIndex + lowerQuery.length), matched: false },
    ].filter((part) => part.text.length > 0);
  }

  const compactQuery = lowerQuery.replace(/\s+/g, '');
  const matchIndexes: number[] = [];
  let queryIndex = 0;

  for (let i = 0; i < lowerText.length; i += 1) {
    if (queryIndex >= compactQuery.length) break;
    if (lowerText[i] === compactQuery[queryIndex]) {
      matchIndexes.push(i);
      queryIndex += 1;
    }
  }

  if (queryIndex !== compactQuery.length) return [{ text, matched: false }];

  const indexSet = new Set(matchIndexes);
  const parts: HighlightPart[] = [];
  let buffer = '';
  let matched = false;

  for (let i = 0; i < text.length; i += 1) {
    const isMatch = indexSet.has(i);
    if (i === 0) matched = isMatch;

    if (isMatch !== matched) {
      parts.push({ text: buffer, matched });
      buffer = text[i];
      matched = isMatch;
    } else {
      buffer += text[i];
    }
  }

  if (buffer.length > 0) parts.push({ text: buffer, matched });
  return parts;
}

export function categoryMeta(category: SearchCategory): CategoryMeta {
  return categoryMetaById.get(category) ?? { id: category, label: category, icon: '•' };
}
