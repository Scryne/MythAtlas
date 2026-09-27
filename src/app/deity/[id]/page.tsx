import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AncientImage from '@/components/common/AncientImage';
import CitationGeneratorButton from '@/components/CitationGeneratorButton';
import { IncrementDiscoveryCounter } from '@/components/common/DiscoveryTracker';
import HoverPrefetchLink from '@/components/common/HoverPrefetchLink';
import BackButton from '@/components/ui/BackButton';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { LAST_UPDATED_LABEL } from '@/lib/academic-utils';
import {
  deities,
  deityById,
  getDeity,
  getMyth,
  mythologyById,
  sacredSites,
  siteDeityIds,
  siteProtectionStatus,
} from '@/lib/myth-data';
import {
  deityEquivalentCultureCount,
  deityTypeLabel,
  domainIcon,
  formatSlugLabel,
  mythTypeLabel,
  parseEraRange,
  siteTypeLabel,
} from '@/lib/myth-utils';

interface DeityPageProps {
  params: {
    id: string;
  };
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mythatlas.app';

interface EquivalentCard {
  id: string;
  name: string;
  mythologyName: string;
  mythologyId?: string;
  domains: string[];
  description?: string;
  isPlaceholder: boolean;
}

function symbolEmoji(symbol: string): string {
  const normalized = symbol.toLowerCase();
  if (normalized.includes('sun')) return '?';
  if (normalized.includes('moon')) return '?';
  if (normalized.includes('thunder') || normalized.includes('lightning')) return '?';
  if (normalized.includes('sea') || normalized.includes('water')) return '??';
  if (normalized.includes('spear') || normalized.includes('sword')) return '??';
  if (normalized.includes('owl')) return '??';
  if (normalized.includes('serpent') || normalized.includes('snake')) return '??';
  if (normalized.includes('fire')) return '??';
  if (normalized.includes('tree')) return '??';
  return '?';
}

function toEquivalentCards(baseDeityId: string, equivalentIds: string[]): EquivalentCard[] {
  const direct = equivalentIds.map((id) => {
    const record = deityById.get(id);
    if (!record) {
      return {
        id,
        name: formatSlugLabel(id),
        mythologyName: 'Cross-cultural equivalent',
        domains: [],
        isPlaceholder: true,
      };
    }
    const parent = mythologyById.get(record.mythologyId);
    return {
      id: record.id,
      name: record.name,
      mythologyName: parent?.name || record.mythologyId,
      mythologyId: parent?.id,
      domains: record.domain,
      description: record.description,
      isPlaceholder: false,
    };
  });

  const reverse = deities
    .filter((item) => item.id !== baseDeityId && item.equivalents.includes(baseDeityId))
    .map((item) => {
      const parent = mythologyById.get(item.mythologyId);
      return {
        id: item.id,
        name: item.name,
        mythologyName: parent?.name || item.mythologyId,
        mythologyId: parent?.id,
        domains: item.domain,
        description: item.description,
        isPlaceholder: false,
      };
    });

  const merged = [...direct, ...reverse];
  const seen = new Set<string>();
  return merged.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}



export function generateStaticParams() {
  return deities.map((item) => ({ id: item.id }));
}

export function generateMetadata({ params }: DeityPageProps): Metadata {
  const deity = getDeity(params.id);
  if (!deity) {
    return {
      title: 'Deity Not Found',
      description: 'This deity entry could not be found in MythAtlas.',
    };
  }

  const mythology = mythologyById.get(deity.mythologyId);

  return {
    title: deity.name,
    description: deity.description,
    keywords: [deity.name, ...deity.domain, mythology?.name || '', 'deity', 'mythology'].filter(Boolean),
    alternates: { canonical: `/deity/${deity.id}` },
    openGraph: {
      title: `${deity.name} | MythAtlas`,
      description: deity.description,
      images: [`/og/deity/${deity.id}`],
      type: 'profile',
      url: `${SITE_URL}/deity/${deity.id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${deity.name} | MythAtlas`,
      description: deity.description,
      images: [`/og/deity/${deity.id}`],
    },
  };
}

export default function DeityDetailPage({ params }: DeityPageProps) {
  const deity = getDeity(params.id);
  if (!deity) notFound();

  const mythology = mythologyById.get(deity.mythologyId);
  const myths = deity.myths
    .map((id) => getMyth(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => b.parallels.length + b.themes.length - (a.parallels.length + a.themes.length));

  const equivalents = toEquivalentCards(deity.id, deity.equivalents);
  const worshipSites = sacredSites.filter((site) => siteDeityIds(site).includes(deity.id));
  const archaeologyEvidence = worshipSites
    .filter((site) => Boolean(site.archaeology))
    .map((site) => {
      const artifacts = site.archaeology?.artifacts || [];
      const deityTerm = deity.name.toLowerCase();
      const ranked = artifacts
        .map((artifact) => {
          const text = `${artifact.name} ${artifact.description} ${artifact.mythologicalSignificance}`.toLowerCase();
          return {
            artifact,
            relevance: text.includes(deityTerm) ? 1 : 0,
          };
        })
        .sort((a, b) => b.relevance - a.relevance);
      return {
        site,
        protection: siteProtectionStatus(site),
        artifacts: ranked.slice(0, 2).map((item) => item.artifact),
      };
    })
    .slice(0, 8);
  const equivalentCultures = deityEquivalentCultureCount(deity, deities);
  const archetype = equivalentCultures >= 4;
  const sourceCount = myths.reduce(
    (acc, myth) => {
      (myth.academicSources || []).forEach((source) => {
        if (source.type === 'primary') acc.primary += 1;
        if (source.type === 'secondary') acc.secondary += 1;
      });
      return acc;
    },
    { primary: 0, secondary: 0 }
  );
  const primarySources = Array.from(
    new Map(
      myths
        .flatMap((myth) => (myth.academicSources || []).filter((source) => source.type === 'primary'))
        .map((source) => [source.id, source])
    ).values()
  );

  const worshipRange = parseEraRange(deity.era);
  const timelineMin = -4000;
  const timelineMax = new Date().getUTCFullYear();
  const timelineSpan = timelineMax - timelineMin;
  const startPct = ((worshipRange.startYear - timelineMin) / timelineSpan) * 100;
  const endPct = ((worshipRange.endYear - timelineMin) / timelineSpan) * 100;

  const center = { x: 210, y: 210 };
  const orbitRadius = 146;
  const constellationNodes = equivalents.slice(0, 8).map((item, index, arr) => {
    const angle = ((Math.PI * 2) / Math.max(arr.length, 1)) * index - Math.PI / 2;
    return {
      ...item,
      x: center.x + orbitRadius * Math.cos(angle),
      y: center.y + orbitRadius * Math.sin(angle),
    };
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'MythAtlas',
        url: SITE_URL,
      },
      {
        '@type': 'Article',
        headline: deity.name,
        description: deity.description,
        image: deity.imageUrl,
        url: `${SITE_URL}/deity/${deity.id}`,
        keywords: deity.domain.join(', '),
      },
      {
        '@type': 'Person',
        name: deity.name,
        alternateName: deity.alternateNames,
        description: deity.description,
      },
    ],
  };

  return (
    <>
      <IncrementDiscoveryCounter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="hero-vignette relative min-h-[52vh] overflow-hidden">
        <AncientImage
          src={deity.imageUrl}
          alt={deity.name}
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/65 to-background" />
        <div className="relative z-10 section-container flex min-h-[52vh] flex-col justify-between pb-10 pt-20">
          <div className="flex flex-col gap-4 pt-4 md:flex-row md:items-center md:justify-between">
            <Breadcrumbs
              items={[
                { label: 'Ana Sayfa', href: '/' },
                { label: mythology?.name || deity.mythologyId, href: mythology ? `/mythology/${mythology.id}` : undefined },
                { label: 'Tanrilar', href: mythology ? `/mythology/${mythology.id}` : undefined },
                { label: deity.name },
              ]}
            />
            <BackButton />
          </div>
          <div className="mt-auto">
            <p className="meta-text mb-3 text-xs uppercase tracking-[0.2em]">Deity Profile</p>
            <h1 className="text-4xl text-gold md:text-6xl">{deity.name}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-gold/35 bg-black/45 px-3 py-1 text-xs text-gold-light">
              {deityTypeLabel(deity.type)}
            </span>
            <span className="rounded-full border border-gold/35 bg-black/45 px-3 py-1 text-xs text-gold-light">
              {equivalentCultures} kulturde benzeri var
            </span>
            {archetype && (
              <span className="rounded-full border border-[#e3c169]/45 bg-[#2f1f0f]/75 px-3 py-1 text-xs text-[#f6dfab]">
                Arketip Tanri
              </span>
            )}
            {mythology && (
              <HoverPrefetchLink
                href={`/mythology/${mythology.id}`}
                className="rounded-full border border-gold/35 bg-black/45 px-3 py-1 text-xs text-gold-light hover:bg-black/60"
              >
                {mythology.name}
              </HoverPrefetchLink>
            )}
            <CitationGeneratorButton
              entryTitle={deity.name}
              entryKind="deity"
              entryUrl={`${SITE_URL}/deity/${deity.id}`}
              primarySources={primarySources}
            />
            </div>
            {deity.alternateNames.length > 0 && (
              deity.alternateNames.length <= 3 ? (
                <p className="mt-4 text-sm text-foreground/75">Also known as: {deity.alternateNames.join(', ')}</p>
              ) : (
                <details className="mt-4 max-w-3xl rounded-md border border-gold/20 bg-black/20 p-3 text-sm text-foreground/75">
                  <summary className="cursor-pointer text-gold-light">{deity.alternateNames.slice(0, 3).join(', ')} + {deity.alternateNames.length - 3} daha</summary>
                  <p className="mt-3">Also known as: {deity.alternateNames.join(', ')}</p>
                </details>
              )
            )}
          </div>
        </div>
      </section>

      <section className="section-container space-y-6 py-8">
        <div className="ancient-card p-6">
          <h2 className="mb-3 text-2xl text-gold">Description</h2>
          <p className="leading-relaxed text-foreground/80">{deity.description}</p>
        </div>

        <div className="ancient-card p-6">
          <h3 className="mb-4 text-xl text-gold">Domains</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {deity.domain.map((domain) => (
              <div
                key={domain}
                title={`${deity.name}: ${formatSlugLabel(domain)} guc alani`}
                className="rounded-md border border-gold/20 bg-gold/5 p-3 text-center"
              >
                <p className="text-2xl text-gold-light">{domainIcon(domain)}</p>
                <p className="mt-2 text-xs text-foreground/75">{formatSlugLabel(domain)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="ancient-card p-6">
          <h3 className="mb-4 text-xl text-gold">Tapinilan donem</h3>
          <div className="rounded-md border border-gold/20 bg-black/20 p-4">
            <div className="relative h-3 rounded-full bg-[#2a1f13]">
              <div
                className="absolute h-3 rounded-full bg-[linear-gradient(90deg,#7ad7f4,#f1d58d)]"
                style={{ left: `${Math.max(0, startPct)}%`, width: `${Math.max(1, endPct - startPct)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-foreground/55">
              <span>{worshipRange.startYear}</span>
              <span>{worshipRange.endYear}</span>
            </div>
            <p className="mt-2 text-xs text-foreground/65">{deity.era}</p>
          </div>
        </div>

        <div className="ancient-card p-6">
          <h3 className="mb-4 text-xl text-gold">Appears in Myths</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {myths.map((myth) => (
              <HoverPrefetchLink key={myth.id} href={`/myth/${myth.id}`} className="rounded-md border border-gold/20 bg-gold/5 p-3">
                <p className="text-gold-light">{myth.name}</p>
                <p className="meta-text text-xs uppercase tracking-[0.12em]">{mythTypeLabel(myth.type)}</p>
                <p className="mt-2 text-xs text-foreground/60">Paralel bag: {myth.parallels.length}</p>
              </HoverPrefetchLink>
            ))}
            {myths.length === 0 && <p className="text-sm text-foreground/60">No linked myths in the current dataset.</p>}
          </div>
        </div>

        {equivalents.length > 0 && (
        <div className="ancient-card p-6">
          <h3 className="mb-2 text-2xl text-gold">Divine Equivalents Constellation</h3>
          <p className="mb-4 text-foreground/75">Merkezde ana tanri, cevresinde kulturler arasi esdegerleri.</p>

          <div className="overflow-x-auto rounded-md border border-gold/20 bg-black/20 p-3">
            <svg viewBox="0 0 420 420" className="mx-auto h-[420px] w-[420px]">
              {constellationNodes.map((item) => (
                <line
                  key={`line-${item.id}`}
                  x1={center.x}
                  y1={center.y}
                  x2={item.x}
                  y2={item.y}
                  stroke="rgba(201,168,76,0.38)"
                  strokeWidth={1.2}
                />
              ))}

              <circle cx={center.x} cy={center.y} r={34} fill="rgba(201,168,76,0.22)" stroke="#f0d58d" strokeWidth={1.8} />
              <text x={center.x} y={center.y + 4} textAnchor="middle" fill="#f4deaa" fontSize="11">
                {deity.name.slice(0, 12)}
              </text>

              {constellationNodes.map((item) => (
                <g key={item.id}>
                  <circle cx={item.x} cy={item.y} r={22} fill="rgba(122,215,244,0.18)" stroke="#8adff9" strokeWidth={1.2} />
                  <text x={item.x} y={item.y + 3} textAnchor="middle" fill="#d8eef7" fontSize="9">
                    {item.name.slice(0, 10)}
                  </text>
                  <title>{item.name}</title>
                </g>
              ))}
            </svg>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
            {equivalents.map((equivalent) => {
              const sharedDomains = equivalent.domains.filter((value) => deity.domain.includes(value));
              return (
                <div key={equivalent.id} className="rounded-md border border-gold/20 bg-black/20 p-4">
                  <p className="meta-text text-xs uppercase tracking-[0.12em]">Equivalent</p>
                  {equivalent.isPlaceholder ? (
                    <h4 className="mt-1 text-xl text-gold-light">{equivalent.name}</h4>
                  ) : (
                    <HoverPrefetchLink href={`/deity/${equivalent.id}`} className="mt-1 block text-xl text-gold-light hover:text-gold">
                      {equivalent.name}
                    </HoverPrefetchLink>
                  )}
                  <p className="meta-text text-sm">
                    {equivalent.mythologyId ? (
                      <HoverPrefetchLink href={`/mythology/${equivalent.mythologyId}`} className="hover:text-gold-light">
                        {equivalent.mythologyName}
                      </HoverPrefetchLink>
                    ) : (
                      equivalent.mythologyName
                    )}
                  </p>
                  {sharedDomains.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {sharedDomains.map((domain) => (
                        <span
                          key={`${equivalent.id}-${domain}`}
                          className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] text-gold-light"
                        >
                          Shared: {formatSlugLabel(domain)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="meta-text mt-3 text-xs">No direct domain overlap indexed.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        )}

        <div className="ancient-card p-6">
          <h3 className="mb-3 text-xl text-gold">Ikonografi</h3>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {deity.symbols.map((symbol) => (
              <div key={symbol} className="rounded-md border border-gold/25 bg-gold/10 p-3">
                <p className="text-lg text-gold-light">{symbolEmoji(symbol)} {formatSlugLabel(symbol)}</p>
                <p className="mt-1 text-xs text-foreground/60">
                  Bu sembol, {deity.name} figuruyle iliskilendirilen rituel veya temsil alanini ifade eder.
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="ancient-card p-6">
          <h3 className="mb-4 text-xl text-gold">Tapinaklar ve Arkeolojik Kanitlar</h3>
          {archaeologyEvidence.length === 0 ? (
            <p className="text-sm text-foreground/60">
              Bu tanri icin arkeolojik kazi kaydi bagli bir tapinak bulunmuyor.
            </p>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {archaeologyEvidence.map((entry) => (
                <article key={entry.site.id} className="rounded-md border border-gold/20 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <HoverPrefetchLink href={`/site/${entry.site.id}`} className="text-gold-light hover:text-gold">
                      {entry.site.name}
                    </HoverPrefetchLink>
                    <span className="text-xs text-foreground/60">{entry.site.country || 'Unknown'}</span>
                  </div>
                  {entry.protection === 'UNESCO' && (
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                      <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-gold-light">UNESCO Dünya Mirası</span>
                    </div>
                  )}
                  {entry.artifacts.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {entry.artifacts.map((artifact) => (
                        <div key={`${entry.site.id}-${artifact.id}`} className="rounded-md border border-gold/15 bg-black/20 p-2">
                          <p className="text-sm text-gold-light">{artifact.name}</p>
                          <p className="text-xs text-foreground/70">{artifact.period} · {artifact.currentLocation}</p>
                          <p className="mt-1 text-xs text-foreground/65">{artifact.mythologicalSignificance}</p>
                          {artifact.museumUrl && (
                            <a
                              href={artifact.museumUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex rounded-full border border-gold/30 px-2 py-0.5 text-[11px] text-gold-light hover:bg-gold/10"
                            >
                              Muzede gor
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-foreground/60">Bu alanda eser karti henuz eklenmedi.</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="ancient-card p-6">
          <h3 className="mb-4 text-xl text-gold">Worshipped At</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {worshipSites.map((site) => (
              <HoverPrefetchLink key={site.id} href={`/site/${site.id}`} className="rounded-md border border-gold/20 bg-gold/5 p-3">
                <p className="text-gold-light">{site.name}</p>
                <p className="meta-text text-xs uppercase tracking-[0.12em]">
                  {siteTypeLabel(site.type)} · {site.country || 'Unknown'}
                </p>
              </HoverPrefetchLink>
            ))}
            {worshipSites.length === 0 && <p className="text-sm text-foreground/60">No worship site links are indexed yet.</p>}
          </div>
        </div>

        <footer className="rounded-md border border-gold/20 bg-black/20 p-4 text-sm text-foreground/75">
          Bu sayfadaki bilgiler {sourceCount.primary} birincil, {sourceCount.secondary} ikincil
          kaynaktan derlenmistir. <span className="text-gold-light">Son guncelleme:</span>{' '}
          {LAST_UPDATED_LABEL}
        </footer>
      </section>
    </>
  );
}
