import { ImageResponse } from 'next/og';
import { deities, mythologies, myths, sacredSites } from '@/lib/myth-data';

export const runtime = 'edge';

interface OgRouteParams {
  params: {
    entity: string;
    id: string;
  };
}

function resolveEntity(entity: string, id: string): { title: string; subtitle: string; image: string } {
  if (entity === 'mythology') {
    const item = mythologies.find((mythology) => mythology.id === id);
    if (item) return { title: item.name, subtitle: item.region, image: item.imageUrl };
  }

  if (entity === 'myth') {
    const item = myths.find((myth) => myth.id === id);
    if (item) return { title: item.name, subtitle: 'Myth', image: item.imageUrl };
  }

  if (entity === 'deity') {
    const item = deities.find((deity) => deity.id === id);
    if (item) return { title: item.name, subtitle: 'Deity', image: item.imageUrl };
  }

  if (entity === 'site') {
    if (id === 'default') {
      return {
        title: 'MythAtlas',
        subtitle: 'Interactive Mythology Atlas',
        image: mythologies[0]?.imageUrl || '',
      };
    }
    const item = sacredSites.find((site) => site.id === id);
    if (item) return { title: item.name, subtitle: 'Sacred Site', image: item.imageUrl };
  }

  return {
    title: 'MythAtlas',
    subtitle: 'Interactive Mythology Atlas',
    image: mythologies[0]?.imageUrl || '',
  };
}

export async function GET(_request: Request, { params }: OgRouteParams) {
  const data = resolveEntity(params.entity, params.id);

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background: '#0d0a07',
          color: '#f4e4c1',
        }}
      >
        {data.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.image}
            alt={data.title}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : null}

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
