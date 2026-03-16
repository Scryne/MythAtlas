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

function stepImage(step: DeityEvolutionStep): string {
  const deity = getDeityRecord(step.deityId);
  if (deity?.imageUrl) return deity.imageUrl;
  const mythologyNode = getMythologyNode(step.mythologyId);
  if (mythologyNode?.imageUrl) return mythologyNode.imageUrl;
  return 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Ancient_Greek_Temple_Icon.svg/512px-Ancient_Greek_Temple_Icon.svg.png';
}

export default function DeityEvolutionPageClient() {
  const [search, setSearch] = useState('');
  const [selectedStep, setSelectedStep] = useState<SelectedStep | null>(null);
  const [hoveredTransition, setHoveredTransition] = useState<{ lineageId: string; index: number } | null>(
    null
  );

  const searchMatch = useMemo(() => {
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
  }, [search]);

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
    <div className="min-h-screen bg-[#050505] px-4 pb-14 pt-24 text-[#ebd7ab] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-2xl border border-[#c9a84c]/25 bg-[radial-gradient(circle_at_18%_20%,rgba(201,168,76,0.16),rgba(7,7,7,0.94)_55%)] p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#d9bf87]">Deity Evolution Chains</p>
          <h1 className="mt-3 font-heading text-3xl text-[#f0d58d] sm:text-4xl">Tanri Evrim Zincirleri</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#cfbc95]">
            Zincirler, tanri figurlarinin farkli mitolojik sistemlerde nasil yeniden yorumlandigini gosterir.
            Oklarin ustune gelerek hangi ozelliklerin degistigini gorebilirsin.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <HoverPrefetchLink href="/family-tree" className="rounded-full border border-[#c9a84c]/35 px-4 py-2 text-xs text-[#f0d58d]">
              Family Tree graphine don
            </HoverPrefetchLink>
            <HoverPrefetchLink href="/compare" className="rounded-full border border-[#7ad7f4]/35 px-4 py-2 text-xs text-[#bceffc]">
              Compare araci
            </HoverPrefetchLink>
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-[#c9a84c]/20 bg-[#0f0d09]/85 p-4">
          <label className="text-xs uppercase tracking-[0.16em] text-[#c9b082]">Search Deity Lineage</label>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ornek: Ishtar, Zeus, Enki..."
            className="mt-2 w-full rounded-md border border-[#c9a84c]/25 bg-[#16120d] px-3 py-2 text-sm text-[#ead5a4] outline-none focus:border-[#e6c879]"
          />
          {normalize(search).length >= 2 && !searchMatch && (
            <p className="mt-2 text-sm text-[#d8b383]">Bu tanrinin bilinen bir evrimi bulunmuyor.</p>
          )}
          {searchMatch && (
            <p className="mt-2 text-sm text-[#9fe6ff]">
              Bulundu: {getDeityName(searchMatch.lineage.chain[searchMatch.index].deityId)} (
              {searchMatch.lineage.name} zinciri, adim {searchMatch.index + 1})
            </p>
          )}
        </div>

        <section className="space-y-7">
          {visibleLineages.map((lineage) => (
            <div key={lineage.id} className="rounded-2xl border border-[#c9a84c]/20 bg-[#0f0d09]/88 p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-heading text-xl text-[#f0d58d]">{lineage.name}</h2>
                <span className="rounded-full border border-[#c9a84c]/25 px-2 py-1 text-[11px] text-[#cdb786]">
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
                              ? 'border-[#7ad7f4]/70 bg-[#102532]'
                              : 'border-[#c9a84c]/20 bg-[#16120d] hover:border-[#c9a84c]/45'
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
                            <p className="text-sm text-[#f0d58d]">{deityName}</p>
                            <p className="text-xs text-[#baa67c]">{getMythologyName(step.mythologyId)}</p>
                            <p className="text-[11px] text-[#9f8a63]">{step.period}</p>
                            {deity && (
                              <p className="line-clamp-2 text-[11px] text-[#bda980]">{deity.description}</p>
                            )}
                          </div>
                        </button>

                        {index < lineage.chain.length - 1 && (
                          <div
                            className="relative flex items-center"
                            onMouseEnter={() => setHoveredTransition({ lineageId: lineage.id, index })}
                            onMouseLeave={() => setHoveredTransition(null)}
                          >
                            <div className="h-[2px] w-10 bg-[#7ad7f4]/60" />
                            <span className="ml-1 text-[#7ad7f4]">➜</span>
                            {hoveredTransition?.lineageId === lineage.id && hoveredTransition.index === index && (
                              <div className="absolute left-1/2 top-8 z-20 w-64 -translate-x-1/2 rounded-md border border-[#7ad7f4]/35 bg-[#0f2230]/95 p-2 text-xs text-[#c9eefb]">
                                <p className="mb-1 text-[#d7f4ff]">Neler degisti?</p>
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
          className={`pointer-events-auto fixed right-0 top-0 z-50 h-full w-full transform border-l border-[#c9a84c]/25 bg-[#090806]/96 backdrop-blur-xl transition-transform duration-300 sm:w-[min(92vw,420px)] ${
            activeStepData ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-[#c9a84c]/20 px-4 py-3">
            <h3 className="text-sm tracking-[0.14em] text-[#edd39c]">Deity Detail</h3>
            <button type="button" onClick={() => setSelectedStep(null)} className="text-xs text-[#d0bb8b] hover:text-[#f2d68e]">
              Close
            </button>
          </div>
          {activeStepData && (
            <div className="space-y-4 overflow-y-auto p-4 text-sm text-[#d9c7a2]">
              <div className="h-44 overflow-hidden rounded-lg border border-[#c9a84c]/20">
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
              <p className="text-lg text-[#f0d58d]">{getDeityName(activeStepData.step.deityId)}</p>
              <p className="text-xs text-[#bfa97c]">
                {getMythologyName(activeStepData.step.mythologyId)} · {activeStepData.step.period}
              </p>
              {activeStepData.deity ? (
                <p className="leading-relaxed">{activeStepData.deity.description}</p>
              ) : (
                <p className="leading-relaxed text-[#c5b38d]">
                  Bu adim icin yerel deity kaydi bulunmuyor; zincir verisi akademik karsilastirma amaciyla
                  derlenmistir.
                </p>
              )}
              <div>
                <p className="mb-1 text-xs uppercase tracking-[0.14em] text-[#bea571]">Degisim Notlari</p>
                <ul className="list-disc space-y-1 pl-5 text-xs">
                  {activeStepData.step.changes.map((change) => (
                    <li key={change}>{change}</li>
                  ))}
                </ul>
              </div>
              {activeStepData.deity && (
                <HoverPrefetchLink
                  href={`/deity/${activeStepData.deity.id}`}
                  className="inline-flex rounded-full border border-[#c9a84c]/40 px-4 py-2 text-xs text-[#f0d58d]"
                >
                  Deity detail page
                </HoverPrefetchLink>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
