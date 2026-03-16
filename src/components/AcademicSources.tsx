'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AcademicSource, AcademicSourceType } from '@/lib/myth-data';
import { SOURCE_HIGHLIGHT_EVENT } from '@/components/SourceHighlightButton';

type CitationStyle = 'APA' | 'Chicago';

interface AcademicSourcesProps {
  sources: AcademicSource[];
}

const TYPE_LABELS: Record<AcademicSourceType, string> = {
  primary: 'BIRINCIL',
  secondary: 'IKINCIL',
  archaeological: 'ARKEOLOJIK',
};

const TYPE_COLORS: Record<AcademicSourceType, string> = {
  primary: 'border-emerald-300/40 bg-emerald-500/10 text-emerald-100',
  secondary: 'border-sky-300/40 bg-sky-500/10 text-sky-100',
  archaeological: 'border-amber-300/40 bg-amber-500/10 text-amber-100',
};

function sortSources(items: AcademicSource[]): AcademicSource[] {
  const order: Record<AcademicSourceType, number> = {
    primary: 0,
    secondary: 1,
    archaeological: 2,
  };

  return [...items].sort(
    (left, right) =>
      order[left.type] - order[right.type] ||
      left.author.localeCompare(right.author) ||
      left.title.localeCompare(right.title)
  );
}

export default function AcademicSources({ sources }: AcademicSourcesProps) {
  const sortedSources = useMemo(() => sortSources(sources || []), [sources]);
  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<AcademicSourceType>('primary');
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [citationStyleById, setCitationStyleById] = useState<Record<string, CitationStyle>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const byType = useMemo(
    () => ({
      primary: sortedSources.filter((source) => source.type === 'primary'),
      secondary: sortedSources.filter((source) => source.type === 'secondary'),
      archaeological: sortedSources.filter((source) => source.type === 'archaeological'),
    }),
    [sortedSources]
  );

  const visible = byType[activeTab];

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ sourceIds?: string[] }>;
      const ids = custom.detail?.sourceIds || [];
      if (!ids.length) return;
      setHighlightedIds(ids);
      setOpen(true);
      const first = sortedSources.find((source) => ids.includes(source.id));
      if (first) setActiveTab(first.type);
    };

    window.addEventListener(SOURCE_HIGHLIGHT_EVENT, handler as EventListener);
    return () => window.removeEventListener(SOURCE_HIGHLIGHT_EVENT, handler as EventListener);
  }, [sortedSources]);

  return (
    <section id="academic-sources" className="ancient-card p-6">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={() => setOpen((value) => !value)}
      >
        <div className="flex items-center gap-3">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 text-gold"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H8v16H6.5A2.5 2.5 0 0 0 4 21" />
          </svg>
          <h3 className="text-xl text-gold">Akademik Kaynaklar</h3>
        </div>
        <span className="rounded-full border border-gold/30 bg-black/30 px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-gold-light">
          {open ? 'Gizle' : 'Goster'}
        </span>
      </button>

      {open && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {(['primary', 'secondary', 'archaeological'] as AcademicSourceType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setActiveTab(type)}
                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.12em] ${
                  activeTab === type
                    ? 'border-gold/55 bg-gold/15 text-gold-light'
                    : 'border-gold/25 bg-black/25 text-foreground/75'
                }`}
              >
                {type === 'primary'
                  ? 'Birincil Kaynaklar'
                  : type === 'secondary'
                    ? 'Ikincil Kaynaklar'
                    : 'Arkeolojik Kaynaklar'}{' '}
                <span className="ml-1 rounded-full bg-black/35 px-1.5 py-0.5 text-[10px]">
                  {byType[type].length}
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {visible.map((source) => {
              const citationStyle = citationStyleById[source.id] || 'APA';
              const citation =
                citationStyle === 'APA' ? source.citationAPA : source.citationChicago;
              const isHighlighted = highlightedIds.includes(source.id);

              return (
                <article
                  key={source.id}
                  className={`rounded-md border bg-black/20 p-4 transition ${
                    isHighlighted
                      ? 'border-gold/60 shadow-[0_0_20px_rgba(201,168,76,0.28)]'
                      : 'border-gold/20'
                  }`}
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${TYPE_COLORS[source.type]}`}
                    >
                      {TYPE_LABELS[source.type]}
                    </span>
                    {source.isOpenAccess && (
                      <span className="rounded-full border border-emerald-300/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-emerald-100">
                        Open access
                      </span>
                    )}
                  </div>

                  <h4 className="text-base text-gold-light">{source.title}</h4>
                  <p className="mt-1 text-xs text-foreground/65">
                    {source.author} | {source.year}
                  </p>
                  {source.estimatedDate && source.estimatedDate !== 'N/A' && (
                    <p className="mt-1 text-xs text-amber-100">Tahmini tarih: {source.estimatedDate}</p>
                  )}

                  <p className="mt-3 text-sm leading-6 text-foreground/80">{source.description}</p>

                  <blockquote className="mt-3 select-text rounded-md border border-gold/20 bg-[#f4e4c1]/10 p-3 text-sm italic text-foreground/80">
                    {source.relevantPassage}
                  </blockquote>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-gold/35 bg-black/35 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-gold-light"
                      >
                        Kaynaga git (dis baglanti)
                      </a>
                    )}

                    <select
                      className="rounded-full border border-gold/30 bg-black/35 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-foreground/80"
                      value={citationStyle}
                      onChange={(event) =>
                        setCitationStyleById((prev) => ({
                          ...prev,
                          [source.id]: event.target.value as CitationStyle,
                        }))
                      }
                    >
                      <option value="APA">APA</option>
                      <option value="Chicago">Chicago</option>
                    </select>

                    <button
                      type="button"
                      className="rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-gold-light"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(citation);
                          setCopiedId(source.id);
                          setToast(`${citationStyle} alintisi kopyalandi`);
                          window.setTimeout(() => setCopiedId(null), 1200);
                          window.setTimeout(() => setToast(null), 1200);
                        } catch {
                          setCopiedId(null);
                          setToast(null);
                        }
                      }}
                    >
                      Alinti kopyala
                    </button>

                    {copiedId === source.id && (
                      <span className="text-xs text-emerald-200">Kopyalandi</span>
                    )}
                  </div>
                </article>
              );
            })}

            {visible.length === 0 && (
              <p className="text-sm text-foreground/65">Bu kategoride kaynak bulunmuyor.</p>
            )}
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-md border border-emerald-300/45 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-100">
          {toast}
        </div>
      )}
    </section>
  );
}

