'use client';

import { useState, useEffect } from 'react';
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

export function useCultures() {
  const [data, setData] = useState<Culture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const cultures = (mythologiesData as Mythology[]).map(toCulture);
      setData(cultures);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cultures');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error };
}

export function useCulture(id: string) {
  const [data, setData] = useState<Culture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const mythology = (mythologiesData as Mythology[]).find((m) => m.id === id);
      if (mythology) {
        setData(toCulture(mythology));
      } else {
        setData(null);
        setError('Culture not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load culture');
    } finally {
      setLoading(false);
    }
  }, [id]);

  return { data, loading, error };
}
