import type { Metadata } from 'next';
import HoverPrefetchLink from '@/components/common/HoverPrefetchLink';
import AncientImage from '@/components/common/AncientImage';

export const metadata: Metadata = {
  title: 'Scholars',
  description:
    'Karsilastirmali mitoloji calismalarinda etkili akademisyenlerin profil ve eserleri.',
};

interface ScholarProfile {
  id: string;
  name: string;
  dates: string;
  institution: string;
  imageUrl: string;
  contribution: string[];
  works: string[];
  focusMyths: string[];
  thesisParaphrase: string;
}

const scholars: ScholarProfile[] = [
  {
    id: 'joseph-campbell',
    name: 'Joseph Campbell',
    dates: '1904-1987',
    institution: 'Sarah Lawrence College',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Joseph_Campbell.jpg',
    contribution: [
      'Kahraman anlatilarinin kulturlerarasi tekrar eden asamalarini derleyerek monomyth tartismasini yayginlastirdi.',
      'Mitleri sadece tarihsel veri degil, psikolojik ve sembolik islevleri olan canli anlatilar olarak konumlandirdi.',
    ],
    works: ['The Hero with a Thousand Faces', 'The Masks of God'],
    focusMyths: ['heracles-labors', 'gilgamesh-quest', 'odyssey'],
    thesisParaphrase:
      'Toplumlar farkli isimler kullansa da kahramanlik dongusunun ana sinavlari benzer kalir.',
  },
  {
    id: 'mircea-eliade',
    name: 'Mircea Eliade',
    dates: '1907-1986',
    institution: 'University of Chicago',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6e/Mircea_Eliade.jpg',
    contribution: [
      'Kutsal zaman, rituel tekrar ve mitin kosmolojik yenileme islevini karsilastirmali bir modelde acikladi.',
      'Mitin dogrudan gecmis anlatimi degil, su anki toplumsal duzeni kuran bir sembolik mekanizma oldugunu savundu.',
    ],
    works: ['Patterns in Comparative Religion', 'The Myth of the Eternal Return'],
    focusMyths: ['mesopotamian-flood', 'ragnarok', 'aztec-five-suns'],
    thesisParaphrase:
      'Rituel tekrar, toplumu kurucu zamana geri baglayarak duzeni yeniden uretir.',
  },
  {
    id: 'claude-levi-strauss',
    name: 'Claude Levi-Strauss',
    dates: '1908-2009',
    institution: 'College de France',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/65/Claude_Levi-Strauss.jpg',
    contribution: [
      'Mitleri tek tek hikayeler yerine birbirini donusturen yapisal varyantlar olarak inceleyen analitik cerceve kurdu.',
      'Ikili karsitliklarin anlatisal duzenleme gucunu gostererek karsilastirmali analizde yeni bir dil olusturdu.',
    ],
    works: ['Structural Anthropology', 'Mythologiques'],
    focusMyths: ['coyote-trickster', 'prometheus-fire', 'dreamtime-rainbow-serpent'],
    thesisParaphrase:
      'Mit, farkli varyantlara ayrilsa da alttaki yapisal iliskileri koruyarak anlam uretir.',
  },
  {
    id: 'walter-burkert',
    name: 'Walter Burkert',
    dates: '1931-2015',
    institution: 'University of Zurich',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/57/Walter_Burkert.jpg',
    contribution: [
      'Yunan mitolojisini yakin dogu temaslari ve rituel tarih ile birlikte okuyarak aktarim tartismasini guclendirdi.',
      'Mit ve ritueli ayni toplumsal ekosistemin parcasi olarak ele aldi.',
    ],
    works: ['Structure and History in Greek Mythology and Ritual', 'The Orientalizing Revolution'],
    focusMyths: ['greek-creation', 'prometheus-fire', 'enuma-elish'],
    thesisParaphrase:
      'Yunan anlatilari, bolgesel temaslar ve rituel kurumlarin ortak etkisiyle bicimlenmistir.',
  },
  {
    id: 'wendy-doniger',
    name: 'Wendy Doniger',
    dates: '1940-',
    institution: 'University of Chicago',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/71/Wendy_Doniger.jpg',
    contribution: [
      'Karsilastirmali okumada coklu anlam katmanlarini ve metinler arasi esnek gecisleri vurguladi.',
      'Hindu ve dunya mitlerini birlikte degerlendirerek tek-merkezli aciklama modellerine alternatif sundu.',
    ],
    works: ['The Implied Spider'],
    focusMyths: ['ramayana', 'mahabharata-war', 'ishtar-descent'],
    thesisParaphrase:
      'Mitik benzerlikler tek bir kaynaga degil, coklu anlati stratejilerinin kesismesine de dayanir.',
  },
  {
    id: 'james-frazer',
    name: 'James George Frazer',
    dates: '1854-1941',
    institution: 'University of Cambridge',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Sir_James_George_Frazer.jpg',
    contribution: [
      'Mit ve rituel bagini genis bir karsilastirmali katalog halinde toplayarak alanin erken donemine yon verdi.',
      'Yontemi gunumuzde elestirilse de karsilastirmali mitoloji tarihindeki etkisi surmektedir.',
    ],
    works: ['The Golden Bough'],
    focusMyths: ['osiris-isis', 'persephone-seasons', 'book-of-dead'],
    thesisParaphrase:
      'Rituel kaliplari farkli toplumlarda benzer mitik aciklama bicimleri uretebilir.',
  },
  {
    id: 'ml-west',
    name: 'M. L. West',
    dates: '1937-2015',
    institution: 'University of Oxford',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Martin_Litchfield_West.jpg',
    contribution: [
      'Filolojik ve metinsel karsilastirmalarla Yunan ile Yakin Dogu anlatilari arasindaki temas yollarini ayrintilandirdi.',
      'Motif benzerliklerinin dilsel izlerle birlikte degerlendirilmesi gerektigini savundu.',
    ],
    works: ['The East Face of Helicon'],
    focusMyths: ['greek-creation', 'enuma-elish', 'kumarbi-cycle'],
    thesisParaphrase:
      'Metinler arasi benzerlik, temas tarihinin filolojik kanitlariyla birlikte okunmalidir.',
  },
  {
    id: 'georges-dumezil',
    name: 'Georges Dumezil',
    dates: '1898-1986',
    institution: 'College de France',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Georges_Dumezil.jpg',
    contribution: [
      'Hint-Avrupa mitlerinde islevsel ucleme modelini gelistirdi.',
      'Savas, kutsallik ve uretim eksenlerinin mitik panteon organizasyonunda tekrarlandigini ileri surdu.',
    ],
    works: ['Mitra-Varuna', 'Archaic Roman Religion'],
    focusMyths: ['ragnarok', 'mahabharata-war', 'romulus-remus'],
    thesisParaphrase:
      'Hint-Avrupa geleneklerinde panteon islevleri belirli toplumsal roller etrafinda organize olur.',
  },
  {
    id: 'jan-bremmer',
    name: 'Jan N. Bremmer',
    dates: '1944-',
    institution: 'University of Groningen',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Jan_Bremmer.jpg',
    contribution: [
      'Antik din ve mit calismalarinda tarihsel-kulturel baglamin onceligini vurguladi.',
      'Yunan mitlerinin sosyal pratiklerle iliskisini ayrintili olarak inceledi.',
    ],
    works: ['Greek Religion', 'Interpretations of Greek Mythology'],
    focusMyths: ['orpheus-eurydice', 'persephone-seasons'],
    thesisParaphrase:
      'Mitin anlami metnin kendisi kadar onu tasiyan toplumsal pratikte de uretilir.',
  },
  {
    id: 'sarah-johnston',
    name: 'Sarah Iles Johnston',
    dates: '1962-',
    institution: 'Ohio State University',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Sarah_Iles_Johnston.jpg',
    contribution: [
      'Antik mit anlatilarinda rituel pratik, buyu ve dini deneyim baglarini arastirdi.',
      'Mitin sadece anlati degil performatif bir bilgi sistemi oldugunu gosterdi.',
    ],
    works: ['The Story of Myth', 'Restless Dead'],
    focusMyths: ['book-of-dead', 'ishtar-descent'],
    thesisParaphrase:
      'Mitler, rituel performansla birlestiginde toplumsal hakikat rejimlerini guclendirir.',
  },
  {
    id: 'bruce-lincoln',
    name: 'Bruce Lincoln',
    dates: '1948-',
    institution: 'University of Chicago',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Bruce_Lincoln.jpg',
    contribution: [
      'Mitin siyasi kullanimlarini ve ideolojik uretim gucunu karsilastirmali olarak inceledi.',
      'Anlatilarin sadece sembolik degil iktidar iliskileriyle de bicimlendigini ortaya koydu.',
    ],
    works: ['Theorizing Myth', 'Discourse and the Construction of Society'],
    focusMyths: ['romulus-remus', 'aeneid', 'osiris-isis'],
    thesisParaphrase:
      'Mit anlatisi, toplumsal duzeni mesrulastiran ideolojik bir arac olarak da isler.',
  },
  {
    id: 'calvert-watkins',
    name: 'Calvert Watkins',
    dates: '1933-2013',
    institution: 'Harvard University',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/43/Calvert_Watkins.jpg',
    contribution: [
      'Hint-Avrupa poetik formullerinin mitik aktarimdaki rolunu filolojik olarak acikladi.',
      'Dilsel tekrar kaliplarini mitik hafiza mekanizmasi olarak degerlendirdi.',
    ],
    works: ['How to Kill a Dragon'],
    focusMyths: ['sigurd-dragon', 'thor-jormungandr', 'vritra-slaying'],
    thesisParaphrase:
      'Poetik formuller, mitlerin kusaklar arasi iletiminde yapisal omurga islevi gorur.',
  },
  {
    id: 'robert-segal',
    name: 'Robert A. Segal',
    dates: '1947-',
    institution: 'University of Aberdeen',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b6/Robert_A._Segal.jpg',
    contribution: [
      'Mit kuramlari tarihini sistematik sekilde siniflandirarak alana metodolojik netlik kazandirdi.',
      'Psikolojik, sosyolojik ve yapisal yaklasimlarin kullanim alanlarini karsilastirdi.',
    ],
    works: ['Myth: A Very Short Introduction', 'Theorizing About Myth'],
    focusMyths: ['heracles-labors', 'odyssey'],
    thesisParaphrase:
      'Mitleri anlamak icin once hangi kuramsal soruyu sordugumuzu aciklastirmak gerekir.',
  },
  {
    id: 'carlo-ginzburg',
    name: 'Carlo Ginzburg',
    dates: '1939-',
    institution: 'Scuola Normale Superiore / UCLA',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Carlo_Ginzburg.jpg',
    contribution: [
      'Mikro-tarihsel yaklasimla halk inanc ve anlatilarinin uzun sureli donusumunu izledi.',
      'Mitik kalintilarin yerel pratiklerde nasil yasadigina dair model sundu.',
    ],
    works: ['Ecstasies', 'Clues, Myths, and the Historical Method'],
    focusMyths: ['baba-yaga', 'wild-hunt'],
    thesisParaphrase:
      'Buyuk mitik yapilar, yerel uygulamalarda izlenebilen kucuk belirtilerle de okunabilir.',
  },
  {
    id: 'gregory-nagy',
    name: 'Gregory Nagy',
    dates: '1942-',
    institution: 'Harvard University',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Gregory_Nagy.jpg',
    contribution: [
      'Homeros gelenegini performans ve sozlu-formul kuramlariyla yeniden yorumladi.',
      'Epik metnin sabit degil, performatif ve tarihsel olarak degisen bir gelenek oldugunu savundu.',
    ],
    works: ['The Best of the Achaeans', 'Homer the Preclassic'],
    focusMyths: ['iliad-achilles', 'odyssey'],
    thesisParaphrase:
      'Epik mit, tek bir metin degil performanslar aginda surekli yeniden kurulan bir gelenektir.',
  },
];

export default function ScholarsPage() {
  return (
    <section className="section-container py-24">
      <header className="ancient-card p-6">
        <p className="meta-text text-xs uppercase tracking-[0.2em]">Comparative Mythology</p>
        <h1 className="mt-2 text-4xl text-gold md:text-5xl">Scholars</h1>
        <p className="mt-3 text-foreground/80">
          MythAtlas paralellerinde sik referans verilen karsilastirmali mitoloji
          arastirmacilarinin temel profilleri.
        </p>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {scholars.map((scholar) => (
          <article key={scholar.id} className="ancient-card overflow-hidden">
            <div className="grid gap-0 md:grid-cols-[160px_1fr]">
              <div className="relative h-48 md:h-full">
                <AncientImage
                  src={scholar.imageUrl}
                  alt={scholar.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 160px"
                  className="object-cover"
                  fallbackLabel={scholar.name}
                />
              </div>
              <div className="space-y-3 p-4">
                <h2 className="text-2xl text-gold">{scholar.name}</h2>
                <p className="meta-text text-xs uppercase tracking-[0.12em]">
                  {scholar.dates} | {scholar.institution}
                </p>
                {scholar.contribution.map((paragraph) => (
                  <p key={paragraph.slice(0, 18)} className="text-sm leading-6 text-foreground/80">
                    {paragraph}
                  </p>
                ))}

                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-gold/80">Onemli eserler</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {scholar.works.map((work) => (
                      <HoverPrefetchLink
                        key={`${scholar.id}-${work}`}
                        href={`/bibliography?author=${encodeURIComponent(scholar.name)}`}
                        className="rounded-full border border-gold/25 px-2 py-0.5 text-xs text-gold-light"
                      >
                        {work}
                      </HoverPrefetchLink>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-gold/80">
                    MythAtlas odakli baglantilar
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {scholar.focusMyths.map((mythId) => (
                      <HoverPrefetchLink
                        key={`${scholar.id}-${mythId}`}
                        href={`/myth/${mythId}`}
                        className="rounded-full border border-gold/25 px-2 py-0.5 text-xs text-foreground/80"
                      >
                        {mythId}
                      </HoverPrefetchLink>
                    ))}
                  </div>
                </div>

                <blockquote className="rounded-md border border-gold/20 bg-black/20 p-3 text-sm italic text-foreground/75">
                  {scholar.thesisParaphrase}
                </blockquote>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

