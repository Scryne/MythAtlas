const WIKIMEDIA_HOSTNAME = 'upload.wikimedia.org';
const WIKIMEDIA_COMMONS_PATH = '/wikipedia/commons/';
const IMAGE_PROXY_PREFIX = '/api/image';

export interface WikimediaImageRequest {
  filename: string;
  width?: number;
}

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

export function isImageProxyUrl(value?: string | null): value is string {
  return Boolean(value && value.startsWith(`${IMAGE_PROXY_PREFIX}?`));
}

export function extractWikimediaImageRequest(value?: string | null): WikimediaImageRequest | null {
  if (!isWikimediaCommonsImageUrl(value)) return null;

  const url = parseUrl(value.trim());
  if (!url) return null;

  const parts = url.pathname.split('/').filter(Boolean);
  const lastSegment = parts[parts.length - 1];
  const filenameSegment = parts[parts.length - 2];
  if (!lastSegment || !filenameSegment) return null;

  const widthMatch = lastSegment.match(/^(\d+)px-/);

  return {
    filename: decodeURIComponent(filenameSegment),
    width: widthMatch ? Number(widthMatch[1]) : undefined,
  };
}

export function getDisplayImageSrc(value?: string | null, searchHint?: string): string | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('/')) return trimmed;
  if (isImageProxyUrl(trimmed)) return trimmed;
  if (isWikimediaCommonsImageUrl(trimmed)) {
    const params = new URLSearchParams({ src: trimmed });
    if (searchHint && searchHint.trim()) {
      params.set('label', searchHint.trim());
    }
    return `${IMAGE_PROXY_PREFIX}?${params.toString()}`;
  }

  return trimmed;
}
