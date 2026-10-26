import type { Metadata } from 'next';
import { absoluteUrl, ogImageUrl } from '@/lib/site';


interface BuildPageMetadataInput {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string;
}

export function buildPageMetadata({
  title,
  description,
  path,
  keywords = [],
  image = ogImageUrl('site', 'default'),
}: BuildPageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
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
