'use client';

import { useState, useEffect } from 'react';
import type { MythUI, Myth } from '@/types/mythology';
import mythsData from '@/data/myths.json';

/**
 * Transforms raw Myth data into the MythUI shape expected by pages.
 * Bridges the comprehensive myths.json with the i18n UI format.
 */
function toMythUI(m: Myth): MythUI {
  return {
    id: m.id,
    cultureId: m.mythologyId,
    name: { en: m.name, tr: m.name }, // TODO: add Turkish translations
    description: { en: m.summary, tr: m.summary },
    type: m.type,
    imageUrl: m.imageUrl,
    domains: m.themes || [],
  };
}

export function useMyths(cultureId?: string) {
  const [data, setData] = useState<MythUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      let myths = (mythsData as unknown as Myth[]).map(toMythUI);
      if (cultureId) {
        myths = myths.filter((m) => m.cultureId === cultureId);
      }
      setData(myths);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load myths');
    } finally {
      setLoading(false);
    }
  }, [cultureId]);

  return { data, loading, error };
}

export function useMyth(id: string) {
  const [data, setData] = useState<MythUI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const myth = (mythsData as unknown as Myth[]).find((m) => m.id === id);
      if (myth) {
        setData(toMythUI(myth));
      } else {
        setData(null);
        setError('Myth not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load myth');
    } finally {
      setLoading(false);
    }
  }, [id]);

  return { data, loading, error };
}
