'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AcademicSource } from '@/lib/myth-data';

interface CitationGeneratorButtonProps {
  entryTitle: string;
  entryKind: 'myth' | 'deity' | 'site';
  entryUrl: string;
  primarySources: AcademicSource[];
}

function formatToday(): string {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function CitationGeneratorButton({
  entryTitle,
  entryKind,
  entryUrl,
  primarySources,
}: CitationGeneratorButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<'apa' | 'chicago' | null>(null);

  const citations = useMemo(() => {
    const accessDate = formatToday();
    const year = new Date().getFullYear();
    const apa = `MythAtlas. (${year}). ${entryTitle} [${entryKind} entry]. ${entryUrl}`;
    const chicago = `MythAtlas. "${entryTitle}." Accessed ${accessDate}. ${entryUrl}.`;
    return { apa, chicago };
  }, [entryKind, entryTitle, entryUrl]);

  const copy = async (kind: 'apa' | 'chicago') => {
    try {
      await navigator.clipboard.writeText(kind === 'apa' ? citations.apa : citations.chicago);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1200);
    } catch {
      setCopied(null);
    }
  };

  useEffect(() => {
    if (!open) return;
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-gold/35 bg-black/45 px-3 py-1 text-xs uppercase tracking-[0.12em] text-gold-light"
      >
        Bu sayfayi alintila
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-0 sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="ancient-card h-full w-full overflow-y-auto rounded-none p-5 sm:h-auto sm:max-w-2xl sm:rounded-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-xl text-gold">Atif Olusturucu</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-gold/30 px-2 py-1 text-xs text-gold-light"
              >
                Kapat
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-md border border-gold/20 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-gold/80">APA</p>
                <p className="mt-2 text-sm text-foreground/80">{citations.apa}</p>
                <button
                  type="button"
                  onClick={() => copy('apa')}
                  className="mt-3 rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-gold-light"
                >
                  Kopyala
                </button>
                {copied === 'apa' && <span className="ml-2 text-xs text-emerald-200">Kopyalandi</span>}
              </div>

              <div className="rounded-md border border-gold/20 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-gold/80">Chicago</p>
                <p className="mt-2 text-sm text-foreground/80">{citations.chicago}</p>
                <button
                  type="button"
                  onClick={() => copy('chicago')}
                  className="mt-3 rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-gold-light"
                >
                  Kopyala
                </button>
                {copied === 'chicago' && (
                  <span className="ml-2 text-xs text-emerald-200">Kopyalandi</span>
                )}
              </div>
            </div>

            <p className="mt-4 rounded-md border border-amber-300/30 bg-amber-500/10 p-3 text-sm text-amber-100">
              Bu platform ikincil kaynak olarak kullanilabilir. Dogrudan akademik calismalar icin
              birincil kaynaklara basvurunuz.
            </p>

            <div className="mt-4 rounded-md border border-gold/20 bg-black/20 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-gold/80">
                Bu kayit icin one cikan birincil kaynaklar
              </p>
              <ul className="mt-2 space-y-1 text-sm text-foreground/80">
                {primarySources.slice(0, 8).map((source) => (
                  <li key={source.id}>
                    {source.author} ({source.year}) | {source.title}
                  </li>
                ))}
                {primarySources.length === 0 && (
                  <li>Birincil kaynak listesi bu kayitta henuz tanimlanmadi.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

