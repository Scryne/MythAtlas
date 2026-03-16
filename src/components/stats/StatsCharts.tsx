'use client';

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ArtifactCountryChoropleth from '@/components/stats/ArtifactCountryChoropleth';
import MythologyChoropleth from '@/components/stats/MythologyChoropleth';
import {
  type ArchaeologyProtectionDatum,
  type ArtifactCountryDatum,
  type ArtifactRichMythologyDatum,
  type ConnectedMythDatum,
  type DomainBubbleDatum,
  type ExcavationDecadeDatum,
  type MythologyHeatDatum,
  type MythsByTypeDatum,
  type SacredSiteTypeDatum,
  type TimelineDatum,
  type TimelineMeta,
} from '@/lib/insights';
import { formatYear } from '@/lib/myth-utils';

const PIE_COLORS = ['#d6b15b', '#6ba8de', '#cb7676', '#9b86e0', '#4ab291', '#de8e5d', '#f2c97f', '#a0b7d8'];
const REGION_COLORS: Record<string, string> = {
  mediterranean: '#6ba8de',
  europe: '#6ba8de',
  'northern europe': '#5bbd7a',
  'north europe': '#5bbd7a',
  scandinavia: '#5bbd7a',
  asia: '#de8e5d',
  'east asia': '#de8e5d',
  'south asia': '#de8e5d',
  mesopotamia: '#b985de',
  africa: '#d66f6f',
  americas: '#57c2c2',
  oceania: '#e4c16a',
};

function regionColor(region: string) {
  const key = region.toLowerCase();
  for (const [regionKey, color] of Object.entries(REGION_COLORS)) {
    if (key.includes(regionKey)) return color;
  }
  return '#cfad5d';
}

interface StatsChartsProps {
  mythsByType: MythsByTypeDatum[];
  heatData: MythologyHeatDatum[];
  connected: ConnectedMythDatum[];
  domains: DomainBubbleDatum[];
  sitesByType: SacredSiteTypeDatum[];
  archaeologyProtection: ArchaeologyProtectionDatum[];
  excavationByDecade: ExcavationDecadeDatum[];
  artifactsByCountry: ArtifactCountryDatum[];
  artifactRichMythologies: ArtifactRichMythologyDatum[];
  timeline: {
    data: TimelineDatum[];
    meta: TimelineMeta;
  };
  timelineSpan: number;
}

function protectionLabel(status: string): string {
  if (status === 'UNESCO') return 'UNESCO';
  if (status === 'national_heritage') return 'Ulusal miras';
  if (status === 'local_protection') return 'Yerel koruma';
  if (status === 'disputed') return 'Tartismali';
  if (status === 'unprotected') return 'Korumasiz';
  return status;
}

export default function StatsCharts({
  mythsByType,
  heatData,
  connected,
  domains,
  sitesByType,
  archaeologyProtection,
  excavationByDecade,
  artifactsByCountry,
  artifactRichMythologies,
  timeline,
  timelineSpan,
}: StatsChartsProps) {
  return (
    <>
      <section className="grid gap-5 xl:grid-cols-2">
        <article className="ancient-card p-5">
          <h2 className="text-xl text-gold">Myths by type</h2>
          <div className="mt-4 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mythsByType}
                  dataKey="count"
                  nameKey="type"
                  innerRadius={62}
                  outerRadius={112}
                  paddingAngle={2}
                  isAnimationActive
                  animationBegin={0}
                  animationDuration={1100}
                >
                  {mythsByType.map((item, index) => (
                    <Cell key={item.type} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value} mit`, name]}
                  contentStyle={{ background: '#0f0b08', border: '1px solid rgba(201,168,76,.3)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="ancient-card p-5">
          <h2 className="text-xl text-gold">Mythologies by region (choropleth)</h2>
          <p className="mt-1 text-xs text-foreground/60">Renk yogunlugu mit sayisini temsil eder.</p>
          <div className="mt-4">
            <MythologyChoropleth data={heatData} />
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="ancient-card p-5">
          <h2 className="text-xl text-gold">Most connected myths</h2>
          <div className="mt-4 h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={connected} layout="vertical" margin={{ left: 18, right: 24, top: 8, bottom: 8 }}>
                <XAxis type="number" stroke="#b8a27b" tick={{ fill: '#b8a27b', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fill: '#d9c39b', fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number, _name: string, entry: { payload?: { mythology?: string } }) => [
                    `${value} baglanti`,
                    entry.payload?.mythology || 'Mit',
                  ]}
                  contentStyle={{ background: '#0f0b08', border: '1px solid rgba(201,168,76,.3)' }}
                />
                <Bar dataKey="connections" fill="#ccaa5a" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="ancient-card p-5">
          <h2 className="text-xl text-gold">Deities by domain</h2>
          <div className="mt-4 h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 12, right: 12, bottom: 20, left: 12 }}>
                <XAxis type="number" dataKey="x" hide domain={[-0.8, 5.8]} />
                <YAxis type="number" dataKey="y" hide domain={[-0.8, 4.8]} />
                <Tooltip
                  cursor={{ stroke: 'rgba(201,168,76,0.25)' }}
                  formatter={(value: number, _name: string, entry: { payload?: { domain?: string } }) => [
                    `${value} tanri`,
                    entry.payload?.domain || 'Domain',
                  ]}
                  contentStyle={{ background: '#0f0b08', border: '1px solid rgba(201,168,76,.3)' }}
                />
                <Scatter data={domains} fill="#d4b368" isAnimationActive animationDuration={1100}>
                  <LabelList dataKey="domain" position="center" className="fill-[#181109]" fontSize={10} />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="ancient-card p-5">
          <h2 className="text-xl text-gold">Sacred sites by type</h2>
          <div className="mt-4 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sitesByType} layout="vertical" margin={{ left: 12, right: 24, top: 8, bottom: 8 }}>
                <XAxis type="number" stroke="#b8a27b" tick={{ fill: '#b8a27b', fontSize: 11 }} />
                <YAxis type="category" dataKey="type" width={120} tick={{ fill: '#d9c39b', fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => [`${value} mekan`, 'Adet']}
                  contentStyle={{ background: '#0f0b08', border: '1px solid rgba(201,168,76,.3)' }}
                />
                <Bar dataKey="count" fill="#81b7df" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="ancient-card p-5">
          <h2 className="text-xl text-gold">Mythology timeline (Gantt)</h2>
          <p className="mt-1 text-xs text-foreground/60">Barlar mitolojik sistemlerin etkin donemini gosterir.</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-foreground/70">
            <span className="rounded-full border border-gold/20 bg-black/20 px-2 py-0.5"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#6ba8de]" />Mediterranean</span>
            <span className="rounded-full border border-gold/20 bg-black/20 px-2 py-0.5"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#5bbd7a]" />Northern Europe</span>
            <span className="rounded-full border border-gold/20 bg-black/20 px-2 py-0.5"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#de8e5d]" />Asia</span>
            <span className="rounded-full border border-gold/20 bg-black/20 px-2 py-0.5"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#d66f6f]" />Africa</span>
          </div>
          <div className="mt-4 h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeline.data} layout="vertical" margin={{ left: 16, right: 20, top: 8, bottom: 8 }}>
                <XAxis
                  type="number"
                  domain={[0, Math.max(1, timelineSpan)]}
                  tickFormatter={(value: number) => formatYear(timeline.meta.minYear + value)}
                  tick={{ fill: '#b8a27b', fontSize: 10 }}
                  stroke="#b8a27b"
                />
                <YAxis type="category" dataKey="name" width={150} tick={{ fill: '#d9c39b', fontSize: 10 }} />
                <Tooltip
                  formatter={
                    (_value: number, _name: string, entry: { payload?: { startYear?: number; endYear?: number; mythCount?: number } }) => {
                      const payload = entry.payload;
                      if (!payload) return ['', ''];
                      return [
                        `${formatYear(payload.startYear || 0)} -> ${formatYear(payload.endYear || 0)}`,
                        `${payload.mythCount || 0} mit`,
                      ];
                    }
                  }
                  contentStyle={{ background: '#0f0b08', border: '1px solid rgba(201,168,76,.3)' }}
                />
                <Bar dataKey="startOffset" stackId="timeline" fill="rgba(0,0,0,0)" />
                <Bar dataKey="duration" stackId="timeline" fill="#cfad5d" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={1200}>
                  {timeline.data.map((item) => (
                    <Cell key={item.id} fill={regionColor(item.region)} />
                  ))}
                  <LabelList dataKey="mythCount" position="right" className="fill-[#d8c39a]" fontSize={10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="ancient-card p-5">
          <h2 className="text-xl text-gold">Sites by protection status</h2>
          <div className="mt-4 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={archaeologyProtection}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={56}
                  outerRadius={110}
                  paddingAngle={2}
                  isAnimationActive
                  animationDuration={900}
                >
                  {archaeologyProtection.map((item, index) => (
                    <Cell key={item.status} fill={PIE_COLORS[(index + 2) % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value} site`, protectionLabel(name)]}
                  contentStyle={{ background: '#0f0b08', border: '1px solid rgba(201,168,76,.3)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="ancient-card p-5">
          <h2 className="text-xl text-gold">Excavation activity by decade</h2>
          <div className="mt-4 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={excavationByDecade} margin={{ left: 6, right: 14, top: 8, bottom: 12 }}>
                <XAxis dataKey="decade" stroke="#b8a27b" tick={{ fill: '#b8a27b', fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={54} />
                <YAxis stroke="#b8a27b" tick={{ fill: '#b8a27b', fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => [`${value} kazi kaydi`, 'Kampanya']}
                  contentStyle={{ background: '#0f0b08', border: '1px solid rgba(201,168,76,.3)' }}
                />
                <Bar dataKey="count" fill="#78b9e8" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="ancient-card p-5">
          <h2 className="text-xl text-gold">Artifacts by current country (choropleth)</h2>
          <p className="mt-1 text-xs text-foreground/60">Muze koleksiyonlarindaki yaklasik eser dagilimi.</p>
          <div className="mt-4">
            <ArtifactCountryChoropleth data={artifactsByCountry} />
          </div>
        </article>

        <article className="ancient-card p-5">
          <h2 className="text-xl text-gold">Most artifact-rich mythologies</h2>
          <div className="mt-4 h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={artifactRichMythologies} layout="vertical" margin={{ left: 16, right: 20, top: 8, bottom: 8 }}>
                <XAxis type="number" stroke="#b8a27b" tick={{ fill: '#b8a27b', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={138} tick={{ fill: '#d9c39b', fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number, name: string, entry: { payload?: { siteCount?: number } }) => {
                    if (name === 'artifactCount') {
                      return [`${value} eser`, `${entry.payload?.siteCount || 0} site`];
                    }
                    return [String(value), name];
                  }}
                  contentStyle={{ background: '#0f0b08', border: '1px solid rgba(201,168,76,.3)' }}
                />
                <Bar dataKey="artifactCount" fill="#cfad5d" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={950} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </>
  );
}
