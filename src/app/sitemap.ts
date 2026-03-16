import type { MetadataRoute } from 'next';
import { deities, mythologies, myths, sacredSites } from '@/lib/myth-data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mythatlas.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/map',
    '/sites',
    '/archaeology',
    '/discover',
    '/dna',
    '/themes',
    '/family-tree',
    '/family-tree/deities',
    '/parallels',
    '/compare',
    '/stats',
    '/bibliography',
    '/scholars',
    '/methodology',
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'weekly' : 'daily',
    priority: path === '' ? 1 : 0.8,
  }));

  const mythologyRoutes = mythologies.map((item) => ({
    url: `${SITE_URL}/mythology/${item.id}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }));

  const mythRoutes = myths.map((item) => ({
    url: `${SITE_URL}/myth/${item.id}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.72,
  }));

  const deityRoutes = deities.map((item) => ({
    url: `${SITE_URL}/deity/${item.id}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const siteRoutes = sacredSites.map((item) => ({
    url: `${SITE_URL}/site/${item.id}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...mythologyRoutes, ...mythRoutes, ...deityRoutes, ...siteRoutes];
}
