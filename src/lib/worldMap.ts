import world from '@/data/world-110m.json';

/**
 * İstatistik haritalarının dünya altlığı: ülke sınırları scripts/build-world-map.mjs ile önceden eşdikdörtgen
 * izdüşümde SVG yoluna çevrildi (src/data/world-110m.json). Çalışma zamanında coğrafya kütüphanesi yok.
 */
export interface WorldCountry {
  name: string;
  d: string;
}

export const WORLD_WIDTH: number = world.width;
export const WORLD_HEIGHT: number = world.height;
export const WORLD_COUNTRIES: WorldCountry[] = world.countries;

const { north: NORTH, south: SOUTH } = world.projection;

export function projectPoint(lng: number, lat: number): [number, number] {
  const clamped = Math.max(SOUTH, Math.min(NORTH, lat));
  return [((lng + 180) / 360) * WORLD_WIDTH, ((NORTH - clamped) / (NORTH - SOUTH)) * WORLD_HEIGHT];
}

// Veri setindeki ülke adları → Natural Earth adları. Eşleşen ad aynen kullanılır.
const ALIASES: Record<string, string> = {
  'united states': 'United States of America',
  usa: 'United States of America',
  'united states of america': 'United States of America',
  türkiye: 'Turkey',
  turkiye: 'Turkey',
  'czech republic': 'Czechia',
  'democratic republic of the congo': 'Dem. Rep. Congo',
  'bosnia and herzegovina': 'Bosnia and Herz.',
  'north macedonia': 'Macedonia',
  uk: 'United Kingdom',
  england: 'United Kingdom',
  scotland: 'United Kingdom',
  'south sudan': 'S. Sudan',
};

const BY_LOWER = new Map(WORLD_COUNTRIES.map((country) => [country.name.toLowerCase(), country.name]));

/** Veri setindeki ülke adını haritadaki ülkeye bağlar; bulunamazsa null. */
export function matchCountry(name: string): string | null {
  const key = name.trim().toLowerCase();
  return BY_LOWER.get(key) ?? ALIASES[key] ?? null;
}

let rings: { name: string; points: [number, number][] }[] | null = null;

function parsedRings() {
  if (rings) return rings;
  rings = WORLD_COUNTRIES.flatMap((country) =>
    country.d
      .split('Z')
      .filter(Boolean)
      .map((segment) => ({
        name: country.name,
        points: segment
          .replace('M', '')
          .split('L')
          .map((pair) => pair.split(' ').map(Number) as [number, number]),
      }))
  );
  return rings;
}

function inside([x, y]: [number, number], points: [number, number][]): boolean {
  let hit = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** Bir noktanın düştüğü bugünkü ülke (çift-tek kuralı; delikli ülkelerde iç halka dışarıyı sayar). */
export function countryAt(lng: number, lat: number): string | null {
  const point = projectPoint(lng, lat);
  const hits = new Map<string, number>();
  for (const ring of parsedRings()) {
    if (inside(point, ring.points)) hits.set(ring.name, (hits.get(ring.name) ?? 0) + 1);
  }
  for (const [name, count] of hits) if (count % 2 === 1) return name;
  return null;
}
