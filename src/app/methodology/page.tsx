import type { Metadata } from 'next';
import HoverPrefetchLink from '@/components/common/HoverPrefetchLink';

export const metadata: Metadata = {
  title: 'Methodology',
  description:
    'MythAtlas karsilastirmali mitoloji metodolojisi, kaynak secimi ve editoryal standartlari.',
};

export default function MethodologyPage() {
  return (
    <section className="section-container py-24">
      <div className="space-y-6">
        <header className="ancient-card p-6">
          <p className="meta-text text-xs uppercase tracking-[0.2em]">Academic Standards</p>
          <h1 className="mt-2 text-4xl text-gold md:text-5xl">Methodology</h1>
          <p className="mt-3 text-foreground/80">
            MythAtlas, paralel mit baglantilarini birincil metinler, karsilastirmali ikincil
            literatur ve arkeolojik bulgularin birlikte okunmasi ile olusturur.
          </p>
        </header>

        <article className="ancient-card p-6">
          <h2 className="text-2xl text-gold">Paraleller nasil belirlenir?</h2>
          <ul className="mt-3 space-y-2 text-sm text-foreground/80">
            <li>Yapisal benzerlik: olay orgusu, anlatisal donum noktasi, karakter fonksiyonu.</li>
            <li>Tematik ortusme: yaratilis, tufan, kahraman yolculugu, olum-yeniden dogus gibi motifler.</li>
            <li>Kulturel temas ihtimali: ticaret aglari, goc, dilsel veya metinsel aktarim kanallari.</li>
            <li>Bagimsiz gelisim olasiligi: benzer toplumsal soruna benzer sembolik cevaplar.</li>
          </ul>
        </article>

        <article className="ancient-card p-6">
          <h2 className="text-2xl text-gold">Kaynak hiyerarsisi</h2>
          <ul className="mt-3 space-y-2 text-sm text-foreground/80">
            <li>Birincil kaynaklar: metin, yazit, kodeks, elyazmasi ve klasik derlemeler.</li>
            <li>Ikincil kaynaklar: Campbell, Eliade, Levi-Strauss, Burkert, West, Doniger gibi karsilastirmali calismalar.</li>
            <li>Arkeolojik kaynaklar: kazilar, yazit kataloglari, muze koleksiyonlari ve saha raporlari.</li>
          </ul>
        </article>

        <article className="ancient-card p-6">
          <h2 className="text-2xl text-gold">Editoryal ilkeler</h2>
          <ul className="mt-3 space-y-2 text-sm text-foreground/80">
            <li>Dogrudan telifli alinti yerine paraphrase kullanilir.</li>
            <li>Tartismali baglantilar acikca etiketlenir.</li>
            <li>Her kayitta birincil kaynaklara geri donus yolu korunur.</li>
            <li>Sayfa alintilari ikincil referans olarak sunulur; akademik atifta birincil kaynak tavsiye edilir.</li>
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
