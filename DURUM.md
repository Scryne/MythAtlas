# DURUM — MythAtlas — karşılaştırmalı mitoloji atlası

> **Ne bu dosya:** sertifika değil **envanter**. Ölçülen gerçek durum; "çalışmıyor" yazan satır kusur değil, kayıt.
> Kapanış standardı: `ScryneOS/🎯 100-Command-Center/Kapanis-Standardi.md`

**Ölçüm tarihi:** 2026-10-26 (önceki: 2026-08-27)
**Tek cümle:** 566 sayfa derleniyor, veri ve içerik denetimleri temiz, arayüz tutarlı Türkçe; canlı kurulumu yok.

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

## Ne yarım / bilinen sınırlar

- **Canlı kurulum yok** (`og/[entity]/[id]` görsel rotaları sunucu istiyor; statik dışa aktarım için bu rotalar
  derleme anında üretilmeli). `metadataBase` `NEXT_PUBLIC_SITE_URL` yoksa `mythatlas.app`'e düşüyor; alan adı alınmadı.
- Soy ağacı ve paraleller sayfalarında ham hex renkler duruyor (eski borç, `DESIGN.md`'de not edildi).
- Mobilde soy ağacı "masaüstünde daha iyi" kapısıyla açılıyor; kapıdan geçilince grafik dokunmatik kaydırmayla çalışıyor.
- `eslint` 33 uyarı (çoğu `set-state-in-effect`), hata yok.

## Sonraki adım

Yayın kararı Scryne'da: Vercel/Pages ve alan adı. Teknik iş: OG rotalarını derleme anında üretip statik dışa aktarım.
