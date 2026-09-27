import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import MythologyDetailClient, {
  type SimilarMythologyCardData,
} from '@/components/detail/MythologyDetailClient';
import {
  deities,
  getMythologyBundle,
  mythologies,
  myths,
  mythologyById,
  type MythologyBundle,
} from '@/lib/myth-data';
import { buildConceptComparison, findSimilarMythologies } from '@/lib/myth-utils';

interface MythologyPageProps {
  params: Promise<{
    id: string;
  }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mythatlas.app';

function buildSimilarCards(bundle: MythologyBundle): SimilarMythologyCardData[] {
  if (!bundle.completeness.hasComparableData) return [];

  const candidateIds = new Set<string>();
  bundle.safeParallels.mythologies.forEach((item) => candidateIds.add(item.id));
  bundle.safeInfluence.incoming.forEach((item) => {
    if (mythologyById.has(item.sourceId)) candidateIds.add(item.sourceId);
  });
  bundle.safeInfluence.outgoing.forEach((item) => {
    if (mythologyById.has(item.targetId)) candidateIds.add(item.targetId);
  });

  if (candidateIds.size === 0) return [];

  return findSimilarMythologies(
    bundle.mythology,
    mythologies,
    myths,
    deities,
    4,
    candidateIds
  ).map((item) => {
    const compareBundle = getMythologyBundle(item.mythology.id);
    if (!compareBundle) return null;
    return {
      id: item.mythology.id,
      name: item.mythology.name,
      region: item.mythology.region,
      era: item.mythology.era,
      color: item.mythology.color,
      imageUrl: item.mythology.imageUrl,
      distanceKm: item.distanceKm,
      sharedThemes: item.sharedThemes,
      sharedConcepts: item.sharedConcepts,
      comparison: buildConceptComparison(
        bundle.myths,
        bundle.deities,
        compareBundle.myths,
        compareBundle.deities
      ),
    };
  }).filter((item): item is SimilarMythologyCardData => Boolean(item));
}

export function generateStaticParams() {
  return mythologies.map((item) => ({ id: item.id }));
}

export async function generateMetadata(props: MythologyPageProps): Promise<Metadata> {
  const params = await props.params;
  const bundle = getMythologyBundle(params.id);
  if (!bundle) {
    return {
      title: 'Mythology Not Found',
      description: 'This mythology entry could not be found in MythAtlas.',
    };
  }
  const { mythology } = bundle;

  return {
    title: mythology.name,
    description: mythology.description,
    keywords: [
      mythology.name,
      mythology.region,
      mythology.primaryLanguage,
      'mythology',
      'pantheon',
      'sacred sites',
    ],
    alternates: {
      canonical: `/mythology/${mythology.id}`,
    },
    openGraph: {
      title: `${mythology.name} | MythAtlas`,
      description: mythology.significance,
      images: [`/og/mythology/${mythology.id}`],
      type: 'article',
      url: `${SITE_URL}/mythology/${mythology.id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${mythology.name} | MythAtlas`,
      description: mythology.significance,
      images: [`/og/mythology/${mythology.id}`],
    },
  };
}

export default async function MythologyDetailPage(props: MythologyPageProps) {
  const params = await props.params;
  const bundle = getMythologyBundle(params.id);
  if (!bundle) notFound();
  const { mythology } = bundle;
  const similarMythologies = buildSimilarCards(bundle);

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
        headline: mythology.name,
        description: mythology.description,
        image: mythology.imageUrl,
        url: `${SITE_URL}/mythology/${mythology.id}`,
        keywords: mythology.tags.join(', '),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MythologyDetailClient
        bundle={bundle}
        similarMythologies={similarMythologies}
      />
    </>
  );
}
