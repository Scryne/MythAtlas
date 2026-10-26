---
version: alpha
name: MythAtlas
description: Karşılaştırmalı mitoloji atlası; koyu, sıcak tonlu "antik harita" kimliği, altın vurgu, Cinzel başlıklar.
colors:
  primary: "#C9A84C"
  bg-primary: "#0D0A07"
  bg-surface: "#1A1510"
  bg-elevated: "#241D17"
  bg-overlay: "#2E2520"
  gold: "#C9A84C"
  gold-light: "#E8C96A"
  gold-dim: "#8A6F32"
  red: "#8B2E2E"
  red-light: "#B54444"
  parchment: "#F4E4C1"
  text-primary: "#F0E6D3"
  text-secondary: "#A89880"
  text-muted: "#6B5D50"
  border: "rgba(201, 168, 76, 0.15)"
  border-hover: "rgba(201, 168, 76, 0.35)"
typography:
  display:
    fontFamily: Cinzel
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.02em
  heading:
    fontFamily: Cinzel
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: Inter
    fontWeight: 400
    lineHeight: 1.6
  mono:
    fontFamily: JetBrains Mono
    fontWeight: 400
rounded:
  badge: 4px
  button: 6px
  card: 8px
  modal: 12px
spacing:
  component: 16px
  component-desktop: 24px
  card-gap: 16px
  section: 40px
  section-desktop: 64px
---

# MythAtlas

## Overview

Mitleri, tanrıları ve kutsal alanları aynı atlas üzerinde okuyan bir başvuru arayüzü. Kullanıcı bir hikâyeden girer
(Prometheus, tufan anlatıları), haritada, soy ağacında ve paralellerde dolaşarak başka kültürlerdeki karşılığına ulaşır.

- **Ruh hâli:** karanlık ama sıcak; mum ışığında okunan eski bir atlas. Saf siyah yok, zemin kahverengiye çalan
  koyu tonlar (`bg-primary` → `bg-overlay`), vurgu tek renk: altın.
- **Ayırt edici ayrıntı:** Cinzel başlıklar (küçük harfleri kapitale çeviren antik yazıt harfi) ve altın çizgili
  "ancient-card" yüzeyleri. Her ayrıntı sayfası bir künye gibi açılır: başlık, rozetler, kaynak sayısı.
- Global koyu glassmorphism varsayılanı burada uygulanmaz: atlasın kimliği cam değil, parşömen ve mürekkep.
  Bulanıklık yalnız harita üstü yüzen panellerde (soy ağacı araç çubuğu, ayrıntı paneli) kullanılır.

## Colors

- Metin `text-primary` üzerinde `bg-primary`/`bg-surface`; ikincil bilgi `text-secondary`, yalnız süs metni `text-muted`
  (gövde metninde kullanılmaz, kontrastı düşük).
- `gold` başlık ve etkin durum, `gold-light` üzerine gelme ve vurgu; altın asla gövde metni rengi olmaz.
- `red`/`red-light` yalnız olumsuz durum (yıkılmış alan, hata). Durum rozetlerinde emerald/kırmızı Tailwind tonları
  yarı saydam zeminle kullanılır ("Hâlâ ayakta" / "Tarihe karıştı").
- Kenarlar `border` (0,15 altın), üzerine gelince `border-hover`. Yeni renk gerekirse önce buraya token olarak eklenir;
  bileşene ham hex yazılmaz (soy ağacı ve paraleller sayfalarında kalan ham hex'ler eski borçtur, dokunulduğunda
  token'a çekilir).

## Typography

- Başlıklar Cinzel (`--font-display`), gövde Inter, kod/koordinat JetBrains Mono.
- Arayüz dili Türkçe (`<html lang="tr">`), içerik verisi (mit, tanrı, alan adları ve özetleri) kaynak dilinde,
  İngilizce. Cinzel Türkçe yerel glifinde küçük `i`'yi noktalı kapitale çevirir: İngilizce veri gösteren başlıklar
  `lang="en"` taşır ("ABU SIMBEL", "ABU SİMBEL" değil).
- Türkçe metin tam imlâyla yazılır (ç, ğ, ı, ö, ş, ü, â); ASCII'ye indirgenmiş Türkçe kusurdur.

## Layout

- Sayfa kabı `section-container`, bölümler arası `section` / `section-desktop`, kart arası `card-gap`.
- Ayrıntı sayfaları: tam genişlik kapak görseli + başlık şeridi, altında sekmeler (Genel Bakış / Arkeoloji), sağda
  konum haritası. Kartlar `ancient-card`, köşe `card` (8 px).
- Soy ağacı ve harita tam ekran tuvaldir; yüzen kontroller kenarlara yaslanır, ayrıntı paneli sağdan kayar ve
  kapalıyken kapsayıcı yatayda kırpılır (`overflow-x-clip`), sayfa genişlemez.

## Components

- **Rozet:** `badge` köşe, 11–12 px, büyük harf + geniş harf aralığı; tür, dönem, ülke, durum.
- **Düğme:** `button` köşe; birincil altın kenarlı, ikincil `border` kenarlı. Simge düğmeleri `aria-label` taşır.
- **Boş durum:** `EmptyState`: ne eksik, neden ("veri setinde henüz yeterli kapsama ulaşmadı"), ne yapılabilir.
- **Görsel:** `AncientImage`; kaynak yoksa kendi yer tutucusunu çizer, uydurma yedek bağlantı kullanılmaz.

## Do's and Don'ts

- Do: her iddianın yanında kaynak sayısı ve atıf düğmesi; benzerlik skorlarının nasıl hesaplandığı Metodoloji'de.
- Do: sayfa başına tek altın vurgu odağı; geri kalan hiyerarşi boyut ve ağırlıkla.
- Don't: arayüz metnini İngilizce/Türkçe karıştırmak; veri İngilizce kalabilir, kabuk Türkçedir.
- Don't: ham hex, rastgele gölge; `shadow-card`, `shadow-elevated`, `shadow-gold` dışında gölge yok.
