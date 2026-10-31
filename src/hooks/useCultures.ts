'use client';

import { useMemo } from 'react';
import type { Culture, Mythology } from '@/types/mythology';
import mythologiesData from '@/data/mythologies.json';

/**
 * Transforms raw Mythology data into the Culture shape expected by pages.
 * This bridges the comprehensive mythologies.json with the i18n UI format.
 */
function toCulture(m: Mythology): Culture {
  return {
    id: m.id,
    name: { en: m.name, tr: m.name }, // TODO: add Turkish translations
    description: { en: m.description, tr: m.description },
    region: m.region,
    coordinates: [m.origin.lng, m.origin.lat], // [lng, lat] for MapLibre
    period: m.era,
    color: m.color,
    image: m.imageUrl,
    mythCount: m.pantheonSize,
  };
}

const ALL_CULTURES = (mythologiesData as Mythology[]).map(toCulture);

// Veri derleme anında içe aktarılan JSON: senkron. Dönüş biçimi (data, loading, error) korunur.
export function useCultures() {
  return { data: ALL_CULTURES, loading: false, error: null as string | null };
}

export function useCulture(id: string) {
  const data = useMemo(() => ALL_CULTURES.find((m) => m.id === id) ?? null, [id]);
  return { data, loading: false, error: data ? null : 'Culture not found' };
}
