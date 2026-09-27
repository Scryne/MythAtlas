// maplibre-gl 6 worker'ı import.meta.url'e göre arar; Next bu dosyayı paketlemediği için
// worker ve paylaşılan modül public/ altına kopyalanır, harita setWorkerUrl ile buraya bakar.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const dist = join(dirname(require.resolve('maplibre-gl/package.json')), 'dist');
const out = join(process.cwd(), 'public', 'vendor', 'maplibre');
mkdirSync(out, { recursive: true });
for (const file of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
  copyFileSync(join(dist, file), join(out, file));
}
