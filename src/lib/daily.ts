import type { MythData } from '@/lib/myth-data';

/**
 * Günlük seçimler (günün miti, günün tanrısı, haftanın öne çıkan mitolojisi).
 *
 * Site statik dışa aktarılır: sayfa derlendiği gün donar. Eskiden "Her gün yeni bir hikâye"
 * derleme gününün mitini sonraki derlemeye kadar gösteriyordu. Şimdi derleme bütün aday kümesini
 * `daily.json` olarak yazar; tarayıcı bugünün indeksini hesaplar ve farklıysa doğru günü gösterir.
 */

export interface DailyMythCard {
  id: string;
  name: string;
  summary: string;
  imageUrl: string;
  mythologyId: string;
  mythologyName: string | null;
  /** "Bu mitin benzerleri" şeridi; MythDNA mini çubuğu için dna alanı taşınır. */
  similar: Pick<MythData, 'id' | 'name' | 'type' | 'dna'>[];
}

export interface DailyDeityCard {
  id: string;
  name: string;
  domain: string[];
  description: string;
  imageUrl: string;
  mythologyName: string | null;
}

export interface DailySpotlightCard {
  id: string;
  name: string;
  region: string;
  era: string;
  description: string;
  imageUrl: string;
}

export interface DailyCatalog {
  myths: DailyMythCard[];
  deities: DailyDeityCard[];
  spotlights: DailySpotlightCard[];
}

export interface DailyPicks {
  dayIndex: number;
  myth: DailyMythCard;
  deity: DailyDeityCard;
  spotlight: DailySpotlightCard | null;
}

/** UTC gün sayısı: aynı gün her saat diliminde aynı seçimi verir. */
export function dayIndexOf(date: Date): number {
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000);
}

/** Seçim kuralı tek yerde (eski sayfadaki katsayılar korunur: mit 1, tanrı 7, öne çıkan 3). */
export function pickForDay(catalog: DailyCatalog, dayIndex: number): DailyPicks {
  const at = <T,>(list: T[], k: number) => list[Math.abs(dayIndex * k) % Math.max(1, list.length)];
  return {
    dayIndex,
    myth: at(catalog.myths, 1),
    deity: at(catalog.deities, 7),
    spotlight: catalog.spotlights.length ? at(catalog.spotlights, 3) : null,
  };
}
