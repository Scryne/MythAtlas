# DURUM — MythAtlas — karşılaştırmalı mitoloji atlası

> **Ne bu dosya:** sertifika değil **envanter**. Ölçülen gerçek durum; "çalışmıyor" yazan satır kusur değil, kayıt.
> Kapanış standardı: `ScryneOS/🎯 100-Command-Center/Kapanis-Standardi.md`

**Ölçüm tarihi:** 2026-10-26 (önceki: 2026-08-27)
**Tek cümle:** Canlıda (https://scryne.github.io/MythAtlas/, GitHub Pages, statik); 566 sayfa, veri ve içerik denetimleri temiz, arayüz tutarlı Türkçe.

## Ne çalışıyor (2026-10-26'da ölçüldü)

- **Derleme:** `next build` 566 statik sayfa (157 mit, 212 tanrı, 104 kutsal alan, 36 mitoloji + dizinler).
  `tsc --noEmit` ve `eslint` 0 hata.
- **Denetimler:** `qa:data-integrity` 0 sorun, `qa:content` temiz (274 kaynak, `public/data` güncel),
  `qa:new-feature` 1.004 kontrol 0 hata. Birim test yok; bu üç denetim veri ve içerik doğruluğunu tutuyor.
- **Bağımlılık:** `npm audit` 0 açık (next 16.4.3; 16.3.6'daki kritik RCE kapandı).
- **Görsel:** 12 rota × 4 genişlik × açık/koyu, 96 kare: taşma yok, konsol hatası yok.
- **Arayüz dili:** kabuk tutarlı Türkçe, tam imlâ. 2026-10-26'ya kadar metinlerin çoğu ASCII'ye indirgenmişti
  ("Canli Mitoloji Atlasi") ve ~130 etiket İngilizceydi; ikisi de düzeltildi. Veri (mit, tanrı, alan metinleri)
  kaynak dili İngilizce kalıyor; İngilizce veri gösteren başlıklar `lang="en"` taşıyor.
- `DESIGN.md` (token'lar `src/styles/tokens.css` ile aynı), lint 0/0.

## 2026-10-26'da düzeltilenler

- Soy ağacı sayfası 768–1440 px'te +415 px yatay taşıyordu: kapalı ayrıntı paneli sağa kaydırılmış ama
  kırpılmıyordu → kapsayıcı `overflow-x-clip`.
- Tanrı evrim zincirlerinde görselsiz adımlar Commons'ta olmayan bir dosyayı istiyordu (proxy 502) → bileşenin
  kendi yer tutucusu.
- Footer'daki "Veriye katkı" bağlantısı yanlış kullanıcı/dala gidiyordu (`scryn`/`main`) → `Scryne`/`master`.

## 2026-10-31

- **Görseller:** Commons'ta bulunamayan 41 görselin 36'sı konusuyla aranıp gözle doğrulanarak eşlendi
  (`scripts/resolve-images.mjs` → `ESLEME`); veride uydurulmuş adlardı. Kalan 5 (Bremmer, Watkins, Burkert, Lincoln,
  Segal) için Commons'ta özgür fotoğraf yok; yer tutucu.
- **Renk token'ları:** soy ağacı, tanrı zincirleri ve paraleller sayfalarındaki ~40 farklı ham hex (aynı altın için on ton)
  token'a toplandı (`gold-pale`, `parchment-dim/muted`, `rel-cyan/green`, `void`…); üç sayfada ham hex 0.
- **Günlük seçimler donuyordu:** keşfet sayfası statik derlemede sunucu bileşeni olduğu için "Her gün yeni bir hikâye"
  derleme gününde kalıyordu. Derleme artık `/daily.json` yazar (73 KB gzip); tarayıcı bugünü hesaplayıp doğru günü
  gösterir, HTML yine derleme gününün seçimiyle gelir. Saat ±1/2 gün kaydırılarak doğrulandı.
- **Paraleller:** "ortak motif ağı" düz bir çizgiye kilitliydi (aynı y'den başlıyordu, bağ yoktu) → daire başlangıcı +
  ortak motif bağları; sayaç "0" yerine gerçek değerle başlıyor; "Orta düzey", "A seç/B seç".
- **Lint 0:** 31 uyarı düzeltildi (render sırasında sıfırlama, `useId`, belirli yerleşim, kancalar `useMemo`).
- Doğrulama: statik dışa aktarım (1076 sayfa), 10 rota × 4 genişlik = 40 kare 0 sorun.

## 2026-11-03

- **Grafik renkleri token'da:** istatistik sayfası (Recharts pasta/çubuk/Gantt, iki koroplet) ve mini dünya haritasındaki
  37 farklı ham hex değeri `tokens.css`'e `--color-chart-*` / `--color-map-*` olarak taşındı, bileşenler `var(--…)` okuyor. Değerler
  birebir aynı; yalnız `#0d0a07` mevcut `--color-bg-primary`'ye bağlandı. Doğrulama: `/stats`, `/map`, `/mythology/greek`,
  `/site/parthenon`'da tüm öğelerin hesaplanmış renkleri önce/sonra aynı; `/stats`'taki 12 grafik kartı animasyon
  bittikten sonra piksel piksel aynı.
- `next dev`'in ürettiği `AGENTS.md` `.gitignore`'a eklendi (hiç izlenmiyordu).
- `tsc`, `eslint`, `qa:data-integrity` (0 sorun), `qa:content` (temiz), `next build` geçti.

- **Kalan grafik renkleri de token'da:** mitoloji ayrıntısındaki etki mini grafiği, zaman çizelgesi, mit türü vurguları
  ve paralel küme şeması; yükleniyor simgesi; DNA şeridi/radarı/parmak izi ve `/dna` çubukları; arkeoloji grafikleri ve
  müze işaretleri; tema ağı. 9 dosyadaki ham hex/rgba `tokens.css`'e (`--color-graph-*`, `--color-timeline-*`,
  `--color-myth-type-*`, `--color-spinner-*`, `--color-dna-*`, `--rgb-dna-*`, `--rgb-theme-*`, `--color-gold-glow`…)
  taşındı; aynı değeri taşıyan mevcut token'lar (`gold`, `rel-cyan`, `chart-gold`, `chart-tooltip-bg`, `map-marker`)
  yeniden kullanıldı. Bu dosyalarda ham renk 0. Doğrulama: değişiklik öncesi ve sonrası iki sunucu yan yana; 16 sayfa/
  sekme hâlinde 10.225 öğenin 11 renk özelliği (+ JS'siz yükleniyor simgesi, 3 rota) önce/sonra 0 fark; 8 ekranda tam
  sayfa piksel karşılaştırması (bir ekrandaki fark yapışkan başlığın 2 px kaymasıydı, kart ızgarası piksel piksel aynı).

- **Ayrıntı sayfaları ve ortak bileşenler de token'da:** mit ve tanrı ayrıntı sayfaları (benzerlik yayı, rozetler, harita
  işareti yedekleri, tapınılan dönem şeridi, takımyıldız), `/sites` işaretleri, `/stats` soy ağacı kabı, `StatsCharts`
  ipucu/imleç saydamları, iki koroplet kenarı, `MiniWorldMap`/`SiteLocationMap` ızgara ve kıtaları, `HomeClient`
  degradeleri ve başlık gölgesi, `AncientImage` yer tutucusu, `AcademicSources` vurgusu, paraleller sayfa kabı. 13
  dosyada ham hex/rgba 0; 24 yeni token, gerisi mevcut `gold`, `bg-primary`, `bg-elevated`, `parchment`, `rel-cyan`,
  `gold-pale`, `gold-glow`. `lib/` veri renkleri incelendi ve bilerek ham bırakıldı (yukarıda). Doğrulama: önce/sonra iki
  derleme yan yana; 18 rotada 9.146 öğenin 14 renk özelliği 0 fark (CSS animasyonları 0. karede sabitlenerek — ana
  sayfadaki sonsuz `glow-pulse` aksi hâlde anlık faz farkı veriyor); veride hiç görünmeyen ya da etkileşimle açılan 22
  hâl (mit "evrensel hikâye" rozeti, kaynak vurgusu, yer tutucu, işaret yedekleri, grafik ipucu…) enjeksiyonla 0 fark.

## Ne yarım / bilinen sınırlar

- Canlı kurulum GitHub Pages (`master`'a push'ta derlenir).
- Mobilde soy ağacı "masaüstünde daha iyi" kapısıyla açılıyor; kapıdan geçilince grafik dokunmatik kaydırmayla çalışıyor.
- Ham hex/rgba hâlâ duran küçük yerler (eski borç, dokunulduğunda token'a; 2026-11-03'te yeniden sayıldı):
  `globals.css`'teki siyah gölge/vinyet ve üç kahverengi `rgba()`, `SiteDetailTabs`'teki `#20160d`, `not-found`'daki
  saydam altın, `DeityEvolutionPageClient`'ın kahraman degradesi ve `FamilyTreePageClient`'ın siyah metin gölgesi.
  Bilerek ham kalanlar: ana harita (`MapPageClient`, MapLibre çözülmüş renk ister), OG görseli ve `manifest.ts`
  (CSS dışında çalışır), `lib/` veri renkleri (`family-tree-data`, `parallels-data`, `insights`: MapLibre'ye gidiyor
  ya da çağrı yerinde hex'e alfa eklenerek `${color}55` kullanılıyor; `var()` ikisini de bozar).

## Sonraki adım

Alan adı istenirse: `NEXT_PUBLIC_SITE_URL` + CNAME, `NEXT_PUBLIC_BASE_PATH` boş. Commons'ta bulunamayan 41 görsel için doğru dosya
adları elle bulunup `scripts/resolve-images.mjs` eşleme tablosuna eklenebilir.
