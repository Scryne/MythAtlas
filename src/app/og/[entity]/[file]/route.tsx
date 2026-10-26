import { ImageResponse } from 'next/og';
import { deities, mythologies, myths, sacredSites } from '@/lib/myth-data';

// Paylaşım kartları derleme anında `og/<varlık>/<kimlik>.png` olarak üretilir (statik site, GitHub Pages).
// Fotoğraf gömülmez: kart başına ~1–2 MB ve her derlemede Wikimedia'ya 510 istek demekti; markalı metin kartı
// her derlemede aynı çıkar ve ~40 KB'dır.
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return [
    { entity: 'site', file: 'default.png' },
    ...mythologies.map((item) => ({ entity: 'mythology', file: `${item.id}.png` })),
    ...myths.map((item) => ({ entity: 'myth', file: `${item.id}.png` })),
    ...deities.map((item) => ({ entity: 'deity', file: `${item.id}.png` })),
    ...sacredSites.map((item) => ({ entity: 'site', file: `${item.id}.png` })),
  ];
}

interface OgRouteParams {
  params: Promise<{
    entity: string;
    file: string;
  }>;
}

function resolveEntity(entity: string, id: string): { title: string; subtitle: string } {
  if (entity === 'mythology') {
    const item = mythologies.find((mythology) => mythology.id === id);
    if (item) return { title: item.name, subtitle: item.region };
  }

  if (entity === 'myth') {
    const item = myths.find((myth) => myth.id === id);
    if (item) return { title: item.name, subtitle: 'Mit' };
  }

  if (entity === 'deity') {
    const item = deities.find((deity) => deity.id === id);
    if (item) return { title: item.name, subtitle: 'Tanrı' };
  }

  if (entity === 'site') {
    if (id === 'default') {
      return {
        title: 'MythAtlas',
        subtitle: 'İnteraktif Mitoloji Atlası',
      };
    }
    const item = sacredSites.find((site) => site.id === id);
    if (item) return { title: item.name, subtitle: 'Kutsal Alan' };
  }

  return {
    title: 'MythAtlas',
    subtitle: 'İnteraktif Mitoloji Atlası',
  };
}

export async function GET(_request: Request, props: OgRouteParams) {
  const params = await props.params;
  const data = resolveEntity(params.entity, params.file.replace(/\.png$/, ''));

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background: 'radial-gradient(circle at 18% 12%, rgba(201,168,76,0.30) 0%, rgba(13,10,7,1) 58%)',
          color: '#f4e4c1',
        }}
      >

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(9,7,5,0.35) 0%, rgba(9,7,5,0.86) 68%, rgba(9,7,5,0.95) 100%)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '54px 64px',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 24,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#c9a84c',
            }}
          >
            {data.subtitle}
          </p>
          <h1
            style={{
              margin: '12px 0 0 0',
              fontSize: 72,
              lineHeight: 1.08,
              maxWidth: '92%',
              color: '#f4e4c1',
            }}
          >
            {data.title}
          </h1>
          <p style={{ margin: '20px 0 0 0', fontSize: 26, letterSpacing: '0.1em', color: '#c9a84c' }}>
            MythAtlas
          </p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
