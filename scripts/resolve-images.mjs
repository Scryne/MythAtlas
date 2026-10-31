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
  // 2026-10-31: veride uydurulmuş ya da hiç var olmamış adlar; Commons'ta konuyla aranıp gözle doğrulandı.
  "Linear_B_tablet_Knossos.jpg": "Linear B plaque cretan administration Knossos AMH.jpg",
  "Gundestrupkedlen.jpg": "Gundestrupkedlen- 00054 (cropped).jpg",
  "Hallstatt_Culture_Objects.jpg": "Small terracotta of horse, Hallstatt culture, Museum of Western Bohemia, 187877.jpg",
  "Oseberg_ship.jpg": "Osebergskipet 2016.jpg",
  "Orphic_gold_tablet_Hipponion.jpg": "Orphic Gold Tablet (Hipponion-Museo Archeologico Statale Capialbi, Vibo Valentia).jpg",
  "Claude_Lévi-Strauss.jpg": "Claude Lévi-Strauss (1973).jpg",
  "Mircea_Eliade.jpg": "Mircea Eliade from Horia Photo 3 English (cropped).jpg",
  "Martin_Litchfield_West.jpg": "Martin Litchfield West in 1996.jpg",
  "Parthenon_frieze_BM.jpg": "Parthenon West Frieze Block VI.jpg",
  "Minoan_Snake_Goddess_Heraklion.jpg": "Snake Goddess Crete 1600BC.jpg",
  "Babylon_Ishtar_Gate.jpg": "Processional Way, Babylon - Google Art Project.jpg",
  "Codex_Borbonicus_page_13.jpg": "Codex Borbonicus (p. 13).jpg",
  "Sarah_Iles_Johnston.jpg": "Sarah Iles Johnston 2016.jpg",
  "Gregory_Nagy.jpg": "Gregory Nagy in front of Acropolis.jpg",
  "Georges_Dumezil.jpg": "Dumezil Georges.jpg",
  "Sir_James_George_Frazer.jpg": "Musée Ingres-Bourdelle - SIR JAMES GEORGE FRAZER (1854-1941) - Bronze - Antoine Bourdelle - Joconde000SC013124.jpg",
  "Sumerian_cuneiform_tablet.jpg": "Cuneiform tablet with Sumerian inscription, Ur III, Museum of Archaeology and Anthropology.jpg",
  "Olmec_Head_No_1.jpg": "Olmec Head No. 1.jpg",
  "Cliffs_of_Moher_on_a_sunny_day.jpg": "The Cliffs of Moher on a sunny day - Ed Fitzgerald.jpg",
  "Sigurd_kills_Fafnir_by_Arthur_Rackham.jpg": "Sigurd kills Fafnir by Rackham.jpg",
  "Library_of_Celsus,_Ephesus.jpg": "Ephesus Celsus Library Façade.jpg",
  "Theseus_Minotaur_BM_GR1843.11-3.28.jpg": "Theseus and the Minotaur 1843 bronze by Antoine-Louis Barye (IMGP2666r2e).jpg",
  "Edward_Hicks_-_Noah's_Ark.jpg": "Edward Hicks, American - Noah's Ark - Google Art Project.jpg",
  "Cornelis_van_Haarlem_-_The_Fall_of_the_Titans_-_Google_Art_Project.jpg": "Cornelis Cornelisz. van Haarlem - The Fall of the Titans - Google Art Project.jpg",
  "Angkor_Wat_temple.jpg": "Angkor Wat with its reflection (cropped).jpg",
  "Kurma_avatar_of_Vishnu.jpg": "Dasavataralu - Kurma avatar of Lord Vishnu on Sri Venkateshwara temple, Guntur.jpg",
  "Tallinn_old_town_from_toompea.jpg": "Tallinn Toompea Upper Old Town 2013.jpg",
  "Steppe_in_kazakhstan.jpg": "Steppe of western Kazakhstan in the early spring.jpg",
  "Göbekli_Tepe_site_(2).jpg": "Gobekli Tepe 2.jpg",
  "AM_738_4to_Ginnungagap.png": "AM 738 4to Yggdrasill.png",
  "Christian_Gottlieb_Kratzenstein,_Orpheus_and_Eurydice,_1806,_Ny_Carlsberg_Glyptotek,_Copenhagen_(36420346045).jpg": "Orpheus and Eurydice by Peter Paul Rubens.jpg",
  "Dangun_painting.jpg": "Portrait of Dangun.jpg",
  "Geirangerfjorden_from_Flydalsjuvet_2013.jpg": "View to Geiranger from Flydalsjuvet, 2013 June.jpg",
  "Joseph_Campbell.jpg": "Joseph Campbell at Feathered Pipe Ranch, Montana (cropped).jpg",
  "Inca_Viracocha.jpg": "Tiwanaku - Viracocha.jpg",
  "Hero_Twins.jpg": "Hunahpu and Xbalanque.jpg",
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
