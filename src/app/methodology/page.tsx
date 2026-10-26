import type { Metadata } from 'next';
import HoverPrefetchLink from '@/components/common/HoverPrefetchLink';

export const metadata: Metadata = {
  title: 'Metodoloji',
  description:
    'MythAtlas karşılaştırmalı mitoloji metodolojisi, kaynak seçimi ve editoryal standartları.',
};

export default function MethodologyPage() {
  return (
    <section className="section-container py-24">
      <div className="space-y-6">
        <header className="ancient-card p-6">
          <p className="meta-text text-xs uppercase tracking-[0.2em]">Akademik Standartlar</p>
          <h1 className="mt-2 text-4xl text-gold md:text-5xl">Metodoloji</h1>
          <p className="mt-3 text-foreground/80">
            MythAtlas, paralel mit bağlantılarını birincil metinler, karşılaştırmalı ikincil
            literatür ve arkeolojik bulguların birlikte okunması ile oluşturur.
          </p>
        </header>

        <article className="ancient-card p-6">
          <h2 className="text-2xl text-gold">Paraleller nasıl belirlenir?</h2>
          <ul className="mt-3 space-y-2 text-sm text-foreground/80">
            <li>Yapısal benzerlik: olay örgüsü, anlatısal dönüm noktası, karakter fonksiyonu.</li>
            <li>Tematik örtüşme: yaratılış, tufan, kahraman yolculuğu, ölüm-yeniden doğuş gibi motifler.</li>
            <li>Kültürel temas ihtimali: ticaret ağları, göç, dilsel veya metinsel aktarım kanalları.</li>
            <li>Bağımsız gelişim olasılığı: benzer toplumsal soruna benzer sembolik cevaplar.</li>
          </ul>
        </article>

        <article className="ancient-card p-6">
          <h2 className="text-2xl text-gold">Kaynak hiyerarşisi</h2>
          <ul className="mt-3 space-y-2 text-sm text-foreground/80">
            <li>Birincil kaynaklar: metin, yazıt, kodeks, elyazması ve klasik derlemeler.</li>
            <li>İkincil kaynaklar: Campbell, Eliade, Lévi-Strauss, Burkert, West, Doniger gibi karşılaştırmalı çalışmalar.</li>
            <li>Arkeolojik kaynaklar: kazılar, yazıt katalogları, müze koleksiyonları ve saha raporları.</li>
          </ul>
        </article>

        <article className="ancient-card p-6">
          <h2 className="text-2xl text-gold">Editoryal ilkeler</h2>
          <ul className="mt-3 space-y-2 text-sm text-foreground/80">
            <li>Doğrudan telifli alıntı yerine paraphrase kullanılır.</li>
            <li>Tartışmalı bağlantılar açıkça etiketlenir.</li>
            <li>Her kayıtta birincil kaynaklara geri dönüş yolu korunur.</li>
            <li>Sayfa alıntıları ikincil referans olarak sunulur; akademik atıfta birincil kaynak tavsiye edilir.</li>
          </ul>
        </article>

        <div className="flex flex-wrap gap-3">
          <HoverPrefetchLink
            href="/bibliography"
            className="rounded-full border border-gold/35 bg-gold/10 px-4 py-2 text-xs uppercase tracking-[0.14em] text-gold-light"
          >
            Bibliography
          </HoverPrefetchLink>
          <HoverPrefetchLink
            href="/scholars"
            className="rounded-full border border-gold/35 bg-gold/10 px-4 py-2 text-xs uppercase tracking-[0.14em] text-gold-light"
          >
            Scholars
          </HoverPrefetchLink>
        </div>
      </div>
    </section>
  );
}
