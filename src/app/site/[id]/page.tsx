import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AncientImage from '@/components/common/AncientImage';
import CitationGeneratorButton from '@/components/CitationGeneratorButton';
import { IncrementDiscoveryCounter } from '@/components/common/DiscoveryTracker';
import HoverPrefetchLink from '@/components/common/HoverPrefetchLink';
import SiteDetailTabs from '@/components/detail/SiteDetailTabs';
import BackButton from '@/components/ui/BackButton';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { LAST_UPDATED_LABEL } from '@/lib/academic-utils';
import {
  getDeity,
  getMyth,
  getSite,
  mythologyById,
  sacredSites,
  siteDeityIds,
  siteMythIds,
} from '@/lib/myth-data';
import { haversineKm, siteTypeLabel } from '@/lib/myth-utils';

interface SitePageProps {
  params: {
    id: string;
  };
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mythatlas.app';

const visitorNotes: Record<string, string> = {
  'mount-olympus': 'Ruzgar burada hala tanrilarin adlarini fisildiyor.',
  delphi: 'Taslarin sessizliginde kehanetlerin yankisi duyulur.',
  giza: 'Kumun altinda zaman degil, hafiza uyur.',
  stonehenge: 'Gok ile toprak burada ayni cemberde bulusur.',
};

function statusBadge(stillExists?: boolean): { label: string; className: string } {
  if (stillExists === false) {
    return {
      label: 'Tarihe karisti',
      className: 'border-red-400/30 bg-red-500/10 text-red-200',
    };
  }

  return {
    label: 'Hala mevcut',
    className: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  };
}

export function generateStaticParams() {
  return sacredSites.map((item) => ({ id: item.id }));
}

export function generateMetadata({ params }: SitePageProps): Metadata {
  const site = getSite(params.id);
  if (!site) {
    return {
      title: 'Sacred Site Not Found',
      description: 'This sacred site entry could not be found in MythAtlas.',
    };
  }

  const mythology = mythologyById.get(site.mythologyId);

  return {
    title: site.name,
    description: site.description,
    keywords: [site.name, siteTypeLabel(site.type), site.country || '', mythology?.name || '', 'sacred site', 'mythology', 'archaeology'].filter(Boolean),
    alternates: { canonical: `/site/${site.id}` },
    openGraph: {
      title: `${site.name} | MythAtlas`,
      description: site.description,
      images: [`/og/site/${site.id}`],
      type: 'article',
      url: `${SITE_URL}/site/${site.id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${site.name} | MythAtlas`,
      description: site.description,
      images: [`/og/site/${site.id}`],
    },
  };
}

export default function SacredSiteDetailPage({ params }: SitePageProps) {
  const site = getSite(params.id);
  if (!site) notFound();

  const mythology = mythologyById.get(site.mythologyId);
  const connectedMyths = siteMythIds(site)
    .map((id) => getMyth(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const connectedDeities = siteDeityIds(site)
    .map((id) => getDeity(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const sourceCount = connectedMyths.reduce(
    (acc, myth) => {
      (myth.academicSources || []).forEach((source) => {
        if (source.type === 'primary') acc.primary += 1;
        if (source.type === 'secondary') acc.secondary += 1;
      });
      return acc;
    },
    { primary: 0, secondary: 0 }
  );
  const primarySources = Array.from(
    new Map(
      connectedMyths
        .flatMap((myth) => (myth.academicSources || []).filter((source) => source.type === 'primary'))
        .map((source) => [source.id, source])
    ).values()
  );

  const nearbySites = sacredSites
    .filter((item) => item.id !== site.id)
    .map((item) => ({
      site: item,
      distanceKm: haversineKm(site.coordinates, item.coordinates),
    }))
    .filter((item) => item.distanceKm <= 1000)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 10);

  const sameMythologyTrail = nearbySites
    .filter((item) => item.site.mythologyId === site.mythologyId)
    .slice(0, 8);

  const historicalContext = [
    `${site.name} belongs to the ${mythology?.name || site.mythologyId} sphere and is dated to ${site.era || 'an uncertain period'}. It functioned as a ritual, narrative, or political anchor where mythic memory was materially staged.`,
    `${site.significance || 'Its significance in the dataset emphasizes continuity between sacred geography and cultural identity.'} The location reflects how stories, pilgrimage, and power were organized in space.`,
  ];

  const status = statusBadge(site.stillExists);
  const visitorNote = visitorNotes[site.id];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'MythAtlas',
        url: SITE_URL,
      },
      {
        '@type': 'Article',
        headline: site.name,
        description: site.description,
        image: site.imageUrl,
        url: `${SITE_URL}/site/${site.id}`,
      },
      {
        '@type': 'LandmarksOrHistoricalBuildings',
        name: site.name,
        geo: {
          '@type': 'GeoCoordinates',
          latitude: site.coordinates.lat,
          longitude: site.coordinates.lng,
        },
      },
    ],
  };

  return (
    <>
      <IncrementDiscoveryCounter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="hero-vignette relative min-h-[50vh] overflow-hidden">
        <AncientImage
          src={site.imageUrl}
          alt={site.name}
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/65 to-background" />
        <div className="relative z-10 section-container flex min-h-[50vh] flex-col justify-between pb-10 pt-20">
          <div className="flex flex-col gap-4 pt-4 md:flex-row md:items-center md:justify-between">
            <Breadcrumbs
              items={[
                { label: 'Ana Sayfa', href: '/' },
                { label: 'Kutsal Alanlar', href: '/sites' },
                { label: site.name },
              ]}
            />
            <BackButton />
          </div>
          <div className="mt-auto">
            <p className="meta-text mb-3 text-xs uppercase tracking-[0.2em]">Sacred Site Profile</p>
            <h1 className="text-4xl text-gold md:text-6xl">{site.name}</h1>
            <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-gold/35 bg-black/45 px-3 py-1 text-xs text-gold-light">
              {siteTypeLabel(site.type)}
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs ${status.className}`}>{status.label}</span>
            <span className="rounded-full border border-gold/35 bg-black/45 px-3 py-1 text-xs text-gold-light">
              {site.country || 'Unknown location'}
            </span>
            {mythology && (
              <HoverPrefetchLink
                href={`/mythology/${mythology.id}`}
                className="rounded-full border border-gold/35 bg-black/45 px-3 py-1 text-xs text-gold-light hover:bg-black/60"
              >
                {mythology.name}
              </HoverPrefetchLink>
            )}
            <CitationGeneratorButton
              entryTitle={site.name}
              entryKind="site"
              entryUrl={`${SITE_URL}/site/${site.id}`}
              primarySources={primarySources}
            />
            </div>
          </div>
        </div>
      </section>

      <SiteDetailTabs
        site={site}
        mythologyName={mythology?.name}
        historicalContext={historicalContext}
        visitorNote={visitorNote}
        connectedMyths={connectedMyths}
        connectedDeities={connectedDeities}
        nearbySites={nearbySites}
        sameMythologyTrail={sameMythologyTrail}
        sourceCount={sourceCount}
        lastUpdatedLabel={LAST_UPDATED_LABEL}
      />
    </>
  );
}
