'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import CountUpOnView from '@/components/stats/CountUpOnView';
import {
  calculateParallelSimilarity,
  parallelThemeClusters,
  type ParallelThemeCluster,
  type ParallelVersion,
} from '@/lib/parallels-data';

const ParallelForceOverlay = dynamic(() => import('@/components/parallels/ParallelForceOverlay'), {
  ssr: false,
  loading: () => (
    <div className="skeleton-warm h-[240px] w-full rounded-lg border border-[#d6b56a]/20 bg-[#0f0b08]" />
  ),
});

const MAP_WIDTH = 1160;
const MAP_HEIGHT = 520;

interface PlottedVersion extends ParallelVersion {
  x: number;
  y: number;
  order: number;
}

function projectToMap([lng, lat]: [number, number]) {
  const x = ((lng + 180) / 360) * MAP_WIDTH;
  const y = ((90 - lat) / 180) * MAP_HEIGHT;
  return { x, y };
}

function buildArcPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  const lift = Math.max(30, Math.min(130, distance * 0.3));
  const c1x = from.x + dx * 0.25;
  const c2x = from.x + dx * 0.75;
  const c1y = from.y - lift;
  const c2y = to.y - lift;
  return `M ${from.x} ${from.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${to.x} ${to.y}`;
}

function scoreLabel(score: number) {
  if (score >= 88) return 'Cok guclu paralellik';
  if (score >= 74) return 'Guclu paralellik';
  if (score >= 60) return 'Orta duzey paralellik';
  return 'Uzak paralellik';
}

function haversineKm(a: [number, number], b: [number, number]) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const p1 = toRad(lat1);
  const p2 = toRad(lat2);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 6371 * (2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

function chronologyRank(version: ParallelVersion): number {
  const text = `${version.tradition} ${version.culture}`.toLowerCase();
  if (text.includes('sumer') || text.includes('mesopotam')) return 1;
  if (text.includes('egypt')) return 2;
  if (text.includes('vedic') || text.includes('indic') || text.includes('hindu')) return 3;
  if (text.includes('hebrew') || text.includes('biblical') || text.includes('abrahamic')) return 4;
  if (text.includes('greek') || text.includes('hellenic')) return 5;
  if (text.includes('roman')) return 6;
  if (text.includes('norse') || text.includes('germanic') || text.includes('slavic')) return 7;
  if (text.includes('chinese') || text.includes('han') || text.includes('japanese')) return 8;
  if (text.includes('aztec') || text.includes('maya') || text.includes('inca')) return 9;
  return 10;
}

export default function ParallelsPage() {
  const [activeThemeId, setActiveThemeId] = useState(parallelThemeClusters[0]?.id ?? '');
  const [spreadAnimation, setSpreadAnimation] = useState(false);
  const [spreadStep, setSpreadStep] = useState(Number.MAX_SAFE_INTEGER);

  const activeTheme = useMemo(
    () => parallelThemeClusters.find((cluster) => cluster.id === activeThemeId) ?? parallelThemeClusters[0],
    [activeThemeId]
  ) as ParallelThemeCluster;

  const [leftVersionId, setLeftVersionId] = useState(activeTheme?.versions[0]?.id ?? '');
  const [rightVersionId, setRightVersionId] = useState(activeTheme?.versions[1]?.id ?? '');

  useEffect(() => {
    setLeftVersionId(activeTheme.versions[0]?.id ?? '');
    setRightVersionId(activeTheme.versions[1]?.id ?? '');
    setSpreadStep(spreadAnimation ? 1 : Number.MAX_SAFE_INTEGER);
  }, [activeTheme.id, activeTheme.versions, spreadAnimation]);

  const clusterInsights = useMemo(() => {
    const map = new Map<string, { cultureCount: number; farPairText: string }>();

    parallelThemeClusters.forEach((cluster) => {
      const cultureCount = new Set(cluster.versions.map((item) => item.culture)).size;
      let maxDistance = -1;
      let best: [ParallelVersion, ParallelVersion] | null = null;

      for (let i = 0; i < cluster.versions.length; i += 1) {
        for (let j = i + 1; j < cluster.versions.length; j += 1) {
          const a = cluster.versions[i];
          const b = cluster.versions[j];
          const dist = haversineKm(a.coordinates, b.coordinates);
          if (dist > maxDistance) {
            maxDistance = dist;
            best = [a, b];
          }
        }
      }

      map.set(cluster.id, {
        cultureCount,
        farPairText: best ? `${best[0].mythName} <> ${best[1].mythName}` : 'N/A',
      });
    });

    return map;
  }, []);

  const versionsById = useMemo(
    () => new Map(activeTheme.versions.map((version) => [version.id, version])),
    [activeTheme.versions]
  );

  const leftVersion = versionsById.get(leftVersionId) ?? activeTheme.versions[0];
  const rightVersion = versionsById.get(rightVersionId) ?? activeTheme.versions[1];

  const similarity = useMemo(
    () => (leftVersion && rightVersion ? calculateParallelSimilarity(leftVersion, rightVersion) : 0),
    [leftVersion, rightVersion]
  );

  const plottedVersions = useMemo<PlottedVersion[]>(
    () =>
      [...activeTheme.versions]
        .sort((a, b) => chronologyRank(a) - chronologyRank(b))
        .map((version, index) => ({
          ...version,
          ...projectToMap(version.coordinates),
          order: index,
        })),
    [activeTheme.versions]
  );

  useEffect(() => {
    if (!spreadAnimation) {
      setSpreadStep(Number.MAX_SAFE_INTEGER);
      return;
    }

    setSpreadStep(1);
    const timer = window.setInterval(() => {
      setSpreadStep((current) => {
        if (current >= plottedVersions.length) return current;
        return current + 1;
      });
    }, 170);

    return () => window.clearInterval(timer);
  }, [plottedVersions.length, spreadAnimation, activeTheme.id]);

  const visibleVersions = useMemo(
    () =>
      spreadAnimation
        ? plottedVersions.filter((version) => version.order < spreadStep)
        : plottedVersions,
    [plottedVersions, spreadAnimation, spreadStep]
  );

  const mapConnections = useMemo(() => {
    const lines: Array<{
      id: string;
      from: PlottedVersion;
      to: PlottedVersion;
      score: number;
    }> = [];

    for (let i = 0; i < visibleVersions.length; i += 1) {
      for (let j = i + 1; j < visibleVersions.length; j += 1) {
        const from = visibleVersions[i];
        const to = visibleVersions[j];
        const score = calculateParallelSimilarity(from, to);
        if (score >= 66) {
          lines.push({ id: `${from.id}::${to.id}`, from, to, score });
        }
      }
    }

    return lines.sort((a, b) => b.score - a.score).slice(0, 34);
  }, [visibleVersions]);

  const activeInsight = clusterInsights.get(activeTheme.id);

  const farthestPairCallout = useMemo(() => {
    let maxDistance = -1;
    let best: [ParallelVersion, ParallelVersion] | null = null;

    for (let i = 0; i < activeTheme.versions.length; i += 1) {
      for (let j = i + 1; j < activeTheme.versions.length; j += 1) {
        const a = activeTheme.versions[i];
        const b = activeTheme.versions[j];
        const dist = haversineKm(a.coordinates, b.coordinates);
        if (dist > maxDistance) {
          maxDistance = dist;
          best = [a, b];
        }
      }
    }

    if (!best) {
      return { title: 'En ilginc benzerlik', body: 'Yeterli veri yok.' };
    }

    return {
      title: 'En ilginc benzerlik',
      body: `${best[0].mythName} ve ${best[1].mythName} arasinda yaklasik ${Math.round(maxDistance)} km mesafe olmasina ragmen guclu motif ortusmesi var.`,
    };
  }, [activeTheme.versions]);

  const gaugeRadius = 56;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference * (1 - similarity / 100);

  return (
    <div className="min-h-screen bg-[#090806] px-4 pb-16 pt-24 text-[#f4e4c1] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 rounded-2xl border border-[#d6b56a]/25 bg-[radial-gradient(circle_at_20%_20%,rgba(214,181,106,0.18),rgba(9,8,6,0.94)_55%)] p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#d6b56a]/90">Parallel Myths Explorer</p>
          <h1 className="mt-3 font-heading text-3xl text-[#f6df9d] sm:text-4xl">Insanligin Ortak Hikaye Haritasi</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#d8c7a4] sm:text-base">
            Tema kartlarini sec, benzer mitlerin cografi uzerindeki dagilimini ve kulturler arasi akis yonunu canli olarak izle.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/compare"
              className="rounded-full border border-[#d6b56a]/60 bg-[#2b1f0f]/80 px-4 py-2 text-xs tracking-[0.16em] text-[#f7de96] hover:bg-[#3a2a14]"
            >
              KARSILASTIRMA ARACI
            </Link>
            <Link
              href="/map"
              className="rounded-full border border-[#d6b56a]/30 px-4 py-2 text-xs tracking-[0.16em] text-[#e5cf95] hover:border-[#d6b56a]/60"
            >
              ANA HARITAYA DON
            </Link>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {parallelThemeClusters.map((cluster) => {
            const isActive = cluster.id === activeTheme.id;
            const insight = clusterInsights.get(cluster.id);
            return (
              <button
                key={cluster.id}
                type="button"
                onClick={() => setActiveThemeId(cluster.id)}
                className={`rounded-2xl border p-5 text-left transition-all ${
                  isActive
                    ? 'border-[#f4d17a]/80 bg-[#20160c] shadow-[0_0_28px_rgba(244,209,122,0.16)]'
                    : 'border-[#d6b56a]/20 bg-[#140f0a] hover:border-[#d6b56a]/45'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-2xl">{cluster.icon}</span>
                  <span
                    className="rounded-full px-2 py-1 text-[11px] font-semibold"
                    style={{ backgroundColor: `${cluster.color}30`, color: cluster.color }}
                  >
                    <CountUpOnView value={cluster.versions.length} /> mit
                  </span>
                </div>
                <p className="mt-3 font-heading text-lg text-[#f6df9d]">{cluster.name}</p>
                <p className="mt-2 text-xs leading-6 text-[#ceb990]">{cluster.subtitle}</p>
                <p className="mt-2 text-[11px] text-[#d7c39a]">
                  Insanlik <CountUpOnView value={insight?.cultureCount ?? 0} /> kulturde ayni hikayeyi anlatti.
                </p>
                <p className="mt-1 line-clamp-1 text-[11px] text-[#c8b286]">En ilginc benzerlik: {insight?.farPairText}</p>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.55fr_0.95fr]">
          <section className="rounded-2xl border border-[#d6b56a]/20 bg-[#100d09] p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl text-[#f6df9d]">
                  {activeTheme.icon} {activeTheme.name}
                </h2>
                <p className="text-xs text-[#cbb48a]">{activeTheme.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setSpreadAnimation((value) => !value)}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  spreadAnimation
                    ? 'border-[#f4d17a]/70 bg-[#2a1a0d] text-[#f6df9d]'
                    : 'border-[#d6b56a]/30 bg-[#1a130d] text-[#d6bf8d]'
                }`}
              >
                Yayilma animasyonu: {spreadAnimation ? 'Acik' : 'Kapali'}
              </button>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-[#d6b56a]/20 bg-[#080705]">
              <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="h-[420px] w-full">
                <defs>
                  <linearGradient id="ocean-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#071225" />
                    <stop offset="100%" stopColor="#0d1d17" />
                  </linearGradient>
                </defs>

                <rect x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#ocean-gradient)" />

                <g opacity={0.2} fill="#8f7b58">
                  <path d="M95,130 L280,98 L360,148 L335,240 L210,276 L95,208 Z" />
                  <path d="M332,260 L410,245 L450,290 L425,370 L352,390 L312,334 Z" />
                  <path d="M470,135 L602,86 L710,118 L732,190 L640,230 L520,212 Z" />
                  <path d="M705,226 L796,198 L892,236 L915,311 L838,372 L754,340 Z" />
                  <path d="M852,84 L986,80 L1064,132 L1040,206 L922,176 Z" />
                </g>

                {Array.from({ length: 11 }).map((_, index) => {
                  const y = (MAP_HEIGHT / 10) * index;
                  return (
                    <line
                      key={`lat-${y}`}
                      x1={0}
                      y1={y}
                      x2={MAP_WIDTH}
                      y2={y}
                      stroke="#cdb67f22"
                      strokeWidth={1}
                    />
                  );
                })}

                {mapConnections.map((line) => (
                  <path
                    key={line.id}
                    d={buildArcPath(line.from, line.to)}
                    stroke={activeTheme.color}
                    strokeWidth={Math.max(1.2, line.score / 28)}
                    strokeOpacity={0.62}
                    fill="none"
                    className="parallel-arc-flow"
                    style={{ strokeDasharray: '9 7' }}
                  />
                ))}

                {visibleVersions.map((version) => {
                  const isChosen = version.id === leftVersion?.id || version.id === rightVersion?.id;
                  return (
                    <motion.g
                      key={version.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.32 }}
                    >
                      <circle
                        cx={version.x}
                        cy={version.y}
                        r={isChosen ? 8 : 5.5}
                        fill={isChosen ? '#f6df9d' : activeTheme.color}
                        stroke="#0f0d09"
                        strokeWidth={1.4}
                      />
                      {isChosen && (
                        <text x={version.x + 10} y={version.y - 10} fill="#f8e6bf" fontSize="12" fontWeight={600}>
                          {version.mythName}
                        </text>
                      )}
                    </motion.g>
                  );
                })}
              </svg>
            </div>
          </section>

          <aside className="rounded-2xl border border-[#d6b56a]/20 bg-[#100d09] p-4 sm:p-5">
            <h3 className="font-heading text-lg text-[#f6df9d]">Mit Varyantlari</h3>
            <p className="mt-1 text-xs text-[#c8b286]">Iki varyanti secerek benzerlik olcumu yap.</p>

            <div className="mt-4 max-h-[300px] space-y-2 overflow-y-auto pr-1">
              {activeTheme.versions.map((version) => {
                const isLeft = version.id === leftVersion?.id;
                const isRight = version.id === rightVersion?.id;
                return (
                  <div key={version.id} className="rounded-xl border border-[#d6b56a]/15 bg-[#18120d] p-3">
                    <p className="text-sm text-[#f2dca0]">{version.mythName}</p>
                    <p className="text-[11px] text-[#c3ad82]">
                      {version.tradition} | {version.culture}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setLeftVersionId(version.id)}
                        className={`rounded-full px-2 py-1 text-[10px] ${
                          isLeft ? 'bg-[#f4d17a] text-[#1a1207]' : 'bg-[#2a1d10] text-[#d8c08d] hover:bg-[#3a2915]'
                        }`}
                      >
                        A sec
                      </button>
                      <button
                        type="button"
                        onClick={() => setRightVersionId(version.id)}
                        className={`rounded-full px-2 py-1 text-[10px] ${
                          isRight ? 'bg-[#7ad7f4] text-[#06131a]' : 'bg-[#1c2630] text-[#b2d9e8] hover:bg-[#233647]'
                        }`}
                      >
                        B sec
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {leftVersion && rightVersion && (
              <div className="mt-5 rounded-xl border border-[#d6b56a]/25 bg-[#16100b] p-4">
                <p className="text-[11px] uppercase tracking-[0.15em] text-[#cdb57f]">Benzerlik Gosterge Saati</p>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <svg viewBox="0 0 140 90" className="h-24 w-36">
                    <path d="M 14 76 A 56 56 0 0 1 126 76" fill="none" stroke="rgba(214,181,106,0.2)" strokeWidth="11" />
                    <path
                      d="M 14 76 A 56 56 0 0 1 126 76"
                      fill="none"
                      stroke="url(#gauge-grad)"
                      strokeWidth="11"
                      strokeLinecap="round"
                      strokeDasharray={gaugeCircumference / 2}
                      strokeDashoffset={gaugeOffset / 2}
                      transform="rotate(180 70 76)"
                    />
                    <defs>
                      <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#7ad7f4" />
                        <stop offset="100%" stopColor="#f6df9d" />
                      </linearGradient>
                    </defs>
                    <text x="70" y="56" textAnchor="middle" fill="#f7df9b" fontSize="25" fontWeight="700">
                      {similarity}
                    </text>
                  </svg>
                  <div>
                    <p className="text-xs text-[#ccb78f]">{scoreLabel(similarity)}</p>
                    <p className="mt-1 text-xs text-[#d8c4a0]">A: {leftVersion.mythName}</p>
                    <p className="text-xs text-[#b8dceb]">B: {rightVersion.mythName}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 rounded-xl border border-[#f0ca76]/30 bg-[#2a1a0e] p-4 text-sm text-[#f4dfad]">
              <p className="text-[11px] uppercase tracking-[0.15em] text-[#f3d189]">{farthestPairCallout.title}</p>
              <p className="mt-2 leading-6">{farthestPairCallout.body}</p>
              <p className="mt-2 text-xs text-[#e2c890]">
                Insanlik <CountUpOnView value={activeInsight?.cultureCount ?? 0} /> kulturde bu temayi anlatti.
              </p>
            </div>
          </aside>
        </div>

        <section className="mt-6 rounded-2xl border border-[#d6b56a]/20 bg-[#100d09] p-4 sm:p-5">
          <h3 className="font-heading text-lg text-[#f6df9d]">Tema Yogunluk Agi</h3>
          <p className="mt-1 text-xs text-[#c8b286]">
            D3 force yerlesimi secili tema varyantlarinin birbirine gore dagilim profilini gosterir.
          </p>
          <div className="mt-4">
            <ParallelForceOverlay versions={activeTheme.versions} color={activeTheme.color} />
          </div>
        </section>
      </div>
    </div>
  );
}
