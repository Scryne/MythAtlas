'use client';

import { useMemo } from 'react';
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

const ALL_MYTHS = (mythsData as unknown as Myth[]).map(toMythUI);

// Veri derleme anında içe aktarılan JSON: senkron, ağ yok. Efekt + "yükleniyor" bir render boyunca boş
// liste gösteriyordu; şimdi ilk render'da hazır. Dönüş biçimi (data, loading, error) çağıranlar için korunur.
export function useMyths(cultureId?: string) {
  const data = useMemo(
    () => (cultureId ? ALL_MYTHS.filter((m) => m.cultureId === cultureId) : ALL_MYTHS),
    [cultureId]
  );
  return { data, loading: false, error: null as string | null };
}

export function useMyth(id: string) {
  const data = useMemo(() => ALL_MYTHS.find((m) => m.id === id) ?? null, [id]);
  return { data, loading: false, error: data ? null : 'Myth not found' };
}
