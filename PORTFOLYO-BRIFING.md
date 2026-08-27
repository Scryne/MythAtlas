# MythAtlas — Portföy Brifingi

> Bu dosya veri çıkarma çıktısıdır, pazarlama metni değildir. Her sayının yanında kaynağı
> vardır. Ölçülmemiş hiçbir şey sayı olarak yazılmamıştır.
>
> Üretim tarihi: 2026-08-09 · Üretim yöntemi: kod tabanı incelemesi + aşağıda belirtilen
> komutların bu oturumda çalıştırılması.

---

## 1. Künye

- **Ne yapar** — Dünya mitolojilerini, mitleri, tanrıları ve kutsal mekânları tek bir
  haritalı veri kümesinde birleştirip kültürler arası benzerlikleri karşılaştırmalı olarak
  gezilebilir hâle getiren bir web atlası.

- **Kimin için** — Koddan çıkarılabildiği kadarıyla: karşılaştırmalı mitolojiye ilgi duyan
  genel okur ve öğrenci. Akademisyen değil. Gerekçe: `/methodology` sayfası kaynak
  hiyerarşisi tanımlıyor ve `/bibliography` 69 akademik kaynağı listeliyor
  (`src/app/methodology/page.tsx`, `qa/reports/new-feature-audit.json` →
  `bibliography_entry_volume.entryCount: 69`), ama arayüz dili popüler anlatım
  (`src/app/page.tsx`, `src/components/layout/Footer.tsx`) ve alıntı üretici bir "kopyala"
  düğmesi (`src/components/CitationGeneratorButton.tsx`) — yani akademik iş akışına değil,
  meraklı okura yönelik.

- **Çalışma dönemi** — `git log --reverse` ve `git log -1` **aynı commit'i** veriyor:
  `e272c2b`, 2026-03-16. Depoda tek commit var (`git rev-list --count HEAD` → `1`).
  Bu tarih projenin çalışıldığı dönem **değil**, geçmişin ezildiği (squash) tarihtir.
  Gerçek çalışma dönemi commit geçmişinden **BİLİNMİYOR**.
  Elde olan tek dolaylı kanıt: QA raporlarının `generatedAt` damgaları
  (`2026-03-16T06:09:35Z`, `07:28:03Z`, `10:06:18Z`) — yani 16 Mart 2026'da en az dört
  saatlik aktif bir QA turu yapılmış. Ara verilmiş dönemler commit yoğunluğundan
  **çıkarılamıyor**, çünkü yoğunluk diye bir şey yok.

- **Rol** — `git shortlog -sn --all` → tek yazar, 1 commit. Yazar adı literal olarak
  **`Your Name`** — yani git kimliği yapılandırılmamış, gerçek katkı dağılımı bu depodan
  okunamıyor. Kod tabanında ikinci bir kişiye işaret eden iz yok (tek `CODEOWNERS` yok,
  PR şablonu jenerik). Pratik okuma: tek geliştirici.

- **Yığın** (mimariyi belirleyenler, `package.json` + kullanım doğrulaması):
  1. **Next.js 14 App Router** (14.2.35, build çıktısından) — 567 sayfanın 565'i statik
     ön-render.
  2. **TypeScript 5** — 91 `.ts`/`.tsx` dosyası (`git ls-files`: 69 tsx + 22 ts).
  3. **MapLibre GL 4** — ana harita yüzeyi, `src/components/map/MapPageClient.tsx`.
  4. **Statik JSON veri katmanı** — veritabanı yok; `.env.local.example` bunu açıkça
     yazıyor: "No external database connection required".
  5. **GeoJSON dosya kümesi** — depodaki en kalabalık dosya türü: 120 `.geojson`
     (`git ls-files | sed 's/.*\.//' | sort | uniq -c`).
  6. **Tailwind CSS 3 + Framer Motion 11** — tasarım ve geçişler.
  7. **Recharts 2 + d3-force 3** — istatistik grafikleri ve ağ/soyağacı düzenleri.
  8. **Playwright 1.58 + Lighthouse 13** — QA otomasyonu; test koşucusu olarak değil,
     elle yazılmış `.mjs` denetim betiklerinin sürücüsü olarak (bkz. §8).

- **Satır ve dosya sayısı** (`node_modules`, `.next`, üretilmiş çıktılar hariç):
  | Ölçüm | Değer | Komut |
  | --- | --- | --- |
  | Kod satırı (ts/tsx/mjs/js/css) | **22.843** | `find src qa scripts -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.mjs" -o -name "*.js" -o -name "*.css" \) -exec wc -l {} +` |
  | Kod dosyası | **99** | aynı `find` + `wc -l` |
  | Sadece `src/` ts+tsx | **19.183** | `find src -name "*.tsx" -o -name "*.ts" \| xargs wc -l` |
  | JSON veri satırı | **59.724** | `wc -l src/data/*.json data/*.json` |
  | Git'in izlediği toplam dosya | **254** | `git ls-files \| wc -l` |
  | `public/data` altındaki dosya | **126** | `find public/data -type f \| wc -l` |

  Not: Depodaki `build_error.log`, `dev-live.err` (1,1 MB), `dev-live.out`,
  `tsconfig.tsbuildinfo` ve `qa/reports/` diskte duruyor ama `.gitignore` kapsamında —
  254 sayısına dahil değiller. Yukarıdaki satır sayımlarına da dahil değiller.

- **Commit sayısı** — **1** (`git rev-list --count HEAD`).

---

## 2. Durum

### `GA öncesi`

**Gerekçe:** Ürün yüzeyi tamam ve yayın altyapısı kurulmuş, ama dağıtım yapılmamış ve
kullanıcıya yansıyan bilinen bir veri senkronizasyon hatası açık.

**Ölçülebilir ayrıntılar:**

- Üretim derlemesi bu oturumda çalıştırıldı: `npm run build` → **exit 0**, **567/567
  statik sayfa** üretildi (`Generating static pages (567/567)`).
- `npm run lint` bu oturumda çalıştırıldı → **"No ESLint warnings or errors"**.
- `npm run qa:data-integrity` bu oturumda çalıştırıldı → **totalIssues: 0**
  (36 mitoloji / 157 mit / 212 tanrı / 104 kutsal mekân).
- Kayıtlı `qa:new-feature` denetimi **40/40 kontrol geçiyor, 0 başarısız**
  (`qa/reports/new-feature-audit.json` → `summary.totalChecks: 40, failedChecks: 0`).
- Yayın altyapısı **var**: CI (`.github/workflows/ci.yml`), `sitemap.ts`, `robots.ts`,
  `manifest.ts`, OG görsel rotası (`src/app/og/[entity]/[id]/route.tsx`), service worker
  (`public/sw.js`, `CACHE_VERSION = 'mythatlas-v4'`), `SECURITY.md`, `CONTRIBUTING.md`,
  PR şablonu. Tek commit'in mesajı da bunu söylüyor: *"Initialize public MythAtlas
  repository with contributor standards"*.

**Neden `yayında` değil:** Dağıtım yapılandırması yok (`vercel.json` yok, deploy iş akışı
yok, CI yalnızca `qa:data-integrity` + `build` çalıştırıp duruyor), alan adı referansı yok.
Kodda geçen tek host `mythatlas.local` — o da proxy'nin User-Agent/Referer başlığında
(`src/app/api/image/route.ts:139,183`), gerçek bir adres değil.

**Neden `geliştirme` değil:** Yukarıdaki yayın altyapısının hepsi kurulu ve
`qa:release` adında bir sürüm kapısı tanımlı (`package.json`).

**Karşı kanıt — dürüstlük payı:**
- `public/data`, `src/data`'nın gerisinde: haritada **7 mitoloji, 10 tanrı, 2 mit
  eksik** (§6'da ölçümü var). Bu, kullanıcının gördüğü yüzeyi etkiliyor.
- Kayıtlı tarayıcı denetiminde **2 rota kendi eşiğinin altında**: `/scholars` 83 (eşik 88),
  `/archaeology` 67 (eşik 83) — `qa/reports/new-feature-browser-audit.json`.
- Ölü kod tabanda duruyor (§6, ikinci bulgu).
- README'nin gösterdiği ekran görüntüleri gerçek değil: `public/screenshots/home.svg`
  548 bayt, `map.svg` 737 bayt — yer tutucu vektörler.

---

## 3. Problem

**README'nin söylediği** (`README.md`, "Vision"): karşılaştırmalı mitoloji için görsel
açıdan zengin bir atlas kurmak; veriyi statik JSON dosyalarıyla açık ve katkıya uygun
tutmak; harita, detay ve analiz yüzeylerinde hızlı ve erişilebilir gezinme sağlamak.

**Kodun doğruladığı problem tanımı** — README ile çelişmiyor, onu daraltıyor. Kodun
gerçekte çözmeye çalıştığı acı şu: *mit karşılaştırması kaynak dağınıklığından dolayı
zahmetli.* Bir kullanıcı "Nuh Tufanı ile Utnapiştim aynı hikâye mi?" diye sorduğunda
bugünkü seçenekleri ayrı ayrı ansiklopedi maddeleri okumak ve benzerliği kafasında
kurmaktır. Bunu şu kod kanıtlıyor:

- `src/lib/dna.ts` — mitleri 20 anlatı öğesi, 12 arketip ve 11 yapısal evre üzerinden
  kodlayıp 0–100 arası bir benzerlik puanı üretiyor (`calculateDNASimilarity`).
- `src/app/compare/page.tsx` (649 satır) — iki mit/tanrıyı yan yana koyup puanlıyor.
- `src/lib/parallels-data.ts` + `data/mythology-connections.json` (45 bağlantı) —
  kültürler arası bağı *diffusion / convergent_evolution / common_ancestor / unknown*
  olarak etiketliyor ve her birine bir **tartışmalılık seviyesi** veriyor
  (`consensus` / `accepted` / `debated` / `fringe`, `src/lib/myth-data.ts:37`).

Yani ürünün asıl iddiası "mitolojileri listelemek" değil, **benzerlik iddiasını
kaynaklandırılabilir ve tartışmalılık derecesi etiketli biçimde sunmak.** Bunun kanıtı:
157 mitin **157'sinde** `academicSources` alanı dolu, **141'inde** yapılandırılmış
(sadece id değil, gerekçeli nesne) paralellik kaydı var — toplam 255 paralellik
referansı (`node` ile sayıldı, §8).

**Mevcut çözümler neden yetmiyor** — bu soruya kodda **doğrudan bir cevap yok**. Rakip
analizi, karşılaştırma tablosu veya "neden Wikipedia yetmiyor" diyen bir metin bulamadım.
Yukarıdaki tartışmalılık-etiketi mekanizması dolaylı bir cevaptır (ansiklopedi maddeleri
bir benzerlik iddiasının ne kadar kabul gördüğünü yapılandırılmış biçimde vermez), ama
bunu ürün **iddia etmiyor**; ben koddan çıkardım. Portföyde bu cümleyi kurmak istersen
kaynağı sensin, kod değil.

**Ayrışma var mı:** README ile kod arasında yön ayrışması **yok**. README'nin "katkıya
uygun" iddiası ise kodla kısmen çelişiyor — 44.233 satırlık tek bir `myths.json`
dosyasına PR açmak pratikte çakışma üretir (§5, Karar 1'in bedeli).

---

## 4. Sistem

### Ana bileşenler ve sorumluluk sınırları

| Bileşen | Sorumluluk | Sınır ihlali var mı |
| --- | --- | --- |
| `src/data/*.json` | Kanonik veri kümesi (36/157/212/104 kayıt) | **Evet** — türetilmiş `dna` alanı da aynı dosyaya yazılıyor (§5, Karar 3) |
| `src/lib/myth-data.ts` (652 satır) | Tip tanımları + JSON'ları import edip normalize eden tek giriş noktası | Hayır |
| `src/lib/dna.ts` (235 satır) | Benzerlik puanı, parmak izi, DNA sorgu filtresi | Hayır — saf fonksiyonlar, yan etkisiz |
| `src/lib/insights.ts` (825 satır) | İstatistik ve "ilginç bilgi" türetmeleri | Hayır |
| `src/components/map/MapPageClient.tsx` (**2.823 satır**) | **Her şey**: harita başlatma, 5 katman yönetimi, 6 ayrı filtre boyutu, arama paneli, lejant, paralellik animasyonu, ısı haritası, URL senkronizasyonu | **Evet — tek dosyada toplanmış tanrı bileşeni.** 2. en büyük dosyanın (935 satır) üç katı. |
| `src/app/api/image/route.ts` (317 satır) | Wikimedia görsel proxy'si: SSRF kalkanı, eşzamanlılık sınırı, yeniden deneme, Commons API ile ad çözümleme | Hayır ama tek dinamik rota olduğu için tam statik dışa aktarımı engelliyor |
| `qa/*.mjs` (4 betik, ~76 KB) | Veri bütünlüğü, özellik denetimi, tarayıcı denetimi, tam QA | Hayır |

### Veri akışı

1. **Girdi** — `src/data/*.json` elle düzenlenir (veritabanı, admin paneli, içe aktarma
   hattı yok).
2. **Zenginleştirme** — `scripts/generate-myth-dna.mjs` (304 satır) `myths.json`'u okur,
   metinden anahtar sözcük çıkarımıyla `dna` bloğu üretir ve **aynı dosyanın üzerine
   yazar** (`await writeFile(mythsPath, ...)`, betiğin son satırları).
3. **Sunucu tarafı** — `src/lib/myth-data.ts` JSON'ları doğrudan `import` eder; Next
   derleme anında 567 sayfayı ön-render eder. Çalışma anında veri okuma yok.
4. **İstemci tarafı** — yalnızca harita, `public/data/by-mythology/manifest.json`'u ve
   ardından seçilen mitolojinin 4 geojson dosyasını `fetch` eder
   (`MapPageClient.tsx:832,1232-1235`). Tembel yükleme.
5. **Ayna** — `public/data`, `src/data`'nın **elle tutulan** kopyasıdır. Üreten bir betik
   yoktur (`grep -rn "public/data" scripts qa package.json src` → yalnızca
   `qa/fix-data-integrity.mjs`'nin bir log satırı). Sapma ölçüldü, §6'da.
6. **Çıktı** — statik HTML + service worker önbelleği (`public/sw.js`, 20 çekirdek varlık
   ön-önbelleğe alınıyor) + `/api/image` üzerinden akan görsel baytları.

### Dış bağımlılıklar

- **upload.wikimedia.org** — 509 kayıtlı görselin **509'u** buradan
  (`imageUrl` alanı olan kayıt sayısı = toplam kayıt sayısı; 506'sı `/thumb/` yollu).
  Sertlik: yok, kritik yol.
- **commons.wikimedia.org/w/api.php** — bozuk dosya adlarını çözmek için MediaWiki
  arama/imageinfo API'si (`route.ts:38`).
- **Veritabanı: yok. Kuyruk: yok. Model/LLM: yok. Kimlik doğrulama: yok. Ödeme: yok.**
- Harita altlığı: MapLibre GL, stil tanımı `MapPageClient.tsx` içinde
  (üçüncü parti tile anahtarı gerektirmiyor — `.env.local.example` boş).

### Diyagram önerisi — 8 kutu

```
[1 src/data JSON]  →  [2 generate-myth-dna.mjs]  →  (1'e geri yazar)
[1] → [3 myth-data.ts]  → [4 Next derleme (567 statik sayfa)] → [5 Tarayıcı]
[1] ⇢ [6 public/data + geojson]  → (istemci fetch) → [7 MapLibre harita]  → [5]
[8 Wikimedia] ← [9 /api/image proxy] → [5]
```

Kutular: **1** `src/data` (kanonik JSON) · **2** DNA üreteci · **3** `myth-data.ts` veri
katmanı · **4** Next statik derleme · **5** Tarayıcı · **6** `public/data` ayna +
geojson · **7** MapLibre harita istemcisi · **8** Wikimedia Commons · **9** `/api/image`
proxy.

Dokuz kutu oldu, sınırda. Sıkışırsan **2**'yi (DNA üreteci) çıkar — akışın parçası ama
çalışma anında yok. **1 → 6** okunu kesik çizgi yap: o ok otomatik değil, elle kopyalama
(ve §6'nın konusu).

---

## 5. Kritik kararlar

### Karar 1 — Veritabanı yerine derleme anında import edilen statik JSON

- **Seçim:** Tüm içerik `src/data/*.json` içinde; `myth-data.ts` bunları doğrudan
  `import` ediyor; 567 sayfa derleme anında ön-render ediliyor. Çalışma anı veri erişimi
  sıfır. `.env.local.example` bunu politika olarak yazıyor: *"No external database
  connection required."*
- **Alternatif:** SQLite/Postgres + bir içerik yönetim katmanı (ya da Contentlayer/MDX
  gibi dosya-tabanlı ama derlenmiş bir şema katmanı). 509 kayıt ve ilişkisel çapraz
  referanslar (mit↔tanrı↔mekân) bunu fazlasıyla haklı çıkarırdı.
- **Gerekçe:** Bedava barındırma ve sıfır işletme. Sunucu yok, migration yok, yedek yok.
  Sunucu 282 ms'de ayağa kalkıyor (bu oturumda ölçüldü: `✓ Ready in 282ms`). CI'ın
  tamamı `npm ci && qa:data-integrity && build` — üç adım.
- **Bedel:** Üç somut kayıp:
  1. Tek bir kelime düzeltmek 567 sayfayı yeniden derletiyor.
  2. `myths.json` **44.233 satır** tek dosya. README'nin "katkıya uygun"
     (`contribution-friendly`) iddiası burada kırılıyor — iki katkıcının paralel PR'ı
     neredeyse kesin çakışır. Bu, projenin kendi belirttiği hedefiyle çelişen bir bedel.
  3. Çapraz referans bütünlüğünü veritabanı yerine **elle yazılmış 18 KB'lık bir denetim
     betiği** (`qa/data-integrity-check.mjs`) koruyor. Yabancı anahtar kısıtı yerine
     CI'da çalışan bir betik.

### Karar 2 — Wikimedia görsellerini indirmek yerine kendi proxy'sinden akıtmak

- **Seçim:** `src/app/api/image/route.ts` — Commons dışındaki her kaynağı 400 ile reddeden
  bir izin listesi, 2 eşzamanlı yukarı akış isteği sınırı, 3 denemeli geri çekilmeli
  yeniden deneme (429/5xx için), 30 günlük `revalidate`, ve dosya adı bozulmuşsa
  MediaWiki arama API'siyle bulanık ad çözümleme + 6 kayıtlık elle yazılmış
  `COMMONS_TITLE_OVERRIDES` tablosu.
- **Alternatif:** 509 görseli bir kez indirip `public/images/` altına koymak ve depoya
  (veya bir CDN'e) almak. Lisans notlarını da yanlarında tutmak.
- **Gerekçe:** Depo boyutu ve telif. Görseller indirilip dağıtılmadığında yeniden yayım
  sorumluluğu doğmuyor; kaynak Commons'ta kalıyor. Ayrıca §6'daki 429 dalgasını
  eşzamanlılık sınırıyla söndürmenin en kısa yolu buydu.
- **Bedel:** Dört kayıp:
  1. **Statik dışa aktarım öldü.** `/api/image` derleme tablosunda `ƒ (Dynamic)` —
     proje artık salt statik bir CDN'e konamaz, Node çalıştıran bir ortam gerekiyor.
  2. **Next görsel optimizasyonu bypass ediliyor.** `AncientImage.tsx` proxy URL'leri için
     `unoptimized` bayrağını açıyor. Sonuç bu oturumda ölçüldü: `/thumb/` yollu bir
     istek 346 KB döndü, `/thumb/` yolu olmayan bir dosya adı **9,6 MB** döndü
     (`Rosetta_Stone.JPG`, 4,27 s). Boyut tavanı yok. Veri kümesinde böyle 3 kayıt var.
  3. **6 satırlık elle bakım borcu.** `COMMONS_TITLE_OVERRIDES` — Commons'ta bir dosya
     daha yeniden adlandırılırsa tabloya elle satır eklemek gerekiyor.
  4. Çalışma anı dış servis bağımlılığı: Commons yavaşlarsa görseller yavaşlar.

### Karar 3 — Mit "DNA"sını elle kodlamak yerine metinden çıkarımla üretmek

- **Seçim:** `scripts/generate-myth-dna.mjs`, her mitin `name + type + summary +
  significance + characters + themes + tags` alanlarını tek bir metne indirger, anahtar
  sözcük eşlemesiyle 20 öğe / 12 arketip / 11 yapısal evre atar, ayrıca `moralLesson`,
  `emotionalCore`, `cosmicScope` ve `originTheory` türetir. 157 mitin **157'sinde**
  `dna` alanı dolu.
- **Alternatif:** Elle kodlama — 157 mit × ~5 alan, karşılaştırmalı mitoloji
  literatürüne bakılarak. Ya da hiç puanlamayıp yalnızca elle yazılmış 45 bağlantıyı
  (`mythology-connections.json`) göstermek.
- **Gerekçe:** Ölçek. 157 miti elle kodlamak günler alır; betik tek komutta yapıyor ve
  yeni mit eklendiğinde yeniden çalıştırılabiliyor. Puanlayıcının davranışı testlerle
  sabitlenmiş: `qa/new-feature-audit.mjs` simetri, sınır, boş-küme ve sıralama
  kontrolleri dahil 13 DNA kontrolü çalıştırıyor, hepsi geçiyor.
- **Bedel:** Üç kayıp:
  1. **Kaynak veri ile türetilmiş veri aynı dosyada.** Betik `myths.json`'un üzerine
     yazıyor. `dna` alanına elle yapılan her düzeltme, betik bir daha koşturulduğunda
     sessizce silinir. Ayrımı koruyan bir işaret yok.
  2. **Epistemik bedel:** Ekranda görünen "%79 benzerlik" (Prometheus–Maui,
     `new-feature-audit.json`) bir anahtar sözcük artefaktıdır, filolojik bir bulgu
     değil. Proje `/methodology` sayfasıyla akademik ciddiyet iddia ediyor; bu puanın
     nasıl üretildiğini kullanıcıya söyleyen bir uyarı arayüzde **bulamadım**.
  3. Çıkarım metne bağlı olduğu için özetin üslubu puanı değiştirir — aynı miti başka
     kelimelerle yazmak DNA'sını değiştirir.

### Karar 4 — `public/data`'yı üretmek yerine elle aynalamak

- **Seçim:** Haritanın istemci tarafında çektiği veri (`public/data`, 126 dosya, 120
  geojson) `src/data`'dan **elle** kopyalanıyor. Üreten bir betik yok.
- **Alternatif:** Derleme öncesi çalışan 30–50 satırlık bir `sync-public-data.mjs`
  (`prebuild` kancasına bağlı), ya da geojson'u tamamen çalışma anında `src/data`'dan
  türetmek.
- **Gerekçe:** Koddan okunabilen bir gerekçe **yok**. En makul açıklama: geojson'lar bir
  kez elle hazırlandı ve otomasyon hiç yazılmadı. Bunu bir tasarım kararı olarak değil,
  ertelenmiş iş olarak sunmak daha dürüst olur.
- **Bedel:** Ölçüldü ve **şu anda canlı bir hata**: `public/data`, `src/data`'nın
  gerisinde — 7 mitoloji, 10 tanrı, 2 mit eksik. Ayrıntı ve ölçüm §6'da.

---

## 6. Zorlandığım yer

> **Önemli sınırlama:** Prompt commit karmaları istiyor. Bu depoda **tek commit var**
> (`e272c2b`) ve geçmiş ezilmiş. Dolayısıyla "şu commit'te kırıldı, şu commit'te
> düzeldi" zinciri **kurulamıyor**. Aşağıdaki iki bulgu commit geçmişinden değil,
> çalışma günlüklerinden, QA raporlarından ve kodda duran savunma katmanlarından
> çıkarıldı. Her iddianın yanında hangi dosyanın kaçıncı satırından geldiği yazıyor.
> Kronolojiyi sen doğrulamalısın.

### Bulgu 1 (birincil) — "Wikimedia dosya URL'leri kalıcı tanımlayıcıdır" varsayımı

**Nasıl fark edildi.** `dev-live.err` (1,1 MB, 11.816 satır) içinde `upstream image
response failed` kalıbı sayıldı: **51 farklı görsel URL'si** başarısız olmuş. Durum
kodlarının dağılımı yanlış varsayımın iki ayrı yüzünü gösteriyor:

| Durum | Olay sayısı | Ne anlama geliyor |
| --- | --- | --- |
| **429** | 204 | Wikimedia hız sınırı — toplu render sırasında aynı anda çok istek |
| **404** | 11 | Dosya Commons'ta yeniden adlandırılmış veya silinmiş |

En çok tekrar edenler: `Taj_Mahal_*.JPG` (12 kez), `Pantheon_Roma_2.jpg` (8),
`Boudhanath-*.jpg` (8), `Mesa_Verde_*.jpg` (6).

**Kök sebep.** İki ayrı hata tek belirti üretmiş:
1. 509 kaydın 509'unda sabit kodlanmış Wikimedia URL'si var. Next'in görsel
   iyileştiricisi 567 sayfayı render ederken bunlara **paralel** gidiyor; Commons bunu
   kötüye kullanım sayıp 429 dönüyor. Yani hata veride değil, **eşzamanlılıkta**.
2. Commons'ta dosya adları değişebilir. `Pantheon_Roma_2.jpg` gibi adresler zamanla
   404 olmuş. Veri kümesi URL'yi kimlik sanmış; oysa Commons'ta kimlik **dosya
   başlığıdır**, URL değil.

**Nasıl çözüldü.** `src/app/api/image/route.ts` bu iki soruna iki ayrı katman koyuyor:
- 429 için: `MAX_CONCURRENT_UPSTREAM_FETCHES = 2` (kuyruklu semafor,
  `withUpstreamSlot`), `RETRYABLE_STATUSES` = {429,500,502,503,504}, `MAX_ATTEMPTS = 3`,
  artan bekleme (`sleep(250 * attempt)`), 15 s zaman aşımı, 30 günlük `revalidate` ve
  `s-maxage=2592000` önbellek başlığı.
- 404 için: önce 6 kayıtlık `COMMONS_TITLE_OVERRIDES` tablosu, sonra MediaWiki
  `imageinfo` ile doğrudan başlık denemesi, o da tutmazsa Commons arama API'siyle
  **bulanık eşleme** — jetonlaştırma, durak kelime elemesi ve `queryCoverage * 0.75 +
  candidateCoverage * 0.25` ağırlıklı bir puan; 0,6 eşiğinin altı reddediliyor
  (`findBestCandidateTitle`).
- İstemci tarafında son savunma: `AncientImage.tsx` birincil kaynak patlarsa ikincile
  düşüyor, o da patlarsa görsel yerine sembollü bir yer tutucu çiziyor — kırık ikon yok.

**Sonrasında ne değişti.** Bu oturumda üretim sunucusunu ayağa kaldırıp ölçtüm:

| İstek | Sonuç |
| --- | --- |
| `Pantheon_Roma_2.jpg` (günlükte 8 kez patlayan dosya) | **200**, 237 KB, 0,41 s |
| `800px-Peter_Paul_Rubens_-_Prometheus_Bound.jpg` (tipik kayıt) | **200**, 347 KB, 1,32 s |
| `example.com` kaynaklı istek | **400** `unsupported_src` |
| `src` parametresiz istek | **400** `missing_src` |

Yani günlükte 404 veren dosya bugün override tablosu üzerinden 200 dönüyor — düzeltmenin
işe yaradığı doğrulanmış durumda. Ayrıca üretim derlemesine karşı koşturulan QA turunda
(`qa/reports/full-qa-report.json`, 28 rota denetimi) **0 istek hatası, 0 sayfa hatası**
var.

**Kalan bedel:** Çözüm hız sınırını yendi ama boyut tavanı koymadı — §5 Karar 2'deki
9,6 MB'lık istek hâlâ mümkün.

### Bulgu 2 (ikincil) — yarım bırakılmış iki dilli veri modeli

Prompt'un aradığı "iki farklı yaklaşımın kodda birlikte durması" kalıbının net örneği.

**İz.** Proje iki dilli bir `Culture` modeliyle başlamış, sonra tek dilli `Mythology`
modeline geçmiş ve eskisini silmemiş. Tabanda hâlâ duranlar:

- `src/data/cultures.json` — **6 kayıt**, `name`/`description` alanları `{tr, en}`
  yapısında. `src/data/mythologies.json` ise **36 kayıt**, düz tek dilli.
- `src/hooks/useCultures.ts` ve `src/hooks/useMyths.ts` — **ölü kod**. `grep -rn
  "useCultures\|useMyths" src` → `src/hooks/` dışında **sıfır** kullanım. (Karşılaştırma:
  `useBodyScrollLock` gerçekten `Modal.tsx:59`'da kullanılıyor.)
- İki köprünün de aynı satırında aynı itiraf var:
  `name: { en: m.name, tr: m.name }, // TODO: add Turkish translations` — yani çeviri
  varmış gibi görünen bir kabuk, İngilizceyi `tr` alanına kopyalıyor.
- `/culture/[id]` rotası hâlâ derleniyor: 36 sayfa üretiyor ve gövdesi tek satır —
  `redirect(`/mythology/${params.id}`)`. Yani **567 statik sayfanın 36'sı yalnızca
  yönlendirme kabuğu.**
- Service worker (`public/sw.js:19`) `/data/cultures.json` dosyasını hâlâ ön-önbelleğe
  alıyor — arayüzde onu okuyan hiçbir kod yok.

**Bugünkü sonuç:** Ürün tek dilli. Arayüz metinleri Türkçe ama **diyakritiksiz**
(örn. `AncientImage.tsx`: "Gorsel su anda goruntulenemiyor"; `dna.ts`: "Anlatinin
kulturel temaslar... yayildigi gorusu"), veri içeriği ise İngilizce — `mythologies.json`
açıklamaları İngilizce, `era` alanı Türkçe (`"MÖ 2000 – MS 400"`). Aynı kayıtta iki dil.
Portföyde ekran görüntüsü alırken bu görünecek; şimdiden bilmen iyi olur.

### Bulgu 3 (ölçüm) — elle aynalanan `public/data` sapmış durumda

§5 Karar 4'ün bedeli. Ölçüm (`src/data` ve `public/data` id kümelerinin farkı):

| Küme | `src/data` | `public/data` | Eksik | Eksik id örnekleri |
| --- | --- | --- | --- | --- |
| Mitoloji | 36 | 29 | **7** | `sumerian`, `babylonian`, `biblical-hebrew`, `proto-indo-european`, `hellenistic-syncretic`, `southeast-asian`, `estonian` |
| Tanrı | 212 | 202 | **10** | `inanna`, `dyeus`, `dyaus-pitr`, `tiwaz`, `attis`, `adonis`, `mithras`, `sol-invictus`, `el`, `yahweh` |
| Mit | 157 | 155 | **2** | `noah-flood`, `apollo-python` |
| Kutsal mekân | 104 | 104 | 0 | — |

**Kasıtlı filtre değil, sapma.** Üç gerekçe:
1. Eksik kayıtların şeması eksiksiz — `sumerian` da `greek` de aynı 14 alana sahip,
   ikisinin de `origin` koordinatı ve `boundingBox`'ı var. Haritaya konamayacak bir
   yanları yok.
2. Eksiklerin arasında `apollo-python` (bir **Yunan** miti) ve `adonis` (bir **Yunan**
   tanrısı) var — oysa `greek` mitolojisi `public/data`'da mevcut. Bir kural bunları
   dışarıda bırakmıyor; kopyalama yapılmamış.
3. Eksik tanrıların çoğu (`inanna`, `dyeus`, `tiwaz`, `attis`, `el`) tam da soyağacı ve
   tanrı-evrimi özelliğinin kullandığı köken zinciri kayıtları — yani **sonradan eklenen
   parti**. `new-feature-audit.json` bunların zincirini doğruluyor
   (`inanna → ishtar-deity → astarte → aphrodite → venus`). Özellik `src/data`'yı
   büyütmüş, ayna güncellenmemiş.

**Kullanıcıya yansıması:** Harita `manifest.json`'daki listeye göre çalışıyor
(`MapPageClient.tsx:832`) ve o manifest **29 mitoloji** içeriyor. Yani harita
yüzeyinde 36 mitolojinin 29'u var; 7'si yok. Detay sayfaları ise `src/data`'dan
render edildiği için 36'sı da açılıyor. İki yüzey birbirini tutmuyor.

**Neden `qa:data-integrity` bunu yakalamıyor:** O betik `src/data` içindeki çapraz
referansları doğruluyor (bu oturumda çalıştırıldı: `totalIssues: 0`), iki dizin
arasındaki eşitliği **kontrol etmiyor**. Denetim gerçek ama kapsamı bu deliği içermiyor.

---

## 7. Ekran görüntüsü hazırlığı

### Yerelde ayağa kalkıyor mu? — **Evet, denendi.**

Bu oturumda çalıştırılan tam zincir ve sonuçları:

```bash
npm install          # zaten kurulu (node_modules mevcut)
npm run lint         # ✔ No ESLint warnings or errors
npm run qa:data-integrity   # totalIssues: 0
npm run build        # exit 0 — 567/567 statik sayfa
npx next start -p 3312      # ✓ Ready in 282ms
```

Rota doğrulaması (`curl -o /dev/null -w "%{http_code}"`):

| Rota | HTTP |
| --- | --- |
| `/` | 200 |
| `/map` | 200 |
| `/mythology/greek` | 200 |
| `/myth/prometheus-fire` | 200 |
| `/stats` | 200 |
| `/api/image?src=<commons thumb>` | 200 (347 KB) |

Ortam: Node **v24.18.0** (yerel), Windows 11. CI ise Node **20** kullanıyor
(`.github/workflows/ci.yml`). İkisi de sorun çıkarmadı ama portföy için derleme
yaparsan bu farkı bil.

### Ön koşullar

**Uygulamanın açılmasını engelleyen hiçbir ön koşul yok.** Bu, projenin en kolay
tarafı:

- **Veritabanı:** yok.
- **Migration:** yok.
- **Ortam değişkeni:** yok. `.env.local.example` toplam iki satır ve içeriği bunu açıkça
  söylüyor: *"No external database connection required; all data is served from local
  JSON files."* `.env.local` dosyası olmadan `build` ve `start` sorunsuz çalışıyor
  (bu oturumda doğrulandı).
- **Ödeme sağlayıcı / kimlik doğrulama anahtarı:** yok, böyle bir özellik yok.
- **Harita tile anahtarı:** gerekmiyor.
- **Tek harici bağımlılık: internet erişimi.** İnternetsiz ortamda uygulama açılır ve
  gezilir, ama **her görsel yer tutucuya düşer** (`AncientImage.tsx` hata durumunda
  sembollü kutuyu çiziyor). Ekran görüntüsü alacaksan internet şart.

### Demo veri var mı? — **Evet, tam veri depoda.**

Seed betiğine, fixture'a veya sahte veri üretimine **ihtiyaç yok**. 36 mitoloji, 157 mit,
212 tanrı, 104 kutsal mekân, 45 kültürler-arası bağlantı, 8 tanrı soy zinciri ve 69
akademik kaynak `git ls-files` kapsamında, depoda hazır. Üretme maliyeti: **sıfır.**

Tek hazırlık işi görsellerin ısınması: ilk gezinmede `/api/image` her görseli Commons'tan
çekiyor (ölçüldü: 0,4–1,3 s). Ekran görüntüsü almadan önce ilgili sayfaları bir kez
gezip önbelleği doldur, yoksa yükleme yer tutucuları kadraja girer.

### Ekran görüntüsü alınabilecek anlamlı ekranlar

Beş öneri, önem sırasına göre:

1. **`/map`** — Ürünün kimliği. 5 katman, 6 filtre boyutu, kümeleme, paralellik
   animasyonu ve ısı haritası burada. Neyi kanıtlar: bunun bir liste sitesi değil bir
   atlas olduğunu.
   *Uyarı:* Bu rota ilk yüklemede **562 kB** JS (derleme tablosundaki en ağır rota) ve
   ölçülen Lighthouse performansı **38** — ekran görüntüsü için sorun değil, ama
   portföyde "hızlı" iddiası kurma.
   *İkinci uyarı:* Haritada 36 mitolojinin **29'u** görünecek (§6, Bulgu 3).

2. **`/compare`** — İki miti yan yana koyup DNA benzerlik puanı veren ekran. Neyi
   kanıtlar: ürünün asıl iddiasını, yani karşılaştırmanın ölçülebilir hâle getirilmesini.
   Hazır ön ayar düğmeleri var ve QA'de beşi de puan gösteriyor
   (`Noah`, `Prometheus`, `Zeus`, `Herk`, `Osiris` — `full-qa-report.json` →
   `interactionChecks.compare.presets`). En temiz kare: **Noah × Utnapishtim, puan 100**
   (denetimde doğrulanmış değer).

3. **`/parallels`** — 45 kültürler-arası bağlantının *diffusion / convergent /
   common_ancestor* etiketleriyle ve tartışmalılık seviyesiyle sunulduğu ekran. Neyi
   kanıtlar: projenin benzerlik iddialarını körü körüne değil, dereceli sunduğunu — §3'te
   anlattığım asıl ayrım. Lighthouse performansı 87, en temiz rotalardan.

4. **`/site/parthenon`** (veya `/site/giza-pyramids`) — Detay sayfası: sekmeli arkeoloji
   bloğu, mini konum haritası, koordinat kopyalama, akademik kaynaklar. Neyi kanıtlar:
   veri derinliğini — 104 mekânın **104'ünde** arkeoloji bloğu ve koordinat var, 42 ülkeye
   yayılıyorlar. Koordinat doğruluğu denetlenmiş: Parthenon 0,33 km, Giza 0,41 km,
   Machu Picchu 0,64 km sapma (`new-feature-audit.json → archaeologyDataIntegrity`).

5. **`/family-tree`** veya **`/stats`** — İlki d3-force ile mitolojiler arası etki
   ağını, ikincisi 12 civarı Recharts grafiğini ve koroplet haritaları gösteriyor. Neyi
   kanıtlar: veri görselleştirme yüzeyinin genişliğini. `/family-tree` erişilebilirlik
   puanı 100 (`new-feature-browser-audit.json`).
   *Kaçınılacak:* `/archaeology` — denetimde kendi eşiğinin altında (67 vs 83) ve
   `/scholars` (83 vs 88).

### Gerçek veri riski — **Yok.**

- Depodaki veri tamamen kamuya açık mitoloji ve arkeoloji içeriği. Kişisel veri yok,
  müşteri verisi yok, kurum verisi yok.
- Kimlik doğrulama, kullanıcı hesabı, form gönderimi veya analitik toplama yok —
  yani ekranda görünebilecek "birine ait" hiçbir kayıt yok.
- Demo veriyle doldurma ihtiyacı **yok**; bulanıklaştırma ihtiyacı **yok**.
- Tek istisna geliştirici ortamı: `dev-live.err` ve `build_error.log` dosyaları senin
  mutlak Windows yolunu (`C:\Users\scryn\...`) içeriyor. `.gitignore` kapsamındalar,
  depoya girmiyorlar — ama terminal görüntüsü paylaşırsan yol görünür.

---

## 8. Ölçülebilir ne varsa

Yalnızca kanıtı olanlar. "Bu oturumda" = brifing üretilirken çalıştırıldı;
"kayıtlı rapor" = depoda duran, 2026-03-16 tarihli QA çıktısı.

### Derleme ve statik analiz

| Ölçüm | Değer | Kanıt |
| --- | --- | --- |
| Üretim derlemesi | **başarılı (exit 0)** | `npm run build`, bu oturumda |
| Üretilen statik sayfa | **567 / 567** | build çıktısı: `✓ Generating static pages (567/567)` |
| ESLint | **0 uyarı, 0 hata** | `npm run lint`, bu oturumda |
| Next.js sürümü | 14.2.35 | build çıktısı |
| Sunucu açılış süresi | **282 ms** | `npx next start`, bu oturumda: `✓ Ready in 282ms` |
| Ortak JS (tüm sayfalar) | 87,8 kB | build rota tablosu |
| En ağır rota | `/map` — 225 kB sayfa, **562 kB** ilk yükleme | build rota tablosu |
| En hafif anlamlı rota | `/methodology` — 96,9 kB | build rota tablosu |

### Veri bütünlüğü ve denetimler

| Ölçüm | Değer | Kanıt |
| --- | --- | --- |
| Veri bütünlüğü sorunu | **0** (yinelenen id 0, kırık çapraz referans 0, içerik kalitesi 0) | `npm run qa:data-integrity`, bu oturumda |
| Özellik denetimi | **40 / 40 geçti, 0 başarısız** | kayıtlı `qa/reports/new-feature-audit.json` → `summary` |
| — DNA algoritma kontrolü | 13 kontrol (simetri, sınır, boş küme, sıralama, parmak izi uzunluğu) | aynı dosya → `checks.dnaAlgorithm` |
| — Soyağacı bütünlüğü | 12 kontrol | aynı dosya → `checks.familyTreeDataIntegrity` |
| — Akademik kaynak nokta kontrolü | 5 kontrol | aynı dosya → `checks.academicDataIntegrity` |
| — Coğrafi doğruluk | 3 kontrol, sapma 0,33–0,64 km | aynı dosya → `checks.archaeologyDataIntegrity` |
| Rota denetimi (üretim derlemesine karşı) | 28 rota × 4 görünüm penceresi; **0 sayfa hatası, 0 istek hatası, 0 taşma** | kayıtlı `qa/reports/full-qa-report.json` → `routeAudits` |

> **Test hakkında dürüst not:** Bu projede birim testi veya test koşucusu **yok**.
> Yukarıdaki 40 "kontrol", elle yazılmış `.mjs` denetim betiklerinin ürettiği
> doğrulamalardır. Playwright bağımlılık olarak var ve `qa/new-features.playwright.spec.js`
> (69 satır) mevcut, ama `package.json`'da onu çalıştıran bir script **yok** —
> `qa:browser` kendi Playwright sürücüsünü çağırıyor. "Test kapsamı" ölçümü
> **BİLİNMİYOR**; kapsam aracı kurulu değil. Portföyde "test" kelimesini kullanacaksan
> "denetim betiği" demek daha doğru olur.

### Lighthouse (kayıtlı ölçüm, üretim derlemesi, 2026-03-16)

`qa/reports/full-qa-report.json → lighthouse`:

| Rota | Performans | Erişilebilirlik | En iyi pratik | SEO |
| --- | --- | --- | --- | --- |
| `/` | 65 | **100** | 96 | 100 |
| `/map` | **38** | 96 | 100 | 100 |
| `/mythology/greek` | 82 | **100** | 96 | 100 |
| `/myth/mesopotamian-flood` | 71 | 95 | 100 | 100 |
| `/parallels` | **87** | **100** | 100 | 100 |
| `/stats` | 83 | **100** | 100 | 100 |

Okuma: **erişilebilirlik ve SEO güçlü** (6 rotanın 4'ünde a11y 100, hepsinde SEO 100),
**performans dalgalı** ve haritada zayıf. Portföyde iddia edilecek taraf a11y/SEO.

İkinci kayıtlı tur (`new-feature-browser-audit.json`, 7 rota, kendi eşikleriyle):
5 rota geçiyor (`/dna`, `/family-tree`, `/family-tree/deities`, `/bibliography`,
`/sites` — hepsi 100), **2 rota kalıyor**: `/scholars` 83 (eşik 88), `/archaeology`
67 (eşik 83).

### Veri hacmi

`node` ile doğrudan sayıldı (BOM temizlenerek):

| Ölçüm | Değer |
| --- | --- |
| Mitoloji | 36 |
| Mit | 157 |
| Tanrı | 212 |
| Kutsal mekân | 104 |
| Kültürler arası bağlantı | 45 |
| Tanrı evrim zinciri | 8 |
| Ayrı akademik kaynak | 69 |
| Kutsal mekânların kapsadığı ülke | 42 |
| DNA bloğu olan mit | **157 / 157** |
| Akademik kaynağı olan mit | **157 / 157** |
| Yapılandırılmış paralellik kaydı olan mit | 141 / 157 |
| Toplam paralellik referansı | 255 |
| Eşdeğeri tanımlı tanrı | 158 / 212 |
| Arkeoloji bloğu + koordinatı olan mekân | **104 / 104** |
| Görseli olan kayıt | **509 / 509** (506'sı Wikimedia thumb, 3'ü tam boy) |

### Ölçülmemiş / bilinmeyen

Bunları portföyde **yazma**, kanıtı yok:

- Kullanıcı sayısı, trafik, dağıtım geçmişi — **BİLİNMİYOR** (dağıtım kanıtı yok).
- Test kapsamı yüzdesi — **BİLİNMİYOR** (kapsam aracı yok).
- Gerçek geliştirme süresi — **BİLİNMİYOR** (tek commit).
- CI'ın geçmiş durumu — **BİLİNMİYOR**. İş akışı dosyası var ama koşu geçmişi yok;
  yerelde aynı adımlar (lint + data-integrity + build) bu oturumda geçti.

---

## 9. Yayına çıkarma engelleri

Emin olmadıklarımı da yazdım, kararı sen ver.

### Karar vermen gerekenler

1. **Wikimedia görsel atıfları — en ciddi kalem.** 509 kaydın 509'u Wikimedia Commons
   görseli kullanıyor ve bunlar `/api/image` üzerinden **senin alan adından** servis
   ediliyor. Commons görsellerinin büyük kısmı CC BY-SA veya benzeri lisanslarla, yani
   **eser sahibi + lisans künyesi** gerektirir. Kodda **görsel başına atıf render eden
   hiçbir yer bulamadım** — tek şey `Footer.tsx`'teki genel cümle: *"Tum veriler acik
   kaynak referanslardan derlenir"* / *"gorseller kaynaklariyla birlikte sunulur"*.
   Veri şemasında da görsel için yazar/lisans alanı yok (`imageUrl` düz string).
   Portföyde ekran görüntüsü yayımlamak muhtemelen sorun değil (adil kullanım, küçük
   ölçek), ama **siteyi canlıya alırsan** bu düzeltilmeli. Karar senin.

2. **Proxy'nin kimlik başlıkları.** `route.ts` yukarı akışa
   `User-Agent: MythAtlasImageProxy/1.0 (+https://mythatlas.local)` ve
   `Referer: https://mythatlas.local/` gönderiyor — var olmayan bir alan adı. Wikimedia'nın
   bot politikası çalışan bir iletişim adresi ister. Canlıya çıkarken gerçek alan adıyla
   değiştir; aksi halde 429'lar geri gelebilir (§6, Bulgu 1'in kök sebebi).

3. **Lisans kapsamı belirsizliği.** `LICENSE` MIT ve *"Copyright (c) 2026 MythAtlas"*
   diyor. MIT **kodu** kapsar. Ama depodaki asıl değerin bir kısmı **veri** —
   69 akademik kaynaktan derlenmiş 59.724 satır JSON. Verinin hangi lisansla dağıtıldığı
   hiçbir yerde yazmıyor. `data/CONTRIBUTING.md` katkı akışını anlatıyor ama katkıcının
   veriyi hangi lisansla verdiğini söylemiyor. Kod/veri lisansını ayırmak isteyip
   istemediğine karar vermelisin (yaygın çözüm: kod MIT, veri CC BY-SA).

4. **Telif hakkı sahibi adı.** Hem `LICENSE`'ta hem git kimliğinde gerçek ad yok:
   copyright sahibi *"MythAtlas"*, commit yazarı literal olarak **`Your Name`**. Portföyde
   "bunu ben yaptım" diyeceksen depodaki kanıt bunu desteklemiyor. Yayından önce
   `git config user.name/user.email` düzeltilip commit yeniden yazılmalı, yoksa public
   depoda sahiplik izin yok.

### Engel olmadığını doğruladıklarım

- **Gömülü sır: yok.** `src`, `qa`, `scripts`, `.github` ve `next.config.mjs` üzerinde
  API anahtarı / parola / bağlantı dizesi / özel anahtar taraması yapıldı — eşleşmelerin
  tamamı `tokenize`, `queryTokens`, `tokens.css` gibi yanlış pozitiflerdi. Gerçek sır
  yok. Zaten proje hiçbir kimlik doğrulamalı servis kullanmıyor.
- **`.env` dosyası: yok.** Depoda yalnızca `.env.local.example` var ve içi boş sayılır
  ("harici bağlantı gerekmiyor" notu). `.gitignore` `.env*.local`'i kapsıyor.
- **Müşteri işi / NDA: hayır.** Ticari müşteriye, sözleşmeye veya kurum içi sisteme dair
  hiçbir iz yok. Kişisel bir proje.
- **Kişisel veri: yok.** Kullanıcı hesabı, form, analitik veya izleme kodu yok.
- **Kurum içi bilgi: yok.**
- **Üçüncü parti veri:** Wikimedia (yukarıda, madde 1) ve akademik kaynak **künyeleri**.
  Künyeler (yazar, başlık, yıl, APA/Chicago dizgisi) telifli değil. `/methodology`
  sayfası doğrudan alıntı yerine paraphrase kullanıldığını beyan ediyor
  (`methodology/page.tsx:45`) — bunu kaynak metinlere karşı **doğrulamadım**,
  beyanı aktarıyorum.

### Kozmetik ama düzeltilmeli

- **Yer tutucu ekran görüntüleri.** README `public/screenshots/home.svg` (548 B) ve
  `map.svg` (737 B) gösteriyor — bunlar gerçek ekran görüntüsü değil, minik vektör
  kabukları. Public depoda README'nin ilk izlenimi bu.
- **BOM kirliliği.** En az 5 dosya UTF-8 BOM ile başlıyor: `src/data/cultures.json`,
  `src/lib/dna.ts`, `scripts/generate-myth-dna.mjs`, `src/app/culture/[id]/page.tsx`,
  `LICENSE`. `cultures.json`'daki BOM `JSON.parse`'ı doğrudan patlatıyor (bu oturumda
  yaşandı) — depo betikleri onu okuyup çökebilir. Windows/PowerShell yönlendirmesi izi.
- **Ölü kod public'e gidiyor:** `useCultures.ts`, `useMyths.ts`, `cultures.json`,
  `/culture/[id]` yönlendirme kabuğu (§6, Bulgu 2). Public depoda "bu neden burada"
  sorusunu doğurur.
- **Denetimde `false` dönen 3 etkileşim — muhtemelen ölçüm artefaktı, doğrulanmadı.**
  `full-qa-report.json → interactionChecks` şunları `false` işaretlemiş:
  `searchModal.opensWithCtrlK`, `landing.exploreButtonVisible`,
  `compare.queryPreselectWorks`. Bunlardan ilkini kodda kontrol ettim: Ctrl/Cmd+K bağı
  **var** (`SearchModal.tsx:100`), ama bileşen `ssr: false` ile dinamik yükleniyor
  (`AppShell.tsx:17`) — headless denetim, chunk inmeden tuşa basmış olabilir. Yani bu
  büyük ihtimalle test zamanlaması, gerçek hata değil. **Ama elle doğrulamadım.**
  Ekran görüntüsü alırken Ctrl+K'yi kendin dene; çalışıyorsa iyi bir kare olur.

---

## Portföy oturumuna not

Bu brifing frontmatter'ın şu alanlarını doldurabilir:

- `title`: MythAtlas
- `tagline`: kaynak önerisi — "Mitolojileri haritada birleştiren, kültürler arası
  benzerlikleri puanlayan karşılaştırmalı atlas" (§1 ve §3'ten; sen yeniden yaz)
- `period`: **doldurulamıyor** — tek commit, geçmiş ezilmiş (§1). Bu alanı sen
  hafızandan vermelisin.
- `role`: tek geliştirici (git kanıtı zayıf, §1)
- `stack`: §1'deki 8 maddelik liste
- `status`: `GA öncesi`
- `statusDetail`: §2'deki ölçülebilir gerekçe

`slug`, `featured`, `order`, `diagram`, `cover`, `updated` alanları bilinçli olarak
doldurulmadı — bunlar site geneli kararlar, proje oturumundan uydurulmuş bir dosya yolu
üretmekten başka işe yaramaz.

**Diyagram için:** §4'teki 9 kutu ve akış. `1 → 6` okunu kesik çizgi yap.

**Zorlandığım yer bölümü için:** §6'da üç bulgu var, hepsi kanıtlı. En anlatılabilir
olanı Bulgu 1 (Wikimedia varsayımı) — belirtiden kök sebebe, oradan iki katmanlı çözüme
ve doğrulanmış sonuca giden tam bir zincir. Ama commit karması veremiyorum; kronolojiyi
sen doğrula.
