import imageMap from '@/data/image-map.json';
import { withBasePath } from '@/lib/site';

const WIKIMEDIA_HOSTNAME = 'upload.wikimedia.org';
const WIKIMEDIA_COMMONS_PATH = '/wikipedia/commons/';

// Derlemeden önce çözülmüş Commons adresleri (`npm run images:resolve`, scripts/resolve-images.mjs).
// Site statik yayınlandığı için çalışma anında görsel proxy'si yok; tarayıcı görseli doğrudan Wikimedia'dan alır.
// Değer '' ise dosya Commons'ta yok: istek atılmaz, bileşen yer tutucusunu çizer.
const RESOLVED_IMAGES: Record<string, string> = imageMap;

function parseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function isWikimediaCommonsImageUrl(value?: string | null): value is string {
  if (!value) return false;
  const url = parseUrl(value.trim());
  if (!url) return false;

  return (
    url.protocol === 'https:' &&
    url.hostname === WIKIMEDIA_HOSTNAME &&
    url.pathname.startsWith(WIKIMEDIA_COMMONS_PATH)
  );
}

export function getDisplayImageSrc(value?: string | null, _searchHint?: string): string | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('/')) return withBasePath(trimmed);
  if (isWikimediaCommonsImageUrl(trimmed)) {
    const resolved = RESOLVED_IMAGES[trimmed];
    if (resolved === '') return undefined;
    return resolved ?? trimmed;
  }

  return trimmed;
}
