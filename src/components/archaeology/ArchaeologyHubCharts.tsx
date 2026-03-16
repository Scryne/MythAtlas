'use client';

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ExcavationTimelineRow {
  siteName: string;
  year: number;
  region: string;
  regionIdx: number;
  excavator: string;
  finding: string;
}

interface ProtectionStatRow {
  status: string;
  count: number;
}

interface ArchaeologyHubChartsProps {
  excavationTimeline: ExcavationTimelineRow[];
  protectionStats: ProtectionStatRow[];
}

export default function ArchaeologyHubCharts({
  excavationTimeline,
  protectionStats,
}: ArchaeologyHubChartsProps) {
  return (
    <>
      <section className="ancient-card p-6">
        <h2 className="text-2xl text-gold">Timeline of Discovery</h2>
        <p className="meta-text mt-1 text-sm">1700-sonrasi buyuk kesif ve kazi kampanyalari.</p>
        <div className="mt-4 h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 16, right: 18, bottom: 16, left: 8 }}>
              <XAxis type="number" dataKey="year" domain={[1700, 'dataMax']} stroke="#c3ae82" tick={{ fill: '#c3ae82', fontSize: 11 }} />
              <YAxis type="number" dataKey="regionIdx" stroke="#c3ae82" tick={{ fill: '#c3ae82', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                cursor={{ stroke: 'rgba(201,168,76,0.35)' }}
                contentStyle={{ background: '#0f0b08', border: '1px solid rgba(201,168,76,.3)' }}
                formatter={(_value: number, _name: string, payload: { payload?: { siteName?: string; excavator?: string; finding?: string; region?: string } }) => {
                  const row = payload.payload;
                  if (!row) return ['', ''];
                  return [row.finding || '', `${row.siteName || ''} · ${row.excavator || ''} · ${row.region || ''}`];
                }}
              />
              <Scatter data={excavationTimeline} fill="#f0d58d" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="ancient-card p-6">
        <h2 className="text-2xl text-gold">Archaeology Snapshot</h2>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={protectionStats}>
                <XAxis dataKey="status" stroke="#c3ae82" tick={{ fill: '#c3ae82', fontSize: 11 }} />
                <YAxis stroke="#c3ae82" tick={{ fill: '#c3ae82', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#0f0b08', border: '1px solid rgba(201,168,76,.3)' }} />
                <Bar dataKey="count" fill="#cfad5d">
                  {protectionStats.map((item, index) => (
                    <Cell key={item.status} fill={index % 2 === 0 ? '#cfad5d' : '#7bb2dd'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-md border border-gold/20 bg-black/20 p-4 text-sm text-foreground/75">
            <p>
              Bu merkez, kutsal alanlari sadece konum verisi degil; kazi tarihi, eser dagilimi, inscription kayitlari ve
              muze baglantilariyla birlikte arkeolojik bir bilgi katmani olarak sunar.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
