// Her kaydı (mitoloji, mit, tanrı, kutsal alan) İngilizce Wikipedia sayfasıyla eşler ve
// doğrulanabilir alanları Wikidata'dan çeker: sayfa görseli (Commons), kutsal alanlar için
// UNESCO Dünya Mirası statüsü (P1435 = Q9259) ve koordinat (P625).
//
// Eşleşme kuralı: önce doğrudan başlık (Wikipedia yönlendirmeleri dahil), sonra arama.
// Başlığın parantez dışı kısmı kaydın adı ya da alternatif adıyla birebir aynı olmalı; parantez
// niteleyicisi tanrı/mitoloji ifadesi taşımalı ("Owl of Athena", "Menrva (crater)" elenir).
// Tanrılarda sayfanın kısa açıklaması bir tanrı/din ifadesi içermeli. Kutsal alanlarda asıl
// doğrulama koordinattır: Wikidata koordinatı kayıttakine 75 km'den yakın olmalı. Tutmayan kayıt
// "eşleşmedi" olarak yazılır ve görselsiz kalır; tahmin yapılmaz.
//
// Çıktı: data/wiki-matches.json (kanıt dosyası; clean-content.mjs bunu uygular).
// Kullanım: node scripts/wiki-match.mjs [--retry]
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'MythAtlas/0.2 (https://github.com/Scryne/MythAtlas; data verification script)';
const WP = 'https://en.wikipedia.org/w/api.php';
const WD = 'https://www.wikidata.org/w/api.php';
const THUMB = 960;

const read = async (p) => JSON.parse((await readFile(path.join(root, p), 'utf-8')).replace(/^﻿/, ''));

async function api(base, params, attempt = 0) {
  const url = `${base}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if ((res.status === 429 || res.status >= 500) && attempt < 7) {
    const retryAfter = Number(res.headers.get('retry-after')) || 0;
    await new Promise((r) => setTimeout(r, Math.max(retryAfter * 1000, 4000 * (attempt + 1))));
    return api(base, params, attempt + 1);
  }
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

const norm = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// "Ramayana — Rama's Journey" → ["Ramayana — Rama's Journey", "Ramayana"]
function nameVariants(rec) {
  const name = String(rec.name);
  const head = name.split(/\s[—–-]\s|:|\(/)[0].trim();
  const slash = name.includes('/')
    ? name.split('/').map((part) => part.replace(/mytholog(y|ies)|tradition/gi, '').trim()).filter(Boolean)
    : [];
  const alts = Array.isArray(rec.alternateNames) ? rec.alternateNames : [];
  return [...new Set([name, head, ...slash, ...alts].filter((v) => v && v.length >= 2))];
}

// Başlığın parantez dışı kısmı kaydın adlarından biriyle birebir aynı olmalı.
function strictTitle(title, variants) {
  const base = norm(String(title).replace(/\s*\(.*\)\s*$/, ''));
  return variants.some((v) => norm(v) === base);
}

const QUALIFIER_OK = /god|goddess|deity|mytholog|religion|kami|orisha|spirit|being|demon|hinduism|buddhism|epic|legend|myth/i;
const DEITY_DESC = /\b(god|goddess|gods|deity|deities|divinity|divine|kami|orisha|spirit|demigod|avatar|mytholog\w*|religion|pantheon)\b/i;
const MYTH_DESC = /(myth|mytholog|religio|epic|legend|poem|text|festival|deity|god|goddess|hero|king|tale|folklore|creature|chant|cycle|hall|novel|cosmolog|figure|khan|protagonist|scripture|saga|narrative|flood|creation|end times|site|mountain)/i;
const DEITY_BAD = /\b(crater|book|album|film|song|band|novel|military|footballer|politician|company|asteroid|moon of|ship|village|city|river)\b/i;

const DISAMBIG = /disambiguation|topics referred to by the same term/i;

function qualifierOk(title) {
  const m = String(title).match(/\(([^)]*)\)\s*$/);
  return !m || QUALIFIER_OK.test(m[1]);
}

function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function search(query) {
  const j = await api(WP, { action: 'query', list: 'search', srsearch: query, srlimit: '6', srnamespace: '0' });
  return (j.query?.search ?? []).map((r) => r.title);
}

// Başlık listesi → (istenen başlık → sayfa). Yönlendirmeler izlenir.
async function pageInfo(titles) {
  const j = await api(WP, {
    action: 'query',
    prop: 'pageimages|pageprops|description',
    piprop: 'thumbnail|name',
    pithumbsize: String(THUMB),
    titles: titles.join('|'),
    redirects: '1',
  });
  const pages = new Map((j.query?.pages ?? []).map((p) => [p.title, p]));
  const hop = new Map();
  for (const n of j.query?.normalized ?? []) hop.set(n.from, n.to);
  for (const r of j.query?.redirects ?? []) hop.set(r.from, r.to);
  const out = new Map();
  for (const t of titles) {
    let cur = t;
    for (let k = 0; k < 3 && hop.has(cur); k += 1) cur = hop.get(cur);
    const p = pages.get(cur);
    if (p && !p.missing && !p.invalid) out.set(t, p);
  }
  return out;
}

async function wikidata(qid) {
  const j = await api(WD, { action: 'wbgetentities', ids: qid, props: 'claims' });
  const claims = j.entities?.[qid]?.claims ?? {};
  const heritage = (claims.P1435 ?? []).map((c) => c.mainsnak?.datavalue?.value?.id).filter(Boolean);
  const coord = claims.P625?.[0]?.mainsnak?.datavalue?.value;
  return {
    unesco: heritage.includes('Q9259'),
    coord: coord ? { lat: coord.latitude, lng: coord.longitude } : null,
  };
}

function acceptable(kind, page, variants, viaRedirect) {
  const desc = page.description ?? '';
  if (DISAMBIG.test(`${page.title} ${desc}`)) return false;
  if ((kind === 'myth' || kind === 'mythology') && !MYTH_DESC.test(desc)) return false;
  if (kind === 'deity') {
    if (DEITY_BAD.test(desc) || !DEITY_DESC.test(desc)) return false;
  }
  if (viaRedirect) return true; // Wikipedia'nın kendi yönlendirmesi (ör. "Churning of the Ocean of Milk" → Samudra Manthana)
  return strictTitle(page.title, variants) && qualifierOk(page.title);
}

// Alanın koordinatına 15 km içindeki UNESCO Dünya Mirası kayıtları (Wikidata P757).
// Miras kaydı çoğu zaman yerin kendisinden ayrı bir öğedir ("Archaeological Site of Delphi").
async function worldHeritageNear(coord) {
  const q = `SELECT ?item ?itemLabel ?whs ?dist WHERE {
    SERVICE wikibase:around { ?item wdt:P625 ?loc .
      bd:serviceParam wikibase:center "Point(${coord.lng} ${coord.lat})"^^geo:wktLiteral .
      bd:serviceParam wikibase:radius "15" .
      bd:serviceParam wikibase:distance ?dist . }
    ?item wdt:P757 ?whs .
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
  }`;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const res = await fetch(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(q)}`, {
      headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json' },
    });
    if (res.ok) {
      const j = await res.json();
      const rows = j.results.bindings
        .map((b) => ({ name: b.itemLabel?.value, whsId: b.whs?.value, km: Math.round(Number(b.dist?.value) * 10) / 10 }))
        .sort((x, y) => x.km - y.km);
      const seen = new Set();
      return rows.filter((r) => !seen.has(r.whsId) && seen.add(r.whsId));
    }
    await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
  }
  throw new Error('SPARQL failed');
}

async function match(kind, rec, mythologyName) {
  const variants = nameVariants(rec);
  const primary = variants.slice(0, kind === 'deity' ? variants.length : 3);
  // 1) Doğrudan başlık (+ yaygın niteleyiciler), 2) arama.
  const direct = [];
  for (const v of primary) {
    direct.push(v);
    if (kind === 'deity') direct.push(`${v} (god)`, `${v} (goddess)`, `${v} (deity)`, `${v} (mythology)`);
    if (kind === 'mythology' && !/mytholog/i.test(v)) direct.push(`${v} mythology`, `${v} religion`);
  }
  const candidates = [];
  const directInfo = await pageInfo([...new Set(direct)].slice(0, 50));
  for (const t of direct) {
    const p = directInfo.get(t);
    if (p) candidates.push({ p, viaRedirect: norm(p.title) !== norm(t) && !/\(/.test(t) });
  }
  const queries = {
    mythology: [rec.name],
    myth: [`${rec.name} ${mythologyName}`],
    deity: [`${rec.name} ${mythologyName}`, `${rec.name} deity`],
    site: [`${rec.name} ${rec.country ?? ''}`.trim(), rec.name],
  }[kind];
  for (const q of queries) {
    const titles = await search(q);
    const info = await pageInfo(titles);
    for (const t of titles) if (info.get(t)) candidates.push({ p: info.get(t), viaRedirect: false });
  }

  const seen = new Set();
  for (const { p, viaRedirect } of candidates) {
    if (seen.has(p.title)) continue;
    seen.add(p.title);
    // Kutsal alanda koordinat asıl doğrulamadır; başlık kuralı gevşek (ör. "Delphi" → "Delphi").
    if (kind !== 'site' && !acceptable(kind, p, variants, viaRedirect)) continue;
    if (kind === 'site') {
      if (DISAMBIG.test(`${p.title} ${p.description ?? ''}`)) continue;
      const t = norm(p.title);
      const prefix = (v) => t.startsWith(norm(v)) || (t.length >= 4 && norm(v).startsWith(`${t} `));
      if (!strictTitle(p.title, variants) && !variants.some(prefix)) continue;
    }
    const qid = p.pageprops?.wikibase_item ?? null;
    const result = {
      title: p.title,
      description: p.description ?? null,
      qid,
      image: p.thumbnail?.source ?? null,
      imageFile: p.pageimage ?? null,
    };
    if (kind === 'site') {
      if (!qid) continue;
      const wd = await wikidata(qid);
      const km = wd.coord && rec.coordinates ? Math.round(haversineKm(rec.coordinates, wd.coord)) : null;
      if (km === null || km > 75) continue;
      Object.assign(result, { unesco: wd.unesco, wikidataCoord: wd.coord, distanceKm: km });
    }
    return { matched: true, ...result };
  }
  return { matched: false };
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k], k);
      }
    }),
  );
  return out;
}

const mythologies = await read('src/data/mythologies.json');
const mythologyName = new Map(mythologies.map((m) => [m.id, m.name]));
const sets = {
  mythology: mythologies,
  myth: await read('src/data/myths.json'),
  deity: await read('src/data/deities.json'),
  site: await read('src/data/sacred-sites.json'),
};

// --retry: önceki çıktıdaki kesin sonuçları korur, yalnız hata alan kayıtları yeniden dener.
const retry = process.argv.includes('--retry');
const previous = retry ? (await read('data/wiki-matches.json')).entries : {};
const result = { generatedAt: new Date().toISOString(), source: 'en.wikipedia.org + wikidata.org', entries: {} };
for (const [kind, recs] of Object.entries(sets)) {
  const rows = await pool(recs, 2, async (rec) => {
    const prev = previous[kind]?.[rec.id];
    if (prev && !prev.error && (kind !== 'site' || prev.worldHeritage?.every((w) => 'km' in w))) return [rec.id, prev];
    try {
      const found = await match(kind, rec, mythologyName.get(rec.mythologyId) ?? '');
      if (kind === 'site' && rec.coordinates) found.worldHeritage = await worldHeritageNear(rec.coordinates);
      return [rec.id, found];
    } catch (e) {
      return [rec.id, { matched: false, error: String(e.message ?? e) }];
    }
  });
  result.entries[kind] = Object.fromEntries(rows);
  const ok = rows.filter(([, r]) => r.matched).length;
  const img = rows.filter(([, r]) => r.image).length;
  console.log(`${kind}: ${recs.length} kayıt, ${ok} eşleşti, ${img} görselli`);
}
await writeFile(path.join(root, 'data/wiki-matches.json'), `${JSON.stringify(result, null, 1)}\n`);
