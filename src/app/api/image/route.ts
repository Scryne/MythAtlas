import { NextRequest, NextResponse } from 'next/server';
import {
  extractWikimediaImageRequest,
  isWikimediaCommonsImageUrl,
} from '@/lib/image-proxy';

export const runtime = 'nodejs';

const CACHE_CONTROL = 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800';
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const REQUEST_TIMEOUT_MS = 15000;
const MAX_ATTEMPTS = 3;
const MAX_CONCURRENT_UPSTREAM_FETCHES = 2;
const COMMONS_API_BASE = 'https://commons.wikimedia.org/w/api.php';
let activeUpstreamFetches = 0;
const pendingUpstreamFetches: Array<() => void> = [];
const COMMONS_TITLE_OVERRIDES: Record<string, string> = {
  'Odysseus_And_The_Sirens_by_H.J._Draper.jpg': 'Ulysses and the Sirens by H.J. Draper.jpg',
  'Battle_of_the_Doomed_Gods_by_Friedrich_Wilhelm_Heine.jpg':
    'The twilight of the gods by Willy Pogany.png',
  'Pantheon_Roma_2.jpg': 'Pantheon Rom 1 cropped.jpg',
  'Pergamonmuseum_Ischtar-Tor_01.jpg': 'Ishtar Gate - Pergamonmuseum - Berlin - Germany 2017.jpg',
  'Jerusalem_night_WLM14.jpg': 'Jerusalem Old City At Night (2113240539).jpg',
  'Attis_Museo_Nazionale_Romano.jpg': 'Attis-Athena Altemps Inv8585.jpg',
};

type MediaWikiImageInfo = {
  thumburl?: string;
  url?: string;
};

type MediaWikiPage = {
  title: string;
  missing?: string;
  imageinfo?: MediaWikiImageInfo[];
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withUpstreamSlot<T>(work: () => Promise<T>) {
  if (activeUpstreamFetches >= MAX_CONCURRENT_UPSTREAM_FETCHES) {
    await new Promise<void>((resolve) => pendingUpstreamFetches.push(resolve));
  }

  activeUpstreamFetches += 1;

  try {
    return await work();
  } finally {
    activeUpstreamFetches -= 1;
    const next = pendingUpstreamFetches.shift();
    if (next) next();
  }
}

async function fetchCommonsJson(params: URLSearchParams) {
  const response = await fetch(`${COMMONS_API_BASE}?${params.toString()}`, {
    next: { revalidate: 60 * 60 * 24 * 30 },
    headers: {
      Accept: 'application/json',
      'User-Agent': 'MythAtlasImageProxy/1.0 (+https://mythatlas.local)',
    },
  });

  if (!response.ok) {
    throw new Error(`Commons API request failed with status ${response.status}`);
  }

  return response.json();
}

async function fetchImageInfoUrl(title: string, width?: number) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'imageinfo',
    iiprop: 'url',
    titles: `File:${title}`,
  });

  if (width) {
    params.set('iiurlwidth', String(width));
  }

  const json = await fetchCommonsJson(params);
  const pages = Object.values((json.query?.pages ?? {}) as Record<string, MediaWikiPage>);
  const page = pages[0];

  if (!page || Object.prototype.hasOwnProperty.call(page, 'missing')) {
    return null;
  }

  const info = page.imageinfo?.[0];
  return info?.thumburl ?? info?.url ?? null;
}

async function resolveUpstreamUrl(src: string) {
  const request = extractWikimediaImageRequest(src);
  if (!request) return src;

  const overrideTitle = COMMONS_TITLE_OVERRIDES[request.filename];
  if (overrideTitle) {
    const overrideUrl = await fetchImageInfoUrl(overrideTitle, request.width);
    if (overrideUrl) return overrideUrl;
  }

  const directMatch = await fetchImageInfoUrl(request.filename, request.width);
  if (directMatch) return directMatch;

  // Arama ile "en yakın" görsel seçilmez: dosya yoksa istemci yer tutucuya düşer.
  return src;
}

async function fetchBinary(url: string) {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await withUpstreamSlot(() =>
        fetch(url, {
          signal: controller.signal,
          next: { revalidate: 60 * 60 * 24 * 30 },
          headers: {
            Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'User-Agent': 'MythAtlasImageProxy/1.0 (+https://mythatlas.local)',
            Referer: 'https://mythatlas.local/',
          },
        })
      );

      if (response.ok || !RETRYABLE_STATUSES.has(response.status) || attempt === MAX_ATTEMPTS) {
        return response;
      }
    } catch (error) {
      lastError = error;
      if (attempt === MAX_ATTEMPTS) {
        throw error;
      }
    } finally {
      clearTimeout(timeoutId);
    }

    await sleep(250 * attempt);
  }

  if (lastError) throw lastError;
  throw new Error('Image fetch failed without an upstream response.');
}

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get('src');

  if (!src) {
    return NextResponse.json({ error: 'missing_src' }, { status: 400 });
  }

  if (!isWikimediaCommonsImageUrl(src)) {
    return NextResponse.json({ error: 'unsupported_src' }, { status: 400 });
  }

  const candidates = Array.from(
    new Set([
      await resolveUpstreamUrl(src),
      src,
    ])
  );

  let upstream: Response | null = null;

  for (const candidate of candidates) {
    try {
      upstream = await fetchBinary(candidate);
    } catch {
      upstream = null;
    }

    if (upstream?.ok) break;
  }

  if (!upstream || !upstream.ok) {
    const status = upstream?.status === 404 ? 404 : 502;
    return NextResponse.json(
      { error: 'upstream_error', upstreamStatus: upstream?.status ?? null },
      { status }
    );
  }

  const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
  if (!contentType.startsWith('image/')) {
    return NextResponse.json({ error: 'invalid_content_type' }, { status: 502 });
  }

  const buffer = await upstream.arrayBuffer();
  const headers = new Headers({
    'Content-Type': contentType,
    'Cache-Control': CACHE_CONTROL,
  });

  const contentLength = upstream.headers.get('content-length');
  const etag = upstream.headers.get('etag');
  const lastModified = upstream.headers.get('last-modified');

  if (contentLength) headers.set('Content-Length', contentLength);
  if (etag) headers.set('ETag', etag);
  if (lastModified) headers.set('Last-Modified', lastModified);

  return new NextResponse(buffer, { status: 200, headers });
}
