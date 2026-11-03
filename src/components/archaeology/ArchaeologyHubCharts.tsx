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
        <h2 className="text-2xl text-gold">Keşif Zaman Çizelgesi</h2>
        <p className="meta-text mt-1 text-sm">1700-sonrası büyük keşif ve kazı kampanyaları.</p>
        <div className="mt-4 h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 16, right: 18, bottom: 16, left: 8 }}>
              <XAxis type="number" dataKey="year" domain={[1700, 'dataMax']} stroke="var(--color-chart-axis-warm)" tick={{ fill: 'var(--color-chart-axis-warm)', fontSize: 11 }} />
              <YAxis type="number" dataKey="regionIdx" stroke="var(--color-chart-axis-warm)" tick={{ fill: 'var(--color-chart-axis-warm)', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                cursor={{ stroke: 'rgb(var(--rgb-gold) / 0.35)' }}
                contentStyle={{ background: 'var(--color-chart-tooltip-bg)', border: '1px solid rgb(var(--rgb-gold) / 0.3)' }}
                formatter={(_value: number, _name: string, payload: { payload?: { siteName?: string; excavator?: string; finding?: string; region?: string } }) => {
                  const row = payload.payload;
                  if (!row) return ['', ''];
                  return [row.finding || '', `${row.siteName || ''} · ${row.excavator || ''} · ${row.region || ''}`];
                }}
              />
              <Scatter data={excavationTimeline} fill="var(--color-gold-glow)" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="ancient-card p-6">
        <h2 className="text-2xl text-gold">Arkeoloji Özeti</h2>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={protectionStats}>
                <XAxis dataKey="status" stroke="var(--color-chart-axis-warm)" tick={{ fill: 'var(--color-chart-axis-warm)', fontSize: 11 }} />
                <YAxis stroke="var(--color-chart-axis-warm)" tick={{ fill: 'var(--color-chart-axis-warm)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--color-chart-tooltip-bg)', border: '1px solid rgb(var(--rgb-gold) / 0.3)' }} />
                <Bar dataKey="count" fill="var(--color-chart-gold)">
                  {protectionStats.map((item, index) => (
                    <Cell key={item.status} fill={index % 2 === 0 ? 'var(--color-chart-gold)' : 'var(--color-chart-blue-soft)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-md border border-gold/20 bg-black/20 p-4 text-sm text-foreground/75">
            <p>
              Bu merkez, kutsal alanları sadece konum verisi değil; kazı tarihi, eser dağılımı, yazıt kayıtları ve
              müze bağlantılarıyla birlikte arkeolojik bir bilgi katmanı olarak sunar.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
