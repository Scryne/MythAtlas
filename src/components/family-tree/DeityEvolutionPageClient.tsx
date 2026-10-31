'use client';

import { useMemo, useState } from 'react';
import AncientImage from '@/components/common/AncientImage';
import HoverPrefetchLink from '@/components/common/HoverPrefetchLink';
import {
  deityEvolutionLineages,
  getDeityName,
  getDeityRecord,
  getMythologyName,
  getMythologyNode,
  type DeityEvolutionLineage,
  type DeityEvolutionStep,
} from '@/lib/family-tree-data';

interface SelectedStep {
  lineageId: string;
  index: number;
}

const FEATURED_LINEAGE_IDS = [
  'lineage-love-goddess',
  'lineage-sky-god',
  'lineage-death-rebirth',
  'lineage-wisdom',
];

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function stepImage(step: DeityEvolutionStep): string | undefined {
  const deity = getDeityRecord(step.deityId);
  if (deity?.imageUrl) return deity.imageUrl;
  const mythologyNode = getMythologyNode(step.mythologyId);
  if (mythologyNode?.imageUrl) return mythologyNode.imageUrl;
  // Görsel yoksa AncientImage kendi yer tutucusunu çizer (eski Commons yedeği yoktu, 404 → 502 dönüyordu)
  return undefined;
}

/** Aranan tanrının ilk göründüğü soy zinciri ve adım (React derleyicisi döngüden erken dönüşü useMemo içinde koruyamıyordu). */
function findLineageStep(search: string) {
  const term = normalize(search);
  if (term.length < 2) return null;

  for (const lineage of deityEvolutionLineages) {
    for (let index = 0; index < lineage.chain.length; index += 1) {
      const step = lineage.chain[index];
      if (normalize(getDeityName(step.deityId)).includes(term)) {
        return { lineage, index };
      }
    }
  }

  return null;
}

export default function DeityEvolutionPageClient() {
  const [search, setSearch] = useState('');
  const [selectedStep, setSelectedStep] = useState<SelectedStep | null>(null);
  const [hoveredTransition, setHoveredTransition] = useState<{ lineageId: string; index: number } | null>(
    null
  );

  const searchMatch = useMemo(() => findLineageStep(search), [search]);

  const featured = useMemo(
    () => deityEvolutionLineages.filter((lineage) => FEATURED_LINEAGE_IDS.includes(lineage.id)),
    []
  );

  const nonFeatured = useMemo(
    () => deityEvolutionLineages.filter((lineage) => !FEATURED_LINEAGE_IDS.includes(lineage.id)),
    []
  );

  const visibleLineages = useMemo(() => {
    if (normalize(search).length < 2) return [...featured, ...nonFeatured];
    return searchMatch ? [searchMatch.lineage] : [];
  }, [featured, nonFeatured, search, searchMatch]);

  const activeStepData = useMemo(() => {
    if (!selectedStep) return null;
    const lineage = deityEvolutionLineages.find((item) => item.id === selectedStep.lineageId);
    if (!lineage) return null;
    const step = lineage.chain[selectedStep.index];
    if (!step) return null;
    const deity = getDeityRecord(step.deityId);
    return { lineage, step, deity };
  }, [selectedStep]);

  return (
    <div className="min-h-screen bg-void px-4 pb-14 pt-24 text-parchment sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-2xl border border-gold/25 bg-[radial-gradient(circle_at_18%_20%,rgba(201,168,76,0.16),rgba(7,7,7,0.94)_55%)] p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-parchment-dim">Kültürler arası dönüşüm</p>
          <h1 className="mt-3 font-heading text-3xl text-gold-pale sm:text-4xl">Tanrı Evrim Zincirleri</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-parchment-dim">
            Zincirler, tanrı figürlerinin farklı mitolojik sistemlerde nasıl yeniden yorumlandığını gösterir.
            Okların üstüne gelerek hangi özelliklerin değiştiğini görebilirsin.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <HoverPrefetchLink href="/family-tree" className="rounded-full border border-gold/35 px-4 py-2 text-xs text-gold-pale">
              Aile ağacı grafiğine dön
            </HoverPrefetchLink>
            <HoverPrefetchLink href="/compare" className="rounded-full border border-rel-cyan/35 px-4 py-2 text-xs text-rel-cyan-light">
              Karşılaştırma aracı
            </HoverPrefetchLink>
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-gold/20 bg-background/85 p-4">
          <label className="text-xs uppercase tracking-[0.16em] text-parchment-muted">Tanrı soyunda ara</label>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Örnek: Ishtar, Zeus, Enki..."
            className="mt-2 w-full rounded-md border border-gold/25 bg-surface px-3 py-2 text-sm text-gold-pale outline-none focus:border-gold-light"
          />
          {normalize(search).length >= 2 && !searchMatch && (
            <p className="mt-2 text-sm text-parchment-muted">Bu tanrının bilinen bir evrimi bulunmuyor.</p>
          )}
          {searchMatch && (
            <p className="mt-2 text-sm text-rel-cyan">
              Bulundu: {getDeityName(searchMatch.lineage.chain[searchMatch.index].deityId)} (
              {searchMatch.lineage.name} zinciri, adim {searchMatch.index + 1})
            </p>
          )}
        </div>

        <section className="space-y-7">
          {visibleLineages.map((lineage) => (
            <div key={lineage.id} className="rounded-2xl border border-gold/20 bg-background/88 p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-heading text-xl text-gold-pale">{lineage.name}</h2>
                <span className="rounded-full border border-gold/25 px-2 py-1 text-[11px] text-parchment-muted">
                  {lineage.chain.length} adim
                </span>
              </div>

              <div className="overflow-x-auto pb-2">
                <div className="flex min-w-max items-center gap-2">
                  {lineage.chain.map((step, index) => {
                    const highlighted = searchMatch?.lineage.id === lineage.id && searchMatch.index === index;
                    const deity = getDeityRecord(step.deityId);
                    const deityName = getDeityName(step.deityId);

                    return (
                      <div key={`${lineage.id}-${step.deityId}-${index}`} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedStep({ lineageId: lineage.id, index })}
                          className={`w-56 overflow-hidden rounded-lg border text-left ${
                            highlighted
                              ? 'border-rel-cyan/70 bg-rel-cyan-deep'
                              : 'border-gold/20 bg-surface hover:border-gold/45'
                          }`}
                        >
                          <div className="h-32 overflow-hidden">
                            <AncientImage
                              src={stepImage(step)}
                              fallbackSrc={getMythologyNode(step.mythologyId)?.imageUrl ?? null}
                              alt={deityName}
                              width={448}
                              height={256}
                              sizes="224px"
                              className="h-full w-full object-cover opacity-80"
                              fallbackLabel={deityName}
                            />
                          </div>
                          <div className="space-y-1 p-3">
                            <p className="text-sm text-gold-pale">{deityName}</p>
                            <p className="text-xs text-parchment-muted">{getMythologyName(step.mythologyId)}</p>
                            <p className="text-[11px] text-muted">{step.period}</p>
                            {deity && (
                              <p className="line-clamp-2 text-[11px] text-parchment-muted">{deity.description}</p>
                            )}
                          </div>
                        </button>

                        {index < lineage.chain.length - 1 && (
                          <div
                            className="relative flex items-center"
                            onMouseEnter={() => setHoveredTransition({ lineageId: lineage.id, index })}
                            onMouseLeave={() => setHoveredTransition(null)}
                          >
                            <div className="h-[2px] w-10 bg-rel-cyan/60" />
                            <span className="ml-1 text-rel-cyan">➜</span>
                            {hoveredTransition?.lineageId === lineage.id && hoveredTransition.index === index && (
                              <div className="absolute left-1/2 top-8 z-20 w-64 -translate-x-1/2 rounded-md border border-rel-cyan/35 bg-rel-cyan-deep/95 p-2 text-xs text-rel-cyan-light">
                                <p className="mb-1 text-rel-cyan-light">Neler degisti?</p>
                                <ul className="list-disc space-y-1 pl-4">
                                  {lineage.chain[index + 1].changes.map((change) => (
                                    <li key={change}>{change}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </section>

        <aside
          className={`pointer-events-auto fixed right-0 top-0 z-50 h-full w-full transform border-l border-gold/25 bg-background/96 backdrop-blur-xl transition-transform duration-300 sm:w-[min(92vw,420px)] ${
            activeStepData ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-gold/20 px-4 py-3">
            <h3 className="text-sm tracking-[0.14em] text-gold-pale">Tanrı Ayrıntısı</h3>
            <button type="button" onClick={() => setSelectedStep(null)} className="text-xs text-parchment-dim hover:text-gold-pale">
              Kapat
            </button>
          </div>
          {activeStepData && (
            <div className="space-y-4 overflow-y-auto p-4 text-sm text-parchment-dim">
              <div className="h-44 overflow-hidden rounded-lg border border-gold/20">
                <AncientImage
                  src={stepImage(activeStepData.step)}
                  fallbackSrc={getMythologyNode(activeStepData.step.mythologyId)?.imageUrl ?? null}
                  alt={getDeityName(activeStepData.step.deityId)}
                  width={640}
                  height={352}
                  sizes="(max-width: 768px) 92vw, 420px"
                  className="h-full w-full object-cover opacity-80"
                  fallbackLabel={getDeityName(activeStepData.step.deityId)}
                />
              </div>
              <p className="text-lg text-gold-pale">{getDeityName(activeStepData.step.deityId)}</p>
              <p className="text-xs text-parchment-muted">
                {getMythologyName(activeStepData.step.mythologyId)} · {activeStepData.step.period}
              </p>
              {activeStepData.deity ? (
                <p className="leading-relaxed">{activeStepData.deity.description}</p>
              ) : (
                <p className="leading-relaxed text-parchment-muted">
                  Bu adım için yerel tanrı kaydı bulunmuyor; zincir verisi akademik karşılaştırma amacıyla
                  derlenmiştir.
                </p>
              )}
              <div>
                <p className="mb-1 text-xs uppercase tracking-[0.14em] text-parchment-muted">Değişim Notlari</p>
                <ul className="list-disc space-y-1 pl-5 text-xs">
                  {activeStepData.step.changes.map((change) => (
                    <li key={change}>{change}</li>
                  ))}
                </ul>
              </div>
              {activeStepData.deity && (
                <HoverPrefetchLink
                  href={`/deity/${activeStepData.deity.id}`}
                  className="inline-flex rounded-full border border-gold/40 px-4 py-2 text-xs text-gold-pale"
                >
                  Tanrı ayrıntı sayfası
                </HoverPrefetchLink>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
