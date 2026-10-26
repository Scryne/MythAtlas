// Wikimedia görsel adreslerini derlemeden önce bir kez çözer: src/data/image-map.json
// Site statik (GitHub Pages) olduğu için çalışma anında görsel proxy'si yok; tarayıcı görseli doğrudan
// upload.wikimedia.org'dan alır. Bu betik Commons API'den her dosyanın güncel küçük resim adresini bulur,
// adı değişmiş dosyalar için bilinen eşlemeleri uygular ve tam boy orijinalleri 960 px küçük resme çevirir.
//
//   node scripts/resolve-images.mjs          → haritayı yeniden yazar (ağ ister)
//   node scripts/resolve-images.mjs --check  → haritada olmayan adres varsa çıkış 1 (ağ istemez)
import fs from 'node:fs';
import path from 'node:path';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const CIKTI = path.join(KOK, 'src', 'data', 'image-map.json');
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'MythAtlas/1.0 (https://github.com/Scryne/MythAtlas; build-time image resolver)';
const VARSAYILAN_GENISLIK = 960;
const ADRES = /https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[^\s"'`)\]\\]+/g;

// Commons'ta adı değişmiş ya da silinmiş dosyalar → bugünkü karşılıkları (eski görsel proxy'sinden taşındı).
const ESLEME = {
  'Odysseus_And_The_Sirens_by_H.J._Draper.jpg': 'Ulysses and the Sirens by H.J. Draper.jpg',
  'Battle_of_the_Doomed_Gods_by_Friedrich_Wilhelm_Heine.jpg': 'The twilight of the gods by Willy Pogany.png',
  'Pantheon_Roma_2.jpg': 'Pantheon Rom 1 cropped.jpg',
  'Pergamonmuseum_Ischtar-Tor_01.jpg': 'Ishtar Gate - Pergamonmuseum - Berlin - Germany 2017.jpg',
  'Jerusalem_night_WLM14.jpg': 'Jerusalem Old City At Night (2113240539).jpg',
  'Attis_Museo_Nazionale_Romano.jpg': 'Attis-Athena Altemps Inv8585.jpg',
};

function dosyalar(dizin) {
  const sonuc = [];
  for (const g of fs.readdirSync(dizin, { withFileTypes: true })) {
    const tam = path.join(dizin, g.name);
    if (g.isDirectory()) sonuc.push(...dosyalar(tam));
    else if (/\.(json|ts|tsx)$/.test(g.name) && tam !== CIKTI) sonuc.push(tam);
  }
  return sonuc;
}

export function adresleriTopla() {
  const kume = new Set();
  for (const d of dosyalar(path.join(KOK, 'src'))) {
    for (const m of fs.readFileSync(d, 'utf8').matchAll(ADRES)) kume.add(m[0]);
  }
  return [...kume].sort();
}

function cozumle(adres) {
  const parcalar = new URL(adres).pathname.split('/').filter(Boolean);
  // /wikipedia/commons/thumb/a/ab/Dosya.jpg/960px-Dosya.jpg  ya da  /wikipedia/commons/a/ab/Dosya.jpg
  if (parcalar[2] === 'thumb') {
    const genislik = Number((parcalar[parcalar.length - 1].match(/^(\d+)px-/) || [])[1]) || VARSAYILAN_GENISLIK;
    return { dosya: decodeURIComponent(parcalar[5]), genislik };
  }
  return { dosya: decodeURIComponent(parcalar[parcalar.length - 1]), genislik: VARSAYILAN_GENISLIK };
}

const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

async function sorgula(basliklar, genislik) {
  const params = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', prop: 'imageinfo', iiprop: 'url',
    iiurlwidth: String(genislik), titles: basliklar.map((b) => `File:${b}`).join('|'),
  });
  for (let deneme = 1; ; deneme += 1) {
    const yanit = await fetch(`${API}?${params}`, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (yanit.ok) return yanit.json();
    if (deneme >= 4 || ![429, 500, 502, 503, 504].includes(yanit.status)) {
      throw new Error(`Commons API ${yanit.status}`);
    }
    await bekle(1500 * deneme);
  }
}

const anahtar = (b) => b.replace(/_/g, ' ');

async function main() {
  const adresler = adresleriTopla();
  if (process.argv.includes('--check')) {
    const harita = fs.existsSync(CIKTI) ? JSON.parse(fs.readFileSync(CIKTI, 'utf8')) : {};
    const eksik = adresler.filter((a) => !(a in harita));
    console.log(`${adresler.length} adres, haritada olmayan: ${eksik.length}`);
    for (const a of eksik.slice(0, 10)) console.log('  ' + a);
    process.exit(eksik.length ? 1 : 0);
  }
  const istekler = adresler.map((a) => ({ adres: a, ...cozumle(a) }));
  const gruplar = new Map();
  for (const i of istekler) {
    const hedef = ESLEME[i.dosya] || i.dosya;
    i.hedef = hedef;
    if (!gruplar.has(i.genislik)) gruplar.set(i.genislik, new Set());
    gruplar.get(i.genislik).add(hedef);
  }
  const bulunan = new Map(); // `${genislik}|${başlık}` → adres
  for (const [genislik, kume] of gruplar) {
    const liste = [...kume];
    for (let k = 0; k < liste.length; k += 50) {
      const json = await sorgula(liste.slice(k, k + 50), genislik);
      const normal = new Map((json.query?.normalized || []).map((n) => [n.to, n.from]));
      for (const sayfa of json.query?.pages || []) {
        const bilgi = sayfa.imageinfo?.[0];
        if (sayfa.missing || !bilgi) continue;
        const baslik = (normal.get(sayfa.title) || sayfa.title).replace(/^File:/, '');
        bulunan.set(`${genislik}|${anahtar(baslik)}`, bilgi.thumburl || bilgi.url);
      }
      await bekle(300);
    }
  }
  const harita = {};
  const kayip = [];
  for (const i of istekler) {
    const cozulen = bulunan.get(`${i.genislik}|${anahtar(i.hedef)}`);
    harita[i.adres] = cozulen || ''; // '' = Commons'ta yok: istemci istek atmadan yer tutucu çizer
    if (!cozulen) kayip.push(i.adres);
  }
  fs.writeFileSync(CIKTI, JSON.stringify(harita, null, 1) + '\n');
  const degisen = istekler.filter((i) => harita[i.adres] && harita[i.adres] !== i.adres).length;
  console.log(`${adresler.length} adres · ${degisen} çözüldü/değişti · Commons'ta bulunamayan ${kayip.length}`);
  for (const a of kayip.slice(0, 12)) console.log('  bulunamadı: ' + a);
}

await main();
