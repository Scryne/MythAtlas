import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mythatlas.app';

interface BuildPageMetadataInput {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string;
}

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

export function buildPageMetadata({
  title,
  description,
  path,
  keywords = [],
  image = '/og/site/default',
}: BuildPageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: `${title} | MythAtlas`,
      description,
      url,
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${title} - MythAtlas`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | MythAtlas`,
      description,
      images: [imageUrl],
    },
  };
}
