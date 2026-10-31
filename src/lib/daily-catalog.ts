import { getSimilarMyths } from '@/lib/insights';
import { deities, mythologies, mythologyById, myths } from '@/lib/myth-data';
import type { DailyCatalog } from '@/lib/daily';

/** Kartlar üç satır gösterir (line-clamp-3); fazlası yalnız dosyayı büyütür. */
function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

const LESSER_KNOWN_EXCLUDED = ['greek', 'egyptian', 'norse', 'hindu', 'mesopotamian'];

/** Derleme anında bütün günlük adaylar; sıralama veri dosyasıyla aynı, seçim `pickForDay`. */
export function buildDailyCatalog(): DailyCatalog {
  return {
    myths: myths.map((myth) => ({
      id: myth.id,
      name: myth.name,
      summary: myth.summary,
      imageUrl: myth.imageUrl,
      mythologyId: myth.mythologyId,
      mythologyName: mythologyById.get(myth.mythologyId)?.name ?? null,
      // Mini DNA çubuğu yalnız öğeleri ve arketipleri okur; tam DNA nesnesi dosyayı ~3 kat büyütüyordu.
      similar: getSimilarMyths(myth, 5).map(({ id, name, type, dna }) => ({
        id,
        name,
        type,
        dna: { elements: dna.elements, archetypes: dna.archetypes } as typeof dna,
      })),
    })),
    deities: deities.map((deity) => ({
      id: deity.id,
      name: deity.name,
      domain: deity.domain.slice(0, 4),
      description: clip(deity.description, 320),
      imageUrl: deity.imageUrl,
      mythologyName: mythologyById.get(deity.mythologyId)?.name ?? null,
    })),
    spotlights: mythologies
      .filter((item) => !LESSER_KNOWN_EXCLUDED.includes(item.id))
      .map(({ id, name, region, era, description, imageUrl }) => ({ id, name, region, era, description: clip(description, 320), imageUrl })),
  };
}
