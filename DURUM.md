# DURUM — MythAtlas — karşılaştırmalı mitoloji atlası

> **Ne bu dosya:** sertifika değil **envanter**. 2026-08-27 denetiminde ölçülen gerçek durum.
> "Çalışmıyor" yazan satır kusur değil, kayıt. Kapanış standardı:
> `ScryneOS/🎯 100-Command-Center/Kapanis-Standardi.md`

**Ölçüm tarihi:** 2026-08-27
**Tek cümle:** Derleniyor ve 104 gerçek site sayfası üretiyor; Mart 2026'dan beri dokunulmamış, sıfır testi var.

## Ne çalışıyor

- **Üretim derlemesi başarılı.** 104 site SSG olarak üretiliyor (`/site/abu-simbel`,
  `/site/angkor-wat`, `/site/sri-pada` …) + `/sites` · `/themes` · `/parallels` ·
  `/scholars` · `/stats` · `sitemap.xml` · `robots.txt`.
- İçerik gerçek ve hacimli — "tek commit'lik boş depo" değil.
- Git: `master` dalı, `origin/master` ile eşit.

## Ne çalışmıyor / doğrulanmadı

- **Sıfır otomatik test.** `qa:*` script'leri var (`qa:data-integrity`, `qa:browser`,
  `qa:full`, `qa:release`) ama bu denetimde koşturulmadı.
- Son commit **2026-03-16**; beş aydır dokunulmamış, bağımlılıklar eskimiş olabilir.

## Ne yarım

- Portföy brifingi yazılmış ama commit edilmemişti (bu denetimde commit edildi).
- Dal adı `master`, diğer projeler `main` kullanıyor — normalleştirilmedi.

## Sonraki adım

`npm run qa:full` koştur; geçerse bu proje kapanış standardını neredeyse karşılıyor.
