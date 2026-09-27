import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AcademicSources from '@/components/AcademicSources';
import AncientImage from '@/components/common/AncientImage';
import CitationGeneratorButton from '@/components/CitationGeneratorButton';
import { IncrementDiscoveryCounter } from '@/components/common/DiscoveryTracker';
import HoverPrefetchLink from '@/components/common/HoverPrefetchLink';
import MiniWorldMap from '@/components/detail/MiniWorldMap';
import MythDNA from '@/components/MythDNA';
import SourceHighlightButton from '@/components/SourceHighlightButton';
import ShareButton from '@/components/detail/ShareButton';
import BackButton from '@/components/ui/BackButton';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import {
  deityById,
  deities,
  getParallelMythId,
  getMyth,
  mythParallelIds,
  isParallelEvidence,
  mythologyById,
  myths,
  sacredSites,
  siteMythIds,
  type MythParallelEvidence,
} from '@/lib/myth-data';
import { LAST_UPDATED_LABEL, mythSourceCounts } from '@/lib/academic-utils';
import {
  formatDNAKeyLabel,
  getMythsByDNA,
} from '@/lib/dna';
import {
  buildCharacterCards,
  formatSlugLabel,
  mythParallelCultureCount,
  mythTypeLabel,
  siteTypeLabel,
} from '@/lib/myth-utils';

interface MythPageProps {
  params: {
    id: string;
  };
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mythatlas.app';

const EMOTIONAL_CORE_TONES: Record<string, string> = {
  fear: 'border-amber-300/45 bg-amber-800/25 text-amber-100',
  hope: 'border-emerald-300/45 bg-emerald-800/25 text-emerald-100',
  love: 'border-rose-300/45 bg-rose-800/25 text-rose-100',
  grief: 'border-slate-300/45 bg-slate-800/35 text-slate-100',
  wonder: 'border-sky-300/45 bg-sky-800/25 text-sky-100',
  rage: 'border-red-300/45 bg-red-800/25 text-red-100',
  shame: 'border-violet-300/45 bg-violet-800/25 text-violet-100',
  pride: 'border-orange-300/45 bg-orange-800/25 text-orange-100',
};

const COSMIC_SCOPE_LABELS: Record<string, string> = {
  personal: 'Kisisel',
  communal: 'Topluluk',
  civilizational: 'Medeniyet',
  universal: 'Evrensel',
};

function SimilarityArc({ score }: { score: number }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;

  return (
    <svg viewBox="0 0 56 56" className="h-14 w-14">
      <circle cx="28" cy="28" r={radius} fill="none" stroke="rgba(201,168,76,0.2)" strokeWidth="6" />
      <circle
        cx="28"
        cy="28"
        r={radius}
        fill="none"
        stroke="#f0d58d"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform="rotate(-90 28 28)"
      />
      <text x="28" y="31" textAnchor="middle" fontSize="11" fill="#f6e4b8">
        {score}%
      </text>
    </svg>
  );
}

export function generateStaticParams() {
  return myths.map((item) => ({ id: item.id }));
}

export function generateMetadata({ params }: MythPageProps): Metadata {
  const myth = getMyth(params.id);
  if (!myth) {
    return {
      title: 'Myth Not Found',
      description: 'This myth entry could not be found in MythAtlas.',
    };
  }

  const mythology = mythologyById.get(myth.mythologyId);

  return {
    title: myth.name,
    description: myth.summary,
    keywords: [myth.name, mythology?.name || '', myth.type, ...myth.themes.slice(0, 6)].filter(Boolean),
    alternates: { canonical: `/myth/${myth.id}` },
    openGraph: {
      title: `${myth.name} | MythAtlas`,
      description: myth.significance,
      images: [`/og/myth/${myth.id}`],
      type: 'article',
      url: `${SITE_URL}/myth/${myth.id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${myth.name} | MythAtlas`,
      description: myth.summary,
      images: [`/og/myth/${myth.id}`],
    },
  };
}

export default function MythDetailPage({ params }: MythPageProps) {
  const myth = getMyth(params.id);
  if (!myth) notFound();

  const mythology = mythologyById.get(myth.mythologyId);
  const characterCards = buildCharacterCards(myth, deities);
  const parallelIds = mythParallelIds(myth);
  const parallelEntries = (myth.parallels || [])
    .map((reference) => {
      const mythId = getParallelMythId(reference);
      const linked = myths.find((item) => item.id === mythId);
      if (!linked) return null;
      return {
        myth: linked,
        evidence: isParallelEvidence(reference) ? reference : null,
      };
    })
    .filter(
      (item): item is { myth: (typeof myths)[number]; evidence: MythParallelEvidence | null } =>
        Boolean(item)
    );

  const sourceCounts = mythSourceCounts(myth);
  const primarySources = (myth.academicSources || []).filter((source) => source.type === 'primary');
  const dnaMatches = getMythsByDNA(myth.id, myths, 6);

  const relatedSites = sacredSites.filter((site) => siteMythIds(site).includes(myth.id));
  const archaeologyEvidence = relatedSites
    .map((site) => {
      const artifacts = site.archaeology?.artifacts || [];
      if (!artifacts.length) return null;
      const evidenceTerms = [myth.name, ...myth.characters].map((item) => item.toLowerCase());
      const ranked = artifacts
        .map((artifact) => {
          const text = `${artifact.name} ${artifact.description} ${artifact.mythologicalSignificance}`.toLowerCase();
          const relevance = evidenceTerms.reduce((score, term) => {
            if (!term.trim()) return score;
            return text.includes(term) ? score + 1 : score;
          }, 0);
          return { artifact, relevance };
        })
        .sort((a, b) => b.relevance - a.relevance);
      return {
        site,
        artifact: ranked[0].artifact,
        relevance: ranked[0].relevance,
      };
    })
    .filter(
      (
        item
      ): item is {
        site: (typeof relatedSites)[number];
        artifact: NonNullable<(typeof relatedSites)[number]['archaeology']>['artifacts'][number];
        relevance: number;
      } => Boolean(item)
    )
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 6);
  const parallelCultureCount = mythParallelCultureCount(myth, myths);
  const isUniversalStory = parallelIds.length >= 5;
  const allMapMarkers = [
    {
      id: myth.id,
      label: `${myth.name} (Primary)`,
      lat: myth.origin.lat,
      lng: myth.origin.lng,
      color: mythology?.color || '#d9bd70',
    },
    ...dnaMatches.map(({ myth: item }) => {
      const parent = mythologyById.get(item.mythologyId);
      return {
        id: item.id,
        label: `${item.name} (${parent?.name || item.mythologyId})`,
        lat: item.origin.lat,
        lng: item.origin.lng,
        color: parent?.color || '#9bb8d8',
      };
    }),
  ];

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
        headline: myth.name,
        description: myth.summary,
        image: myth.imageUrl,
        url: `${SITE_URL}/myth/${myth.id}`,
        keywords: myth.themes.join(', '),
      },
    ],
  };

  return (
    <>
      <IncrementDiscoveryCounter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="hero-vignette relative min-h-[52vh] overflow-hidden">
        <AncientImage
          src={myth.imageUrl}
          alt={myth.name}
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/60 to-background" />
        <div className="relative z-10 section-container flex min-h-[52vh] flex-col justify-between pb-10 pt-20">
          <div className="flex flex-col gap-4 pt-4 md:flex-row md:items-center md:justify-between">
            <Breadcrumbs
              items={[
                { label: 'Ana Sayfa', href: '/' },
                { label: mythology?.name || myth.mythologyId, href: mythology ? `/mythology/${mythology.id}` : undefined },
                { label: myth.name },
              ]}
            />
            <BackButton />
          </div>
          <div className="mt-auto">
            <p className="meta-text mb-3 text-xs uppercase tracking-[0.2em]">Myth Detail</p>
            <h1 className="text-4xl text-gold md:text-6xl">{myth.name}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-gold/35 bg-black/45 px-3 py-1 text-xs text-gold-light">
              {mythTypeLabel(myth.type)}
            </span>
            {isUniversalStory && (
              <span
                title="Bu hikaye dunyanin pek cok kulturunde anlatilir"
                className="rounded-full border border-[#e6c56a]/45 bg-[#322210]/75 px-3 py-1 text-xs text-[#f4dea2]"
              >
                Evrensel Hikaye
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
              entryTitle={myth.name}
              entryKind="myth"
              entryUrl={`${SITE_URL}/myth/${myth.id}`}
              primarySources={primarySources}
            />
            </div>
          </div>
        </div>
      </section>

      <section className="section-container space-y-6 py-8">
        <div className="ancient-card p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl text-gold">Full Summary</h2>
            <ShareButton title={myth.name} text={`Explore ${myth.name} on MythAtlas`} url={`${SITE_URL}/myth/${myth.id}`} />
          </div>
          <p className="mb-4 leading-relaxed text-foreground/80">{myth.summary}</p>
          <p className="leading-relaxed text-foreground/70">{myth.significance}</p>
        </div>

        <div className="ancient-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xl text-gold">🧬</span>
            <h3 className="text-2xl text-gold">Bu Mitin DNA'si</h3>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-sm ${
                EMOTIONAL_CORE_TONES[myth.dna.emotionalCore] || 'border-gold/35 bg-gold/10 text-gold-light'
              }`}
            >
              Duygusal cekirdek: {formatSlugLabel(myth.dna.emotionalCore)}
            </span>
            <span className="rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-sm text-gold-light">
              Kozmik kapsami: {COSMIC_SCOPE_LABELS[myth.dna.cosmicScope] || formatSlugLabel(myth.dna.cosmicScope)}
            </span>
          </div>
          <p className="mb-5 text-sm text-foreground/70">{myth.dna.moralLesson}</p>
          <MythDNA myth={myth} size="full" showRadar showFingerprint />
        </div>

        <div className="parchment-callout rounded-md p-5">
          <h3 className="text-lg text-gold">Bu mit neden onemli?</h3>
          <p className="mt-2 text-sm leading-7 text-foreground/80">{myth.significance}</p>
        </div>

        <div className="ancient-card p-6">
          <h3 className="mb-4 text-xl text-gold">Characters</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {characterCards.map((character) => (
              <div key={character.name} className="rounded-md border border-gold/20 bg-gold/5 p-3">
                <p className="break-words text-base text-gold-light">{character.name}</p>
                <p className="meta-text text-sm">{character.role}</p>
                {character.deityId && deityById.get(character.deityId) && (
                  <div className="mt-3 rounded-md border border-gold/25 bg-black/25 p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Bilinen tanri profili</p>
                    <p className="mt-1 text-sm text-gold-light">{deityById.get(character.deityId)?.name}</p>
                    <p className="mt-1 text-xs text-foreground/60">
                      {(deityById.get(character.deityId)?.domain || []).slice(0, 3).join(' · ')}
                    </p>
                    <HoverPrefetchLink
                      href={`/deity/${character.deityId}`}
                      className="mt-2 inline-block text-xs uppercase tracking-[0.12em] text-gold hover:text-gold-light"
                    >
                      /deity/{character.deityId}
                    </HoverPrefetchLink>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="ancient-card p-6">
          <h3 className="mb-3 text-xl text-gold">Themes</h3>
          <div className="flex flex-wrap gap-2">
            {myth.themes.map((theme) => (
              <span key={theme} className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-xs text-gold-light">
                {formatSlugLabel(theme)}
              </span>
            ))}
          </div>
        </div>

        <AcademicSources sources={myth.academicSources || []} />

        <div className="space-y-4">
          <div className="ancient-card p-6">
            <h3 className="text-2xl text-gold">Dunya genelinde benzer hikayeler</h3>
            <p className="mt-2 text-foreground/75">
              Paralel mitler, paylasilan anlati cekirdekleri ve akademik baglanti tartismalariyla birlikte sunulur.
            </p>
          </div>

          <MiniWorldMap
            title="Paralel Mit Cografyasi"
            markers={[
              {
                id: myth.id,
                label: myth.name,
                lat: myth.origin.lat,
                lng: myth.origin.lng,
                color: mythology?.color || '#d9bd70',
              },
              ...parallelEntries.map((entry) => {
                const parent = mythologyById.get(entry.myth.mythologyId);
                return {
                  id: entry.myth.id,
                  label: `${entry.myth.name} (${parent?.name || entry.myth.mythologyId})`,
                  lat: entry.myth.origin.lat,
                  lng: entry.myth.origin.lng,
                  color: parent?.color || '#8dc6de',
                };
              }),
            ]}
          />

          <div className="grid gap-4 md:grid-cols-2">
            {parallelEntries.map((entry) => {
              const parent = mythologyById.get(entry.myth.mythologyId);
              const score = entry.evidence?.similarityScore;

              return (
                <article key={entry.myth.id} className="ancient-card overflow-hidden p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg text-gold">
                        <HoverPrefetchLink href={`/myth/${entry.myth.id}`}>
                          {entry.myth.name}
                        </HoverPrefetchLink>
                      </h4>
                      <p className="meta-text text-xs uppercase tracking-[0.12em]">
                        {parent?.name || entry.myth.mythologyId}
                      </p>
                    </div>
                    {typeof score === 'number' && <SimilarityArc score={score} />}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(entry.evidence?.sharedElements || entry.myth.themes.slice(0, 3)).map((item) => (
                      <span
                        key={`${entry.myth.id}-shared-${item}`}
                        className="rounded-full border border-gold/40 bg-gold/15 px-2 py-0.5 text-[11px] text-gold-light"
                      >
                        {formatSlugLabel(item)}
                      </span>
                    ))}
                  </div>

                  {entry.evidence?.divergences && entry.evidence.divergences.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {entry.evidence.divergences.slice(0, 2).map((item) => (
                        <span
                          key={`${entry.myth.id}-div-${item}`}
                          className="rounded-full border border-gold/20 px-2 py-0.5 text-[10px] text-foreground/70"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3">
                    <SourceHighlightButton sourceIds={entry.evidence?.academicSourceIds || []} />
                  </div>
                </article>
              );
            })}
            {parallelEntries.length === 0 && (
              <div className="ancient-card p-4 text-sm text-foreground/65">
                Bu mite bagli acik paralel kaydi bulunmuyor.
              </div>
            )}
          </div>
        </div>

        {parallelEntries.length >= 3 && (
          <div className="ancient-card p-6">
            <h3 className="text-2xl text-gold">Karsilastirmali Analiz</h3>
            <p className="mt-2 text-sm text-foreground/80">
              Bu mit {parallelCultureCount} farklı kültürden {parallelEntries.length} anlatıyla ortak motif paylaşıyor.
              Benzerlik yüzdesi, iki mitin motif kümelerinin kesişiminin birleşimine oranıdır (Jaccard).
            </p>
            <div className="mt-4">
              <MiniWorldMap
                title="Paralel anlatilarin cografi yayilimi"
                markers={[
                  {
                    id: myth.id,
                    label: myth.name,
                    lat: myth.origin.lat,
                    lng: myth.origin.lng,
                    color: mythology?.color || '#d9bd70',
                  },
                  ...parallelEntries.map((entry) => ({
                    id: entry.myth.id,
                    label: entry.myth.name,
                    lat: entry.myth.origin.lat,
                    lng: entry.myth.origin.lng,
                    color: mythologyById.get(entry.myth.mythologyId)?.color || '#8dc6de',
                  })),
                ]}
              />
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="ancient-card p-6">
            <h3 className="text-2xl text-gold">DNA'ya Gore Benzer Mitler</h3>
            <p className="mt-2 text-foreground/75">
              Algoritmik DNA eslesmeleri ve akademik kaynakli paraleller ayni katmanda goruntulenir.
            </p>
          </div>

          <MiniWorldMap title="DNA Benzerlik Haritasi" markers={allMapMarkers} />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {dnaMatches.map((match) => {
              const item = match.myth;
              const parent = mythologyById.get(item.mythologyId);
              const isCurated = parallelIds.includes(item.id);
              return (
                <HoverPrefetchLink key={item.id} href={`/myth/${item.id}`} className="ancient-card overflow-hidden">
                  <div className="relative h-40">
                    <AncientImage
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="(max-width: 1280px) 50vw, 33vw"
                      className="h-full w-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                  </div>
                  <div className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-lg text-gold">{item.name}</h4>
                        <p className="meta-text text-xs uppercase tracking-[0.12em]">{parent?.name || item.mythologyId}</p>
                      </div>
                      <SimilarityArc score={match.score} />
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {match.sharedElements.slice(0, 5).map((element) => (
                        <span key={`${item.id}-element-${element}`} className="rounded-full border border-gold/35 bg-gold/15 px-2 py-0.5 text-[11px] text-gold-light">
                          {formatDNAKeyLabel(element)}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {match.sharedArchetypes.slice(0, 4).map((archetype) => (
                        <span key={`${item.id}-archetype-${archetype}`} className="rounded-full border border-gold/20 px-2 py-0.5 text-[10px] text-foreground/70">
                          {formatDNAKeyLabel(archetype)}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {isCurated ? (
                        <span className="rounded-full border border-emerald-300/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200">
                          ✓ Akademik kaynak
                        </span>
                      ) : (
                        <span className="rounded-full border border-sky-300/35 bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-200">
                          🧬 DNA eslesmesi
                        </span>
                      )}
                    </div>

                    <div className="pt-1">
                      <MythDNA myth={item} size="mini" showRadar={false} showFingerprint={false} showHoverLegend />
                    </div>
                  </div>
                </HoverPrefetchLink>
              );
            })}
            {dnaMatches.length === 0 && (
              <div className="ancient-card p-4 text-sm text-foreground/60">
                DNA tabanli benzer mit bulunamadi.
              </div>
            )}
          </div>
        </div>

        <div className="ancient-card p-6">
          <h3 className="mb-3 text-xl text-gold">Bu miti paylas</h3>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-gold/20 bg-black/20 p-3 text-sm text-foreground/75">
              Biliyor muydunuz? {myth.name} mitiyle benzer hikaye {parallelCultureCount} farkli kulturde anlatiliyor.
            </div>
            <div className="rounded-md border border-gold/20 bg-black/20 p-3 text-sm text-foreground/75">
              {myth.name}: {mythTypeLabel(myth.type)} anlatilarin evrensel temasini guclu bicimde tasiyan bir metin.
            </div>
            <div className="rounded-md border border-gold/20 bg-black/20 p-3 text-sm text-foreground/75">
              MythAtlas notu: {myth.name} hikayesi, mitler arasi baglanti aginda onemli bir dugum olusturuyor.
            </div>
          </div>
        </div>

        <div className="ancient-card p-6">
          <h3 className="mb-4 text-xl text-gold">Arkeolojik Kanit</h3>
          {archaeologyEvidence.length === 0 ? (
            <p className="text-sm text-foreground/60">
              Bu mite bagli arkeolojik eser kaydi henuz eklenmedi.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {archaeologyEvidence.map((item) => (
                <article key={`${item.site.id}-${item.artifact.id}`} className="rounded-md border border-gold/20 bg-gold/5 p-4">
                  <HoverPrefetchLink href={`/site/${item.site.id}`} className="text-gold-light hover:text-gold">
                    {item.site.name}
                  </HoverPrefetchLink>
                  <p className="mt-2 text-sm text-foreground/80">{item.artifact.name}</p>
                  <p className="meta-text text-xs uppercase tracking-[0.12em]">
                    {item.artifact.period} · {item.artifact.type}
                  </p>
                  <p className="mt-2 text-xs text-foreground/70">{item.artifact.mythologicalSignificance}</p>
                  <p className="mt-2 text-xs text-foreground/65">{item.artifact.currentLocation}</p>
                  {item.artifact.museumUrl && (
                    <a
                      href={item.artifact.museumUrl}
                      target="_blank"
                            rel="noopener noreferrer"
                      className="mt-3 inline-flex rounded-full border border-gold/35 px-3 py-1 text-xs text-gold-light hover:bg-gold/10"
                    >
                      Muzede gor
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="ancient-card p-6">
          <h3 className="mb-4 text-xl text-gold">Related Sacred Sites</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {relatedSites.map((site) => (
              <HoverPrefetchLink key={site.id} href={`/site/${site.id}`} className="rounded-md border border-gold/20 bg-gold/5 p-3">
                <p className="text-gold-light">{site.name}</p>
                <p className="meta-text text-xs uppercase tracking-[0.12em]">
                  {siteTypeLabel(site.type)} · {site.country || 'Unknown'}
                </p>
              </HoverPrefetchLink>
            ))}
            {relatedSites.length === 0 && (
              <p className="text-sm text-foreground/60">No sacred site links are indexed for this myth yet.</p>
            )}
          </div>
        </div>

        <footer className="rounded-md border border-gold/20 bg-black/20 p-4 text-sm text-foreground/75">
          Bu sayfadaki bilgiler {sourceCounts.primary} birincil, {sourceCounts.secondary} ikincil
          kaynaktan derlenmistir. <span className="text-gold-light">Son guncelleme:</span>{' '}
          {LAST_UPDATED_LABEL}
        </footer>

        <div className="pt-2">
          <HoverPrefetchLink
            href={mythology ? `/mythology/${mythology.id}` : '/map'}
            className="inline-flex rounded-full border border-gold/40 px-4 py-2 text-xs uppercase tracking-[0.14em] text-gold hover:bg-gold/10"
          >
            Back to Mythology
          </HoverPrefetchLink>
        </div>
      </section>
    </>
  );
}

