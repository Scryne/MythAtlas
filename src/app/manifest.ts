import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MythAtlas',
    short_name: 'MythAtlas',
    description: 'Interactive mythology atlas with ancient civilizations, myths, deities, and sacred sites.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0d0a07',
    theme_color: '#c9a84c',
    lang: 'tr-TR',
    icons: [
      {
        src: '/icons/mythatlas-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
