// Statik dışa aktarım sonrası (MYTHATLAS_STATIC=1): Next 16 segment ön-yükleme dosyalarını klasör olarak yazıyor
// (`sites/__next.sites/__PAGE__.txt`), istemci ise noktayla birleşmiş düz adı istiyor (`sites/__next.sites.__PAGE__.txt`).
// Statik sunucuda bu, her gezinmede 404 ve konsol hatası demek. Her dosyanın düz adlı kopyası yanına yazılır, klasör de
// kalır. Aynı hata Portfolyo'da ölçülüp `scripts/duzlestir.mjs` ile çözülmüştü (2026-09); buradaki o dersin kopyası.
import { copyFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(import.meta.dirname, '../out');
if (!existsSync(OUT)) {
  console.log('out/ yok (sunucu derlemesi): düzleştirilecek segment yok');
  process.exit(0);
}

let count = 0;

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? files(full) : [full];
  });
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (!statSync(full).isDirectory()) continue;
    if (name.startsWith('__next.')) {
      for (const file of files(full)) {
        const relative = path.relative(full, file).split(path.sep).join('.');
        copyFileSync(file, path.join(dir, `${name}.${relative}`));
        count++;
      }
    } else if (name !== '_next' && name !== 'og' && name !== 'data') {
      walk(full);
    }
  }
}

walk(OUT);
console.log(`segment dosyası düzleştirildi: ${count}`);
