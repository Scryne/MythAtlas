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

## Ne yarım / bilinen sınırlar

- Canlı kurulum GitHub Pages (`master`'a push'ta derlenir). Bu oturumun commit'leri henüz push edilmedi.
- Mobilde soy ağacı "masaüstünde daha iyi" kapısıyla açılıyor; kapıdan geçilince grafik dokunmatik kaydırmayla çalışıyor.
- İstatistik ve harita grafiklerinde ham hex hâlâ var (grafik kütüphanesi renk dizileri); soy ağacı/paraleller temiz.

## Sonraki adım

Alan adı istenirse: `NEXT_PUBLIC_SITE_URL` + CNAME, `NEXT_PUBLIC_BASE_PATH` boş. Commons'ta bulunamayan 41 görsel için doğru dosya
adları elle bulunup `scripts/resolve-images.mjs` eşleme tablosuna eklenebilir.
