// public/data/ altındaki herkese açık veri dosyalarını src/data'dan üretir (harita bunları okur).
// Eskiden elle üretilmişti ve kaynaktan kopmuştu: 2 mit, 10 tanrı ve 7 mitoloji eksikti,
// deities.geojson'da bozuk karakterler ("MÃ– 800") vardı. Bu betik tek kaynaktan türetir;
// qa/data-integrity-check.mjs çıktının güncel olduğunu denetler.
//
// Kullanım: node scripts/build-public-data.mjs [--check]
//   --check: dosya yazmaz; public/data src/data ile uyuşmuyorsa 1 ile çıkar.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = (p) => path.join(root, 'src/data', p);
const out = (p) => path.join(root, 'public/data', p);
const read = async (p) => JSON.parse((await readFile(p, 'utf-8')).replace(/^﻿/, ''));
const check = process.argv.includes('--check');

const mythologies = await read(src('mythologies.json'));
const myths = await read(src('myths.json'));
const deities = await read(src('deities.json'));
const sites = await read(src('sacred-sites.json'));
const cultures = await read(src('cultures.json'));
const mythologyById = new Map(mythologies.map((m) => [m.id, m]));

// Dönem metninden kova yılı: "MÖ 800" → -800, "MS 200 – MS 1100" → 1100, "MS 700 – present" → bugün.
// (Önceki elle üretilmiş dosyaların kuralı; harita filtreleri buna göre kurulu.)
function lastYear(era) {
  const text = String(era ?? '');
  const years = [...text.matchAll(/(MÖ|MS|BCE|CE)?\s*(\d{1,5})\s*(BCE|CE)?/gi)].map((m) => {
    const bce = /MÖ|BCE/i.test(m[1] ?? '') || /BCE/i.test(m[3] ?? '');
    return bce ? -Number(m[2]) : Number(m[2]);
  });
  // MÖ'de başlayan dönem antik sayılır; MS'de başlayan dönem son yılına göre ("present" = bugün).
  if (years.length && years[0] < 0) return years[0];
  if (/present|günümüz/i.test(text)) return new Date().getFullYear();
  return years.length ? years[years.length - 1] : 0;
}

function eraBucket(era) {
  const y = lastYear(era);
  if (y < 500) return 'ancient';
  if (y < 1500) return 'medieval';
  return 'modern';
}

const point = (lng, lat, properties) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties });
const collection = (features) => ({ type: 'FeatureCollection', features });

function regionFeature(m) {
  const [w, s, e, n] = m.boundingBox ?? [];
  if ([w, s, e, n].some((v) => typeof v !== 'number')) return null;
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] },
    properties: { id: m.id, name: m.name, region: m.region, era: m.era, eraBucket: eraBucket(m.era), color: m.color, bbox: [w, s, e, n].join(',') },
  };
}

const mythFeature = (m) =>
  m.origin &&
  point(m.origin.lng, m.origin.lat, {
    id: m.id,
    name: m.name,
    mythologyId: m.mythologyId,
    type: m.type,
    era: m.era,
    eraBucket: eraBucket(m.era),
    summary: m.summary,
    imageUrl: m.imageUrl ?? '',
    themes: (m.themes ?? []).join(','),
  });

const deityFeature = (d) =>
  d.origin &&
  point(d.origin.lng, d.origin.lat, {
    id: d.id,
    name: d.name,
    mythologyId: d.mythologyId,
    type: d.type,
    era: d.era,
    eraBucket: eraBucket(d.era),
    description: d.description,
    imageUrl: d.imageUrl ?? '',
    domains: (d.domain ?? []).join(','),
    color: mythologyById.get(d.mythologyId)?.color ?? '#c9a84c',
  });

const siteFeature = (s) =>
  s.coordinates &&
  point(s.coordinates.lng, s.coordinates.lat, {
    id: s.id,
    name: s.name,
    mythologyId: s.mythologyId,
    mythologyName: mythologyById.get(s.mythologyId)?.name ?? s.mythologyId,
    type: s.type,
    era: s.era,
    eraBucket: eraBucket(s.era),
    description: s.description,
    imageUrl: s.imageUrl ?? '',
    country: s.country,
    modernStatus: s.modernStatus,
    tags: (s.tags ?? []).join(','),
    color: mythologyById.get(s.mythologyId)?.color ?? '#c9a84c',
  });

const files = new Map();
const put = (p, data) => files.set(p, `${JSON.stringify(data)}\n`);

put('mythologies.json', mythologies);
put('myths.json', myths);
put('deities.json', deities);
put('sacred-sites.json', sites);
put('cultures.json', cultures);
put('mythology-regions.geojson', collection(mythologies.map(regionFeature).filter(Boolean)));
put('myth-origins.geojson', collection(myths.map(mythFeature).filter(Boolean)));
put('deities.geojson', collection(deities.map(deityFeature).filter(Boolean)));
put('sacred-sites.geojson', collection(sites.map(siteFeature).filter(Boolean)));

const withRegion = mythologies.filter((m) => regionFeature(m));
put('by-mythology/manifest.json', { mythologies: withRegion.map((m) => m.id) });
for (const m of withRegion) {
  const own = (list) => list.filter((x) => x.mythologyId === m.id);
  put(`by-mythology/${m.id}/region.geojson`, collection([regionFeature(m)]));
  put(`by-mythology/${m.id}/myths.geojson`, collection(own(myths).map(mythFeature).filter(Boolean)));
  put(`by-mythology/${m.id}/deities.geojson`, collection(own(deities).map(deityFeature).filter(Boolean)));
  put(`by-mythology/${m.id}/sites.geojson`, collection(own(sites).map(siteFeature).filter(Boolean)));
}

if (check) {
  const stale = [];
  for (const [p, text] of files) {
    const current = await readFile(out(p), 'utf-8').catch(() => null);
    if (current?.replace(/\r\n/g, '\n') !== text) stale.push(p);
  }
  if (stale.length) {
    console.error(`public/data güncel değil (${stale.length} dosya): ${stale.slice(0, 5).join(', ')}… → node scripts/build-public-data.mjs`);
    process.exit(1);
  }
  console.log(`public/data güncel (${files.size} dosya).`);
} else {
  await rm(out('by-mythology'), { recursive: true, force: true });
  for (const [p, text] of files) {
    await mkdir(path.dirname(out(p)), { recursive: true });
    await writeFile(out(p), text);
  }
  console.log(`public/data yazıldı: ${files.size} dosya, ${withRegion.length} mitoloji bölgesi.`);
}
