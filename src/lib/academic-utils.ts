import {
  deities,
  getParallelMythId,
  isParallelEvidence,
  myths,
  mythologies,
  mythologyById,
  sacredSites,
  siteMythIds,
  type MythParallelEvidence,
  type AcademicSource,
  type AcademicSourceType,
  type MythData,
} from '@/lib/myth-data';

export const LAST_UPDATED_LABEL = '12 Mart 2026';

export interface BibliographyEntry extends AcademicSource {
  mythIds: string[];
  mythNames: string[];
  deityIds: string[];
  deityNames: string[];
  siteIds: string[];
  siteNames: string[];
  mythologyIds: string[];
  mythologyNames: string[];
  referenceCount: number;
}

export function mythSourceCounts(myth: MythData): Record<AcademicSourceType, number> {
  const counters: Record<AcademicSourceType, number> = {
    primary: 0,
    secondary: 0,
    archaeological: 0,
  };
  (myth.academicSources || []).forEach((source) => {
    counters[source.type] += 1;
  });
  return counters;
}

export function mythPrimarySources(myth: MythData): AcademicSource[] {
  return (myth.academicSources || []).filter((source) => source.type === 'primary');
}

export function mythParallelEntries(
  myth: MythData
): Array<{ myth: MythData; evidence: MythParallelEvidence | null }> {
  return (myth.parallels || [])
    .map((reference) => {
      const mythId = getParallelMythId(reference);
      const linked = myths.find((item) => item.id === mythId);
      if (!linked) return null;
      return {
        myth: linked,
        evidence: isParallelEvidence(reference) ? reference : null,
      };
    })
    .filter((item): item is { myth: MythData; evidence: MythParallelEvidence | null } =>
      Boolean(item)
    );
}

export function aggregatePrimarySourcesFromMythIds(mythIds: string[]): AcademicSource[] {
  const seen = new Set<string>();
  const sources: AcademicSource[] = [];
  mythIds.forEach((id) => {
    const myth = myths.find((item) => item.id === id);
    if (!myth) return;
    (myth.academicSources || [])
      .filter((source) => source.type === 'primary')
      .forEach((source) => {
        if (seen.has(source.id)) return;
        seen.add(source.id);
        sources.push(source);
      });
  });
  return sources;
}

export function buildBibliographyEntries(): BibliographyEntry[] {
  const entryById = new Map<string, BibliographyEntry>();
  const mythToDeities = new Map<string, Array<{ id: string; name: string }>>();
  const mythToSites = new Map<string, Array<{ id: string; name: string }>>();

  deities.forEach((deity) => {
    (deity.myths || []).forEach((mythId) => {
      if (!mythToDeities.has(mythId)) mythToDeities.set(mythId, []);
      mythToDeities.get(mythId)?.push({ id: deity.id, name: deity.name });
    });
  });

  sacredSites.forEach((site) => {
    siteMythIds(site).forEach((mythId) => {
      if (!mythToSites.has(mythId)) mythToSites.set(mythId, []);
      mythToSites.get(mythId)?.push({ id: site.id, name: site.name });
    });
  });

  myths.forEach((myth) => {
    const mythology = mythologyById.get(myth.mythologyId);
    (myth.academicSources || []).forEach((source) => {
      const existing = entryById.get(source.id);
      if (!existing) {
        entryById.set(source.id, {
          ...source,
          mythIds: [myth.id],
          mythNames: [myth.name],
          deityIds: [],
          deityNames: [],
          siteIds: [],
          siteNames: [],
          mythologyIds: [myth.mythologyId],
          mythologyNames: [mythology?.name || myth.mythologyId],
          referenceCount: 1,
        });
        return;
      }

      existing.referenceCount += 1;
      if (!existing.mythIds.includes(myth.id)) existing.mythIds.push(myth.id);
      if (!existing.mythNames.includes(myth.name)) existing.mythNames.push(myth.name);
      if (!existing.mythologyIds.includes(myth.mythologyId)) existing.mythologyIds.push(myth.mythologyId);
      const mythologyName = mythology?.name || myth.mythologyId;
      if (!existing.mythologyNames.includes(mythologyName)) existing.mythologyNames.push(mythologyName);
    });
  });

  entryById.forEach((entry) => {
    entry.mythIds.forEach((mythId) => {
      (mythToDeities.get(mythId) || []).forEach((deity) => {
        if (!entry.deityIds.includes(deity.id)) entry.deityIds.push(deity.id);
        if (!entry.deityNames.includes(deity.name)) entry.deityNames.push(deity.name);
      });

      (mythToSites.get(mythId) || []).forEach((site) => {
        if (!entry.siteIds.includes(site.id)) entry.siteIds.push(site.id);
        if (!entry.siteNames.includes(site.name)) entry.siteNames.push(site.name);
      });
    });
  });

  const typeOrder: Record<AcademicSourceType, number> = {
    primary: 0,
    secondary: 1,
    archaeological: 2,
  };

  return Array.from(entryById.values()).sort(
    (left, right) =>
      typeOrder[left.type] - typeOrder[right.type] ||
      right.referenceCount - left.referenceCount ||
      left.author.localeCompare(right.author) ||
      left.title.localeCompare(right.title)
  );
}

export function mythologyNameById(id: string): string {
  return mythologyById.get(id)?.name || id;
}

export const mythologyOptions = mythologies.map((mythology) => ({
  id: mythology.id,
  name: mythology.name,
}));
