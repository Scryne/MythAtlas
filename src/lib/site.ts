// Sitenin herkese açık adresi ve yol yardımcıları. Site GitHub Pages'te bir proje sayfası olarak
// /MythAtlas altında yayınlanır: Next `basePath` Link, router ve derleme çıktısını kendisi önekler; elle
// yazılan yollar (fetch, service worker, manifest, yerel görsel) ve mutlak adresler buradan geçer.
// `new URL('/yol', SITE_URL)` kullanılmaz: kökten başlayan yol /MythAtlas önekini düşürür.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://scryne.github.io/MythAtlas').replace(/\/$/, '');

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** Kökten başlayan site içi yola basePath ekler (`/data/x.json` → `/MythAtlas/data/x.json`). */
export function withBasePath(path: string): string {
  return path.startsWith('/') && !path.startsWith('//') ? `${BASE_PATH}${path}` : path;
}

/** Site içi yolun herkese açık mutlak adresi (`/myth/x` → `https://…/MythAtlas/myth/x`). */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Derleme anında üretilen paylaşım kartı (`src/app/og/[entity]/[file]/route.tsx`). */
export function ogImageUrl(entity: 'site' | 'mythology' | 'myth' | 'deity', id: string): string {
  return absoluteUrl(`/og/${entity}/${id}.png`);
}
