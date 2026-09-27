// İçerik temizliği (2026-09 denetimi). Tekrar çalıştırılabilir: aynı girdide aynı çıktıyı verir.
//
// Denetimde bulunanlar ve buradaki kural:
//  1. Arkeolojik "kaynaklar" uydurmaydı (yazar: "Interdisciplinary field teams" gibi grup adları,
//     var olmayan başlıklar) → hepsi çıkar.
//  2. Aynı ikincil eserler (Frazer, Lévi-Strauss, Campbell…) mitlerin neredeyse hepsine kalıp
//     olarak eklenmişti → 20+ mitte tekrar eden ikincil kaynak çıkar; mite özgü olanlar kalır.
//  3. Belirli bir eseri göstermeyen birincil "kaynaklar" ("... (recorded)", "(selected ...)") çıkar.
//  4. 404 veren bağlantılar (scripts/dead-links.json, ölçülerek bulundu) kaldırılır; atıf kalır.
//  5. Kalıp metinler (aynı cümle 5+ kayıtta ya da yalnız ad değiştirilerek üretilmiş şablon)
//     silinir: kaynak açıklaması/ilgili pasaj, paralel farkları, kazı ve mimari dolgu metinleri.
//  6. Kaynaksız akademik iddialar silinir: paralel "tartışmalılık düzeyi", "bağlantı türü",
//     "bağlantı açıklaması", "önemli akademisyenler", DNA "köken kuramı", "aktif kazı" durumu,
//     müze "eser sayısı".
//  7. Paralel benzerlik skoru uydurmaydı (ortak temalarla ilişkisiz) → tema örtüşmesiyle
//     yeniden hesaplanır: |A ∩ B| / |A ∪ B| × 100, A/B = mitin temaları + DNA öğeleri.
//  8. Görseller: çoğu yer tutucuydu (Tac Mahal 20 Hindu tanrısında). Kayıt başına doğrulanmış
//     Wikipedia görseli (data/wiki-matches.json) kullanılır; yoksa özgün görsel yalnız veri
//     setinde tekil ve dosya adı kaydın adıyla örtüşüyorsa kalır; yoksa görsel boş kalır.
//  9. UNESCO statüsü Wikidata'dan doğrulanır (koordinata yakın Dünya Mirası kaydı, P757); miras
//     adı ve liste numarası yazılır. Doğrulanamayan UNESCO ve yerel/ulusal koruma iddiası kalkar.
//
// Kullanım: node scripts/clean-content.mjs
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async (p) => JSON.parse((await readFile(path.join(root, p), 'utf-8')).replace(/^﻿/, ''));
const writeJson = (p, data) => writeFile(path.join(root, p), `${JSON.stringify(data, null, 2)}\n`);

const TEMPLATE_MIN = 5; // aynı metin bu kadar kayıtta geçiyorsa kalıptır
const BOILERPLATE_SECONDARY_MIN = 20; // bu kadar mitte tekrar eden ikincil kaynak kalıptır

const myths = await readJson('src/data/myths.json');
const deities = await readJson('src/data/deities.json');
const sites = await readJson('src/data/sacred-sites.json');
const mythologies = await readJson('src/data/mythologies.json');
const wiki = (await readJson('data/wiki-matches.json')).entries;
const deadLinks = new Set(await readJson('scripts/dead-links.json'));

const norm = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const counter = (values) => {
  const m = new Map();
  for (const v of values) if (v !== undefined && v !== null && v !== '') m.set(v, (m.get(v) ?? 0) + 1);
  return m;
};

const stats = {};
const bump = (k, n = 1) => {
  stats[k] = (stats[k] ?? 0) + n;
};

// ── Kaynaklar ─────────────────────────────────────────────────────────────

const secondaryKey = (s) => `${s.author}|${s.title}`;
const secondaryUse = counter(
  myths.flatMap((m) => [...new Set((m.academicSources ?? []).filter((s) => s.type === 'secondary').map(secondaryKey))]),
);

const VAGUE_PRIMARY = /\((recorded|selected)/i;
const SOURCE_TEMPLATES = [/ kaynagi, .* anlatisini /i, /^Metnin ilgili bolumleri /i];

function dateLabel(src) {
  const y = Number(src.year);
  if (src.estimatedDate && src.estimatedDate !== 'N/A' && (y <= 1000 || Number.isNaN(y))) return src.estimatedDate;
  if (y < 0) return `c. ${Math.abs(y)} BCE`;
  return String(y);
}

function cleanSource(src) {
  const out = { ...src };
  for (const field of ['description', 'relevantPassage']) {
    if (SOURCE_TEMPLATES.some((re) => re.test(out[field] ?? ''))) {
      delete out[field];
      bump(`kaynak.${field}.kalip`);
    }
  }
  if (out.url && deadLinks.has(out.url)) {
    delete out.url;
    out.isOpenAccess = false;
    bump('kaynak.olu_baglanti');
  }
  const when = dateLabel(out);
  out.citationAPA = `${out.author}. (${when}). ${out.title}.`;
  out.citationChicago = `${out.author}. ${out.title}. ${when}.`;
  return out;
}

for (const m of myths) {
  const before = (m.academicSources ?? []).length;
  m.academicSources = (m.academicSources ?? [])
    .filter((s) => {
      if (s.type === 'archaeological') return bump('kaynak.arkeolojik_uydurma'), false;
      if (s.type === 'secondary' && (secondaryUse.get(secondaryKey(s)) ?? 0) >= BOILERPLATE_SECONDARY_MIN)
        return bump('kaynak.ikincil_kalip'), false;
      if (s.type === 'primary' && VAGUE_PRIMARY.test(s.title)) return bump('kaynak.belirsiz_birincil'), false;
      return true;
    })
    .map(cleanSource);
  bump('kaynak.once', before);
  bump('kaynak.sonra', m.academicSources.length);
}

// ── Paraleller ────────────────────────────────────────────────────────────

const mythById = new Map(myths.map((m) => [m.id, m]));
const motifSet = (m) => new Set([...(m.themes ?? []), ...(m.dna?.elements ?? [])].map((t) => norm(t).replace(/ /g, '_')));
const divergenceUse = counter(myths.flatMap((m) => (m.parallels ?? []).flatMap((p) => p.divergences ?? [])));
const DIVERGENCE_TEMPLATES = [/^Teolojik baglam farki:/, /^Tur farki:/];
const UNSOURCED_PARALLEL_FIELDS = ['connectionType', 'connectionExplanation', 'keyScholars', 'controversyLevel'];

for (const m of myths) {
  const sourceIds = new Set((m.academicSources ?? []).map((s) => s.id));
  m.parallels = (m.parallels ?? []).map((p) => {
    if (typeof p === 'string') return p;
    const other = mythById.get(p.mythId);
    const out = { ...p };
    if (other) {
      const a = motifSet(m);
      const b = motifSet(other);
      const inter = [...a].filter((x) => b.has(x)).length;
      const union = new Set([...a, ...b]).size;
      out.similarityScore = union ? Math.round((inter / union) * 100) : 0;
    } else {
      delete out.similarityScore;
    }
    out.divergences = (p.divergences ?? []).filter((d) => {
      const template = (divergenceUse.get(d) ?? 0) >= TEMPLATE_MIN || DIVERGENCE_TEMPLATES.some((re) => re.test(d));
      if (template) bump('paralel.fark_kalip');
      return !template;
    });
    for (const f of UNSOURCED_PARALLEL_FIELDS) if (f in out) delete out[f];
    out.academicSourceIds = (p.academicSourceIds ?? []).filter((id) => sourceIds.has(id));
    bump('paralel');
    return out;
  });
  if (m.dna && 'originTheory' in m.dna) {
    delete m.dna.originTheory;
    bump('dna.koken_kurami');
  }
}

// ── Kutsal alanlar: kazı / mimari dolgu ───────────────────────────────────

const archStrings = (pick) => counter(sites.flatMap((s) => pick(s.archaeology ?? {}) ?? []));
const firstDocUse = archStrings((a) => [a.discoveryHistory?.firstDocumented]);
const excavationUse = archStrings((a) => (a.discoveryHistory?.majorExcavations ?? []).map((e) => e.led_by));
const modUse = archStrings((a) => (a.architecture?.modifications ?? []).map((x) => x.description));
const stateUse = archStrings((a) => [a.architecture?.currentState]);
const chronoUse = archStrings((a) => (a.chronology ?? []).map((c) => c.event));
const structUse = archStrings((a) => [a.architecture?.originalStructure]);
const isTemplate = (use, v) => (use.get(v) ?? 0) >= TEMPLATE_MIN;
const UNKNOWN = new Set(['Unknown', 'unknown', 'ancient', 'N/A']);

// UNESCO: alan koordinatına 15 km içindeki Dünya Mirası kayıtlarından (Wikidata P757) biri,
// adı alanın adıyla sözcük paylaşıyorsa ya da 2 km'den yakınsa. (Varanasi'yi 7 km ötedeki
// Sarnath yüzünden UNESCO saymamak için.)
function worldHeritageFor(site) {
  const rows = wiki.site?.[site.id]?.worldHeritage ?? [];
  const words = new Set(norm(site.name).split(' ').filter((t) => t.length >= 4));
  const hit = rows.find((r) => r.km <= 2 || norm(r.name).split(' ').some((t) => t.length >= 4 && words.has(t)));
  if (!hit) return null;
  const listId = String(hit.whsId).split('-')[0];
  return { name: hit.name, listId, url: `https://whc.unesco.org/en/list/${listId}/` };
}

for (const s of sites) {
  const a = s.archaeology;
  if (!a) continue;
  const dh = a.discoveryHistory ?? {};
  if (isTemplate(firstDocUse, dh.firstDocumented)) delete dh.firstDocumented, bump('alan.ilk_belge_kalip');
  dh.majorExcavations = (dh.majorExcavations ?? []).filter((e) => {
    const bad = isTemplate(excavationUse, e.led_by);
    if (bad) bump('alan.kazi_kalip');
    return !bad;
  });
  if ('currentStatus' in dh) delete dh.currentStatus, bump('alan.kazi_durumu_kaynaksiz');
  const whs = worldHeritageFor(s);
  const claimed = dh.protectionStatus === 'UNESCO';
  delete dh.protectionStatus;
  delete dh.worldHeritage;
  if (whs) {
    dh.protectionStatus = 'UNESCO';
    dh.worldHeritage = whs;
    bump(claimed ? 'alan.unesco_dogrulandi' : 'alan.unesco_eklendi');
  } else if (claimed) bump('alan.unesco_dogrulanmadi');
  else bump('alan.koruma_kaynaksiz');
  a.discoveryHistory = dh;

  const ar = a.architecture ?? {};
  if (isTemplate(structUse, ar.originalStructure)) delete ar.originalStructure, bump('alan.mimari_kalip');
  for (const f of ['dimensions', 'constructionTechnique', 'constructionPeriod']) {
    if (UNKNOWN.has(ar[f])) delete ar[f], bump('alan.bilinmiyor');
  }
  ar.modifications = (ar.modifications ?? []).filter((x) => !isTemplate(modUse, x.description) || (bump('alan.degisiklik_kalip'), false));
  if (isTemplate(stateUse, ar.currentState)) delete ar.currentState, bump('alan.durum_kalip');
  a.architecture = ar;

  a.chronology = (a.chronology ?? []).filter((c) => !isTemplate(chronoUse, c.event) || (bump('alan.kronoloji_kalip'), false));
  a.museumConnections = (a.museumConnections ?? [])
    .filter((c) => !/site context$/i.test(c.museumName ?? '') || (bump('alan.sahte_muze'), false))
    .map((c) => {
      const out = { ...c };
      if ('artifactCount' in out) delete out.artifactCount, bump('alan.eser_sayisi_kaynaksiz');
      return out;
    });
}

// ── Görseller ─────────────────────────────────────────────────────────────

const allImages = counter([
  ...myths.map((x) => x.imageUrl),
  ...deities.map((x) => x.imageUrl),
  ...sites.map((x) => x.imageUrl),
  ...mythologies.map((x) => x.imageUrl),
  ...sites.flatMap((s) => (s.archaeology?.artifacts ?? []).map((a) => a.imageUrl)),
]);

function fileTokens(url) {
  const file = decodeURIComponent(String(url).split('/').pop() ?? '').replace(/^\d+px-/, '').replace(/\.\w+$/, '');
  return new Set(norm(file).split(' ').filter((t) => t.length >= 4));
}

function originalFits(url, names) {
  if (!url || (allImages.get(url) ?? 0) > 1) return false;
  const tokens = fileTokens(url);
  return names.some((n) => norm(n).split(' ').some((t) => t.length >= 4 && tokens.has(t)));
}

// Wikipedia API'nin thumb.wikimedia.org adresi → kalıcı upload.wikimedia.org adresi, izleme
// parametresiz. Yalnız Commons (özgür lisanslı) görsel kabul edilir; wikipedia/en altındaki
// adil kullanım görselleri bu sitede kullanılamaz.
function commonsImage(url) {
  if (!url) return null;
  const clean = String(url).split('?')[0].replace('https://thumb.wikimedia.org/', 'https://upload.wikimedia.org/');
  return /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//.test(clean) ? clean : null;
}

function pickImage(kind, rec, names) {
  const w = wiki[kind]?.[rec.id];
  const wikiImage = w?.matched ? commonsImage(w.image) : null;
  const keep = originalFits(rec.imageUrl, names) ? rec.imageUrl : null;
  const chosen = kind === 'myth' ? keep ?? wikiImage : wikiImage ?? keep;
  bump(`gorsel.${kind}.${chosen ? (chosen === wikiImage ? 'wikipedia' : 'ozgun') : 'yok'}`);
  return chosen ?? '';
}

for (const m of myths) m.imageUrl = pickImage('myth', m, [m.name, ...(m.characters ?? [])]);
for (const d of deities) d.imageUrl = pickImage('deity', d, [d.name, ...(d.alternateNames ?? [])]);
for (const s of sites) s.imageUrl = pickImage('site', s, [s.name]);
for (const y of mythologies) y.imageUrl = pickImage('mythology', y, [y.name]);
for (const s of sites) {
  for (const art of s.archaeology?.artifacts ?? []) {
    if (art.imageUrl && (allImages.get(art.imageUrl) ?? 0) > 1) delete art.imageUrl, bump('gorsel.eser_yer_tutucu');
  }
}

await writeJson('src/data/myths.json', myths);
await writeJson('src/data/deities.json', deities);
await writeJson('src/data/sacred-sites.json', sites);
await writeJson('src/data/mythologies.json', mythologies);
console.log(JSON.stringify(stats, null, 1));
