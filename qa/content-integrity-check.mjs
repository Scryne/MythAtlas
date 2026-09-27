// İçerik doğruluğu kapısı (2026-09 denetimi). data-integrity-check şemayı denetler; bu betik
// denetimde bulunan uydurma içerik türlerinin geri gelmesini engeller. Bir kural kırılırsa
// 1 ile çıkar (CI'yı düşürür). Kuralların gerekçesi: scripts/clean-content.mjs başlığı.
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const read = (p) => JSON.parse(readFileSync(path.join(ROOT, p), 'utf-8').replace(/^﻿/, ''));

const myths = read('src/data/myths.json');
const deities = read('src/data/deities.json');
const sites = read('src/data/sacred-sites.json');
const mythologies = read('src/data/mythologies.json');
const deadLinks = new Set(read('scripts/dead-links.json'));

const TEMPLATE_MIN = 5;
const BOILERPLATE_SECONDARY_MIN = 20;
const PLACEHOLDER_IMAGE_MIN = 3;
const COMMONS = /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//;
const GROUP_AUTHOR = /\b(teams|projects|institutes|surveys|collections|missions|syntheses|archival record|knowledge keepers|narrators)\b/i;
const VAGUE_TITLE = /\((recorded|selected)/i;
const UNSOURCED_PARALLEL_FIELDS = ['connectionType', 'connectionExplanation', 'keyScholars', 'controversyLevel'];

const failures = [];
const fail = (rule, detail) => failures.push({ rule, detail });
const count = (values) => {
  const m = new Map();
  for (const v of values) if (v) m.set(v, (m.get(v) ?? 0) + 1);
  return m;
};
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

// 1. Görseller: boş olabilir; doluysa Commons olmalı ve yer tutucu gibi tekrar etmemeli.
const records = [
  ...myths.map((r) => ['myth', r]),
  ...deities.map((r) => ['deity', r]),
  ...sites.map((r) => ['site', r]),
  ...mythologies.map((r) => ['mythology', r]),
];
for (const [kind, r] of records) {
  if (r.imageUrl && !COMMONS.test(r.imageUrl)) fail('gorsel_commons_degil', `${kind}:${r.id} ${r.imageUrl}`);
}
for (const [url, n] of count(records.map(([, r]) => r.imageUrl))) {
  if (n >= PLACEHOLDER_IMAGE_MIN) fail('gorsel_yer_tutucu', `${n} kayıtta aynı görsel: ${url}`);
}

// 2. Kaynaklar
const secondaryUse = count(
  myths.flatMap((m) => [...new Set((m.academicSources ?? []).filter((s) => s.type === 'secondary').map((s) => `${s.author}|${s.title}`))]),
);
for (const m of myths) {
  for (const s of m.academicSources ?? []) {
    const where = `${m.id} → ${s.author}, ${s.title}`;
    if (GROUP_AUTHOR.test(s.author ?? '')) fail('kaynak_grup_yazar', where);
    if (VAGUE_TITLE.test(s.title ?? '')) fail('kaynak_belirsiz_baslik', where);
    if (s.url && deadLinks.has(s.url)) fail('kaynak_olu_baglanti', `${where} ${s.url}`);
    if (s.type === 'secondary' && (secondaryUse.get(`${s.author}|${s.title}`) ?? 0) >= BOILERPLATE_SECONDARY_MIN)
      fail('kaynak_kalip_ikincil', where);
    if (/ kaynagi, .* anlatisini /i.test(s.description ?? '') || /^Metnin ilgili bolumleri /i.test(s.relevantPassage ?? ''))
      fail('kaynak_kalip_metin', where);
    if (/\(-\d+\)|\. -\d+\.$/.test(`${s.citationAPA ?? ''} ${s.citationChicago ?? ''}`)) fail('kaynak_negatif_yil', where);
  }
}

// 3. Paraleller: kaynaksız iddia yok, skor tema örtüşmesinden.
const mythById = new Map(myths.map((m) => [m.id, m]));
const motifs = (m) => new Set([...(m.themes ?? []), ...(m.dna?.elements ?? [])].map(norm));
const divergenceUse = count(myths.flatMap((m) => (m.parallels ?? []).flatMap((p) => p.divergences ?? [])));
for (const m of myths) {
  if (m.dna && 'originTheory' in m.dna) fail('dna_koken_kurami', m.id);
  for (const p of m.parallels ?? []) {
    if (typeof p === 'string') continue;
    for (const f of UNSOURCED_PARALLEL_FIELDS) if (f in p) fail('paralel_kaynaksiz_alan', `${m.id} → ${p.mythId}: ${f}`);
    for (const d of p.divergences ?? []) if ((divergenceUse.get(d) ?? 0) >= TEMPLATE_MIN) fail('paralel_kalip_fark', `${m.id}: ${d}`);
    const other = mythById.get(p.mythId);
    if (other && 'similarityScore' in p) {
      const a = motifs(m);
      const b = motifs(other);
      const union = new Set([...a, ...b]).size;
      const expected = union ? Math.round(([...a].filter((x) => b.has(x)).length / union) * 100) : 0;
      if (p.similarityScore !== expected) fail('paralel_skor', `${m.id} → ${p.mythId}: ${p.similarityScore} ≠ ${expected}`);
    }
  }
}

// 4. Kutsal alanlar: dolgu metin ve kaynaksız durum yok; UNESCO kanıtlı.
const archText = (pick) => count(sites.flatMap((s) => pick(s.archaeology ?? {}) ?? []));
const checks = [
  ['kazi_ilk_belge', (a) => [a.discoveryHistory?.firstDocumented]],
  ['kazi_kaydi', (a) => (a.discoveryHistory?.majorExcavations ?? []).map((e) => e.led_by)],
  ['mimari_yapi', (a) => [a.architecture?.originalStructure]],
  ['mimari_durum', (a) => [a.architecture?.currentState]],
  ['mimari_degisiklik', (a) => (a.architecture?.modifications ?? []).map((x) => x.description)],
  ['kronoloji', (a) => (a.chronology ?? []).map((c) => c.event)],
];
for (const [rule, pick] of checks) {
  for (const [text, n] of archText(pick)) if (n >= TEMPLATE_MIN) fail(`alan_kalip_${rule}`, `${n}× "${String(text).slice(0, 70)}"`);
}
for (const s of sites) {
  const dh = s.archaeology?.discoveryHistory ?? {};
  if ('currentStatus' in dh) fail('alan_kaynaksiz_kazi_durumu', s.id);
  if (dh.protectionStatus === 'UNESCO' && !dh.worldHeritage?.listId) fail('alan_unesco_kanitsiz', s.id);
  if (dh.protectionStatus && dh.protectionStatus !== 'UNESCO') fail('alan_kaynaksiz_koruma', `${s.id}: ${dh.protectionStatus}`);
  for (const c of s.archaeology?.museumConnections ?? []) if ('artifactCount' in c) fail('alan_kaynaksiz_eser_sayisi', s.id);
  for (const [f, v] of Object.entries(s.archaeology?.architecture ?? {})) if (v === 'Unknown') fail('alan_bilinmiyor_degeri', `${s.id}.${f}`);
}

const byRule = count(failures.map((f) => f.rule));
if (failures.length) {
  console.error(`İçerik doğruluğu: ${failures.length} ihlal`);
  for (const [rule, n] of byRule) {
    console.error(`  ${rule}: ${n}  (ör. ${failures.find((f) => f.rule === rule).detail})`);
  }
  process.exitCode = 1;
} else {
  const sources = myths.reduce((n, m) => n + (m.academicSources ?? []).length, 0);
  console.log(`İçerik doğruluğu: temiz (${myths.length} mit, ${deities.length} tanrı, ${sites.length} alan, ${sources} kaynak).`);
}
