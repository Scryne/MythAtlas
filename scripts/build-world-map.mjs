// Dünya ülke sınırlarını istatistik haritaları için SVG yollarına çevirir.
// Kaynak: world-atlas@2.0.2 countries-110m.json (ISC, Mike Bostock; veri Natural Earth, kamu malı).
// Kullanım: node scripts/build-world-map.mjs <countries-110m.json>  →  src/data/world-110m.json
// Çalışma zamanında coğrafya kütüphanesi gerekmesin diye yollar önceden izdüşürülür (eşdikdörtgen, 84°K–58°G).
import { readFileSync, writeFileSync } from 'node:fs';

const WIDTH = 1000;
const NORTH = 84;
const SOUTH = -58;
const HEIGHT = Math.round((WIDTH * (NORTH - SOUTH)) / 360);

const kaynak = process.argv[2];
if (!kaynak) {
  console.error('Kullanım: node scripts/build-world-map.mjs <countries-110m.json>');
  process.exit(1);
}

const topo = JSON.parse(readFileSync(kaynak, 'utf8'));
const { scale, translate } = topo.transform;

// Nicemlenmiş, fark kodlu yayları mutlak boylam/enleme aç.
const arcs = topo.arcs.map((arc) => {
  let x = 0;
  let y = 0;
  return arc.map(([dx, dy]) => {
    x += dx;
    y += dy;
    return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
  });
});

function ring(indexes) {
  const points = [];
  indexes.forEach((index, i) => {
    const arc = index >= 0 ? arcs[index] : arcs[~index].slice().reverse();
    points.push(...(i === 0 ? arc : arc.slice(1)));
  });
  return points;
}

const project = ([lng, lat]) => [
  Math.round(((lng + 180) / 360) * WIDTH),
  Math.round(((NORTH - Math.max(SOUTH, Math.min(NORTH, lat))) / (NORTH - SOUTH)) * HEIGHT),
];

// Tarih değiştirme çizgisini kesen halkalar (Rusya, Fiji) ±180°'de sıçrar ve haritayı boydan boya çizer: boylamı
// sürekli hale getir, taşan halkayı bir de 360° kaydırılmış kopya olarak çiz (viewBox kırpar).
function unwrap(points) {
  const out = [];
  let offset = 0;
  points.forEach(([lng, lat], i) => {
    if (i > 0) {
      const delta = lng + offset - out[i - 1][0];
      if (delta > 180) offset -= 360;
      else if (delta < -180) offset += 360;
    }
    out.push([lng + offset, lat]);
  });
  return out;
}

function ringPaths(points) {
  const continuous = unwrap(points);
  const lngs = continuous.map(([lng]) => lng);
  const paths = [ringPath(continuous)];
  if (Math.max(...lngs) > 180) paths.push(ringPath(continuous.map(([lng, lat]) => [lng - 360, lat])));
  if (Math.min(...lngs) < -180) paths.push(ringPath(continuous.map(([lng, lat]) => [lng + 360, lat])));
  return paths;
}

function ringPath(points) {
  const projected = [];
  for (const point of points.map(project)) {
    const last = projected[projected.length - 1];
    if (!last || last[0] !== point[0] || last[1] !== point[1]) projected.push(point);
  }
  if (projected.length < 3) return '';
  return `M${projected.map(([x, y]) => `${x} ${y}`).join('L')}Z`;
}

const countries = [];
for (const geometry of topo.objects.countries.geometries) {
  const name = geometry.properties?.name;
  if (!name || name === 'Antarctica' || name === 'Fr. S. Antarctic Lands') continue;
  const polygons = geometry.type === 'Polygon' ? [geometry.arcs] : geometry.type === 'MultiPolygon' ? geometry.arcs : [];
  const d = polygons
    .flatMap((polygon) => polygon.flatMap((indexes) => ringPaths(ring(indexes))))
    .filter(Boolean)
    .join('');
  if (d) countries.push({ name, d });
}

countries.sort((a, b) => a.name.localeCompare(b.name, 'en'));

const output = {
  source: 'world-atlas@2.0.2 countries-110m (ISC, Mike Bostock); veri Natural Earth 1:110m, kamu malı',
  projection: { type: 'equirectangular', north: NORTH, south: SOUTH },
  width: WIDTH,
  height: HEIGHT,
  countries,
};

writeFileSync(new URL('../src/data/world-110m.json', import.meta.url), `${JSON.stringify(output)}\n`);
console.log(`world-110m.json: ${countries.length} ülke, ${WIDTH}×${HEIGHT}`);
