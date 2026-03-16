import { deities, mythologies, myths, sacredSites } from '@/lib/myth-data';

type RecentlyAddedKind = 'myth' | 'deity' | 'site' | 'mythology';

interface SupabaseRow {
  id: string;
  name: string;
  created_at?: string;
  createdAt?: string;
}

export interface RecentlyAddedItem {
  id: string;
  name: string;
  kind: RecentlyAddedKind;
  href: string;
  createdAt: string;
}

export interface RecentlyAddedResult {
  source: 'supabase' | 'local';
  items: RecentlyAddedItem[];
  warning?: string;
}

interface TableConfig {
  kind: RecentlyAddedKind;
  candidates: string[];
  href: (id: string) => string;
}

const TABLE_CONFIGS: TableConfig[] = [
  { kind: 'myth', candidates: ['myths'], href: (id) => `/myth/${id}` },
  { kind: 'deity', candidates: ['deities'], href: (id) => `/deity/${id}` },
  { kind: 'site', candidates: ['sacred_sites', 'sacred-sites', 'sites'], href: (id) => `/site/${id}` },
  { kind: 'mythology', candidates: ['mythologies'], href: (id) => `/mythology/${id}` },
];

function toIsoDateFallback(daysAgo: number): string {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return date.toISOString();
}

function buildLocalFallback(limit: number): RecentlyAddedItem[] {
  const combined: RecentlyAddedItem[] = [
    ...myths.map((item, index) => ({
      id: item.id,
      name: item.name,
      kind: 'myth' as const,
      href: `/myth/${item.id}`,
      createdAt: toIsoDateFallback(myths.length - index),
    })),
    ...deities.map((item, index) => ({
      id: item.id,
      name: item.name,
      kind: 'deity' as const,
      href: `/deity/${item.id}`,
      createdAt: toIsoDateFallback(deities.length - index + 20),
    })),
    ...sacredSites.map((item, index) => ({
      id: item.id,
      name: item.name,
      kind: 'site' as const,
      href: `/site/${item.id}`,
      createdAt: toIsoDateFallback(sacredSites.length - index + 40),
    })),
    ...mythologies.map((item, index) => ({
      id: item.id,
      name: item.name,
      kind: 'mythology' as const,
      href: `/mythology/${item.id}`,
      createdAt: toIsoDateFallback(mythologies.length - index + 60),
    })),
  ];

  return combined
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

async function fetchTableRows(
  baseUrl: string,
  apikey: string,
  config: TableConfig,
  limit: number
): Promise<RecentlyAddedItem[]> {
  for (const table of config.candidates) {
    const query = new URLSearchParams({
      select: 'id,name,created_at',
      order: 'created_at.desc',
      limit: String(limit),
    });

    const response = await fetch(`${baseUrl}/rest/v1/${table}?${query.toString()}`, {
      headers: {
        apikey,
        Authorization: `Bearer ${apikey}`,
      },
      next: {
        revalidate: 1800,
      },
    });

    if (!response.ok) continue;

    const json = (await response.json()) as SupabaseRow[];
    return json
      .map((row) => ({
        id: String(row.id),
        name: String(row.name),
        kind: config.kind,
        href: config.href(String(row.id)),
        createdAt: String(row.created_at || row.createdAt || ''),
      }))
      .filter((row) => row.createdAt.length > 0);
  }

  return [];
}

export async function getRecentlyAdded(limit = 10): Promise<RecentlyAddedResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      source: 'local',
      items: buildLocalFallback(limit),
      warning: 'Supabase env bulunamadi; local fallback gosteriliyor.',
    };
  }

  try {
    const tableRows = await Promise.all(
      TABLE_CONFIGS.map((config) => fetchTableRows(supabaseUrl, supabaseKey, config, limit))
    );

    const combined = tableRows
      .flat()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    if (combined.length > 0) {
      return {
        source: 'supabase',
        items: combined,
      };
    }

    return {
      source: 'local',
      items: buildLocalFallback(limit),
      warning: 'Supabase sorgusu bos dondu; local fallback gosteriliyor.',
    };
  } catch {
    return {
      source: 'local',
      items: buildLocalFallback(limit),
      warning: 'Supabase baglantisi kurulamadigi icin local fallback gosteriliyor.',
    };
  }
}

