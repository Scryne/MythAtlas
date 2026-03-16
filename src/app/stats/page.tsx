'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo } from 'react';
import CountUpOnView from '@/components/stats/CountUpOnView';
import {
  getArchaeologyProtectionStatusData,
  getArtifactsByCurrentCountryData,
  getExcavationActivityByDecadeData,
  getDeitiesByDomainData,
  getFunFacts,
  getMostArtifactRichMythologiesData,
  getMostConnectedMyths,
  getMythologyHeatData,
  getMythsByTypeData,
  getSacredSitesByTypeData,
  getTimelineData,
  getTotalsData,
} from '@/lib/insights';
import { getMythologyNode } from '@/lib/family-tree-data';

const StatsCharts = dynamic(() => import('@/components/stats/StatsCharts'), {
  ssr: false,
  loading: () => (
    <div className="ancient-card skeleton-warm p-6 text-sm text-foreground/65">
      Istatistik grafikler yukleniyor...
    </div>
  ),
});

export default function StatsPage() {
  const totals = useMemo(() => getTotalsData(), []);
  const mythsByType = useMemo(() => getMythsByTypeData(), []);
  const heatData = useMemo(() => getMythologyHeatData(), []);
  const connected = useMemo(() => getMostConnectedMyths(10), []);
  const domains = useMemo(() => getDeitiesByDomainData(22), []);
  const sitesByType = useMemo(() => getSacredSitesByTypeData(), []);
  const timeline = useMemo(() => getTimelineData(16), []);
  const archaeologyProtection = useMemo(() => getArchaeologyProtectionStatusData(), []);
  const excavationByDecade = useMemo(() => getExcavationActivityByDecadeData(), []);
  const artifactsByCountry = useMemo(() => getArtifactsByCurrentCountryData(), []);
  const artifactRichMythologies = useMemo(() => getMostArtifactRichMythologiesData(10), []);
  const funFacts = useMemo(() => getFunFacts(), []);

  const timelineSpan = timeline.meta.maxYear - timeline.meta.minYear;
  const intersections = [
    'Turk ve Iskandinav mitolojilerinde ejderha figuru benzer bicimde sinir bekcisi rolunde.',
    'Mesopotamya, Yunan ve Hint tufan anlatilarinda secilmis kurtulus kalibi tekrar ediyor.',
    'Atesin insanliga aktarimi en az 6 buyuk kulturde bagimsiz anlatilarla geciyor.',
    'Olum-den donus motifi, tarim takvimiyle baglantili mitlerde beklenenden daha yogun.',
    'Ayni gok tanrisi arketipi Yunan, Roma ve Hint sistemlerinde farkli siyasi anlamlar kazaniyor.',
  ];
  const familyTree = {
    nodes: [
      { id: 'sumerian', x: 40, y: 36 },
      { id: 'babylonian', x: 180, y: 36 },
      { id: 'biblical-hebrew', x: 320, y: 36 },
      { id: 'greek', x: 40, y: 132 },
      { id: 'roman', x: 180, y: 132 },
      { id: 'norse', x: 320, y: 132 },
      { id: 'hindu', x: 460, y: 84 },
    ],
    edges: [
      ['sumerian', 'babylonian'],
      ['babylonian', 'biblical-hebrew'],
      ['greek', 'roman'],
      ['greek', 'norse'],
      ['hindu', 'greek'],
    ] as const,
  };
  const familyTreeNodes = familyTree.nodes.map((item) => {
    const node = getMythologyNode(item.id);
    return {
      ...item,
      label: node?.name.replace(' Mythology', '') ?? item.id,
      completeness: node?.completeness.label ?? 'sparse',
    };
  });
  const nodeById = new Map(familyTreeNodes.map((item) => [item.id, item]));

  return (
    <div className="section-container space-y-8 py-8">
      <section className="ancient-card p-6">
        <h1 className="text-3xl text-gold">Stats & Insights</h1>
        <p className="meta-text mt-2 text-sm">MythAtlas veri setinin dagilimi, baglantilar ve kulturler arasi desenler.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-gold/20 bg-black/20 p-4">
            <p className="meta-text text-xs uppercase tracking-[0.14em]">Mitolojiler</p>
            <p className="mt-2 text-3xl text-gold-light"><CountUpOnView value={totals.mythologies} /></p>
          </div>
          <div className="rounded-lg border border-gold/20 bg-black/20 p-4">
            <p className="meta-text text-xs uppercase tracking-[0.14em]">Mitler</p>
            <p className="mt-2 text-3xl text-gold-light"><CountUpOnView value={totals.myths} /></p>
          </div>
          <div className="rounded-lg border border-gold/20 bg-black/20 p-4">
            <p className="meta-text text-xs uppercase tracking-[0.14em]">Tanrilar</p>
            <p className="mt-2 text-3xl text-gold-light"><CountUpOnView value={totals.deities} /></p>
          </div>
          <div className="rounded-lg border border-gold/20 bg-black/20 p-4">
            <p className="meta-text text-xs uppercase tracking-[0.14em]">Kutsal mekanlar</p>
            <p className="mt-2 text-3xl text-gold-light"><CountUpOnView value={totals.sacredSites} /></p>
          </div>
        </div>
      </section>

      <StatsCharts
        mythsByType={mythsByType}
        heatData={heatData}
        connected={connected}
        domains={domains}
        sitesByType={sitesByType}
        archaeologyProtection={archaeologyProtection}
        excavationByDecade={excavationByDecade}
        artifactsByCountry={artifactsByCountry}
        artifactRichMythologies={artifactRichMythologies}
        timeline={timeline}
        timelineSpan={timelineSpan}
      />

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="ancient-card p-6">
          <h2 className="text-2xl text-gold">Mitoloji Ailesi Agaci</h2>
          <p className="meta-text mt-1 text-sm">Basit etki akislari: Greek -&gt; Roman, Sumerian -&gt; Babylonian -&gt; Hebrew.</p>
          <div className="mt-4 overflow-x-auto">
            <svg viewBox="0 0 560 200" className="min-w-[560px]">
              {familyTree.edges.map(([fromId, toId]) => {
                const from = nodeById.get(fromId)!;
                const to = nodeById.get(toId)!;
                return (
                  <line
                    key={`${fromId}-${toId}`}
                    x1={from.x + 42}
                    y1={from.y + 18}
                    x2={to.x + 4}
                    y2={to.y + 18}
                    stroke="rgba(201,168,76,.55)"
                    strokeWidth="2"
                  />
                );
              })}
              {familyTreeNodes.map((node) => (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  <rect
                    width="84"
                    height="36"
                    rx="8"
                    fill="rgba(18,14,10,.92)"
                    stroke={
                      node.completeness === 'complete'
                        ? 'rgba(201,168,76,.55)'
                        : node.completeness === 'partial'
                          ? 'rgba(122,215,244,.45)'
                          : 'rgba(240,207,133,.38)'
                    }
                  />
                  <text x="42" y="22" textAnchor="middle" fill="#f4e0b0" fontSize="11">
                    {node.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </article>

        <article className="ancient-card p-6">
          <h2 className="text-2xl text-gold">Ilginc Kesisimler</h2>
          <div className="mt-4 space-y-2">
            {intersections.map((item) => (
              <p key={item} className="rounded-md border border-gold/15 bg-black/20 px-3 py-2 text-sm text-foreground/75">
                {item}
              </p>
            ))}
          </div>
        </article>
      </section>

      <section className="ancient-card p-6">
        <h2 className="text-2xl text-gold">Fun facts</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {funFacts.map((fact, index) => (
            <div key={fact.label} className="stagger-card rounded-lg border border-gold/20 bg-black/20 p-4" style={{ animationDelay: `${index * 55}ms` }}>
              <p className="meta-text text-xs uppercase tracking-[0.14em]">{fact.label}</p>
              {fact.href ? (
                <Link href={fact.href} className="mt-2 block text-3xl font-semibold text-gold-light hover:text-gold">
                  {fact.value}
                </Link>
              ) : (
                <p className="mt-2 text-3xl font-semibold text-gold-light">{fact.value}</p>
              )}
              <p className="meta-text mt-2 text-xs">{fact.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
