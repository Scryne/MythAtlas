import type { Metadata } from 'next';
import HoverPrefetchLink from '@/components/common/HoverPrefetchLink';
import AncientImage from '@/components/common/AncientImage';

export const metadata: Metadata = {
  title: 'Akademisyenler',
  description:
    'Karşılaştırmalı mitoloji çalışmalarında etkili akademisyenlerin profil ve eserleri.',
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
      'Kahraman anlatılarının kültürlerarası tekrar eden aşamalarını derleyerek monomyth tartışmasını yaygınlaştırdı.',
      'Mitleri sadece tarihsel veri değil, psikolojik ve sembolik işlevleri olan canlı anlatılar olarak konumlandırdı.',
    ],
    works: ['The Hero with a Thousand Faces', 'The Masks of God'],
    focusMyths: ['heracles-labors', 'gilgamesh-quest', 'odyssey'],
    thesisParaphrase:
      'Toplumlar farklı isimler kullansa da kahramanlık döngüsünün ana sınavları benzer kalır.',
  },
  {
    id: 'mircea-eliade',
    name: 'Mircea Eliade',
    dates: '1907-1986',
    institution: 'University of Chicago',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6e/Mircea_Eliade.jpg',
    contribution: [
      'Kutsal zaman, ritüel tekrar ve mitin kozmolojik yenileme işlevini karşılaştırmalı bir modelde açıkladı.',
      'Mitin doğrudan geçmiş anlatımı değil, şu anki toplumsal düzeni kuran bir sembolik mekanizma olduğunu savundu.',
    ],
    works: ['Patterns in Comparative Religion', 'The Myth of the Eternal Return'],
    focusMyths: ['mesopotamian-flood', 'ragnarok', 'aztec-five-suns'],
    thesisParaphrase:
      'Ritüel tekrar, toplumu kurucu zamana geri bağlayarak düzeni yeniden üretir.',
  },
  {
    id: 'claude-levi-strauss',
    name: 'Claude Lévi-Strauss',
    dates: '1908-2009',
    institution: 'College de France',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/65/Claude_Lévi-Strauss.jpg',
    contribution: [
      'Mitleri tek tek hikâyeler yerine birbirini dönüştüren yapısal varyantlar olarak inceleyen analitik çerçeve kurdu.',
      'İkili karşıtlıkların anlatısal düzenleme gücünü göstererek karşılaştırmalı analizde yeni bir dil oluşturdu.',
    ],
    works: ['Structural Anthropology', 'Mythologiques'],
    focusMyths: ['coyote-trickster', 'prometheus-fire', 'dreamtime-rainbow-serpent'],
    thesisParaphrase:
      'Mit, farklı varyantlara ayrılsa da alttaki yapısal ilişkileri koruyarak anlam üretir.',
  },
  {
    id: 'walter-burkert',
    name: 'Walter Burkert',
    dates: '1931-2015',
    institution: 'University of Zurich',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/57/Walter_Burkert.jpg',
    contribution: [
      'Yunan mitolojisini yakın doğu temasları ve ritüel tarih ile birlikte okuyarak aktarım tartışmasını güçlendirdi.',
      'Mit ve ritüeli aynı toplumsal ekosistemin parçası olarak ele aldı.',
    ],
    works: ['Structure and History in Greek Mythology and Ritual', 'The Orientalizing Revolution'],
    focusMyths: ['greek-creation', 'prometheus-fire', 'enuma-elish'],
    thesisParaphrase:
      'Yunan anlatıları, bölgesel temaslar ve ritüel kurumların ortak etkisiyle biçimlenmiştir.',
  },
  {
    id: 'wendy-doniger',
    name: 'Wendy Doniger',
    dates: '1940-',
    institution: 'University of Chicago',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/71/Wendy_Doniger.jpg',
    contribution: [
      'Karşılaştırmalı okumada çoklu anlam katmanlarını ve metinler arası esnek geçişleri vurguladı.',
      'Hindu ve dünya mitlerini birlikte değerlendirerek tek-merkezli açıklama modellerine alternatif sundu.',
    ],
    works: ['The Implied Spider'],
    focusMyths: ['ramayana', 'mahabharata-war', 'ishtar-descent'],
    thesisParaphrase:
      'Mitik benzerlikler tek bir kaynağa değil, çoklu anlatı stratejilerinin kesişmesine de dayanır.',
  },
  {
    id: 'james-frazer',
    name: 'James George Frazer',
    dates: '1854-1941',
    institution: 'University of Cambridge',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Sir_James_George_Frazer.jpg',
    contribution: [
      'Mit ve ritüel bağını geniş bir karşılaştırmalı katalog halinde toplayarak alanın erken dönemine yön verdi.',
      'Yöntemi günümüzde eleştirilse de karşılaştırmalı mitoloji tarihindeki etkisi sürmektedir.',
    ],
    works: ['The Golden Bough'],
    focusMyths: ['osiris-isis', 'persephone-seasons', 'book-of-dead'],
    thesisParaphrase:
      'Ritüel kalıpları farklı toplumlarda benzer mitik açıklama biçimleri üretebilir.',
  },
  {
    id: 'ml-west',
    name: 'M. L. West',
    dates: '1937-2015',
    institution: 'University of Oxford',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Martin_Litchfield_West.jpg',
    contribution: [
      'Filolojik ve metinsel karşılaştırmalarla Yunan ile Yakın Doğu anlatıları arasındaki temas yollarını ayrıntılandırdı.',
      'Motif benzerliklerinin dilsel izlerle birlikte degerlendirilmesi gerektigini savundu.',
    ],
    works: ['The East Face of Helicon'],
    focusMyths: ['greek-creation', 'enuma-elish', 'kumarbi-cycle'],
    thesisParaphrase:
      'Metinler arası benzerlik, temas tarihinin filolojik kanıtlarıyla birlikte okunmalıdır.',
  },
  {
    id: 'georges-dumezil',
    name: 'Georges Dumezil',
    dates: '1898-1986',
    institution: 'College de France',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Georges_Dumezil.jpg',
    contribution: [
      'Hint-Avrupa mitlerinde islevsel ucleme modelini gelistirdi.',
      'Savaş, kutsallık ve üretim eksenlerinin mitik panteon organizasyonunda tekrarlandığını ileri sürdü.',
    ],
    works: ['Mitra-Varuna', 'Archaic Roman Religion'],
    focusMyths: ['ragnarok', 'mahabharata-war', 'romulus-remus'],
    thesisParaphrase:
      'Hint-Avrupa geleneklerinde panteon işlevleri belirli toplumsal roller etrafında organize olur.',
  },
  {
    id: 'jan-bremmer',
    name: 'Jan N. Bremmer',
    dates: '1944-',
    institution: 'University of Groningen',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Jan_Bremmer.jpg',
    contribution: [
      'Antik din ve mit çalışmalarında tarihsel-kültürel bağlamın önceliğini vurguladı.',
      'Yunan mitlerinin sosyal pratiklerle ilişkisini ayrıntılı olarak inceledi.',
    ],
    works: ['Greek Religion', 'Interpretations of Greek Mythology'],
    focusMyths: ['orpheus-eurydice', 'persephone-seasons'],
    thesisParaphrase:
      'Mitin anlamı metnin kendisi kadar onu taşıyan toplumsal pratikte de üretilir.',
  },
  {
    id: 'sarah-johnston',
    name: 'Sarah Iles Johnston',
    dates: '1962-',
    institution: 'Ohio State University',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Sarah_Iles_Johnston.jpg',
    contribution: [
      'Antik mit anlatılarında ritüel pratik, büyü ve dini deneyim bağlarını araştırdı.',
      'Mitin sadece anlatı değil performatif bir bilgi sistemi olduğunu gösterdi.',
    ],
    works: ['The Story of Myth', 'Restless Dead'],
    focusMyths: ['book-of-dead', 'ishtar-descent'],
    thesisParaphrase:
      'Mitler, ritüel performansla birleştiğinde toplumsal hakikat rejimlerini güçlendirir.',
  },
  {
    id: 'bruce-lincoln',
    name: 'Bruce Lincoln',
    dates: '1948-',
    institution: 'University of Chicago',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Bruce_Lincoln.jpg',
    contribution: [
      'Mitin siyasi kullanımlarını ve ideolojik üretim gücünü karşılaştırmalı olarak inceledi.',
      'Anlatıların sadece sembolik değil iktidar ilişkileriyle de biçimlendiğini ortaya koydu.',
    ],
    works: ['Theorizing Myth', 'Discourse and the Construction of Society'],
    focusMyths: ['romulus-remus', 'aeneid', 'osiris-isis'],
    thesisParaphrase:
      'Mit anlatısı, toplumsal düzeni meşrulaştıran ideolojik bir araç olarak da işler.',
  },
  {
    id: 'calvert-watkins',
    name: 'Calvert Watkins',
    dates: '1933-2013',
    institution: 'Harvard University',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/43/Calvert_Watkins.jpg',
    contribution: [
      'Hint-Avrupa poetik formüllerinin mitik aktarımdaki rolünü filolojik olarak açıkladı.',
      'Dilsel tekrar kalıplarını mitik hafıza mekanizması olarak değerlendirdi.',
    ],
    works: ['How to Kill a Dragon'],
    focusMyths: ['sigurd-dragon', 'thor-jormungandr', 'vritra-slaying'],
    thesisParaphrase:
      'Poetik formüller, mitlerin kuşaklar arası iletiminde yapısal omurga işlevi görür.',
  },
  {
    id: 'robert-segal',
    name: 'Robert A. Segal',
    dates: '1947-',
    institution: 'University of Aberdeen',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b6/Robert_A._Segal.jpg',
    contribution: [
      'Mit kuramları tarihini sistematik şekilde sınıflandırarak alana metodolojik netlik kazandırdı.',
      'Psikolojik, sosyolojik ve yapısal yaklaşımların kullanım alanlarını karşılaştırdı.',
    ],
    works: ['Myth: A Very Short Introduction', 'Theorizing About Myth'],
    focusMyths: ['heracles-labors', 'odyssey'],
    thesisParaphrase:
      'Mitleri anlamak için önce hangi kuramsal soruyu sorduğumuzu açıklaştırmak gerekir.',
  },
  {
    id: 'carlo-ginzburg',
    name: 'Carlo Ginzburg',
    dates: '1939-',
    institution: 'Scuola Normale Superiore / UCLA',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Carlo_Ginzburg.jpg',
    contribution: [
      'Mikro-tarihsel yaklaşımla halk inanç ve anlatılarının uzun süreli dönüşümünü izledi.',
      'Mitik kalıntıların yerel pratiklerde nasıl yaşadığına dair model sundu.',
    ],
    works: ['Ecstasies', 'Clues, Myths, and the Historical Method'],
    focusMyths: ['baba-yaga', 'wild-hunt'],
    thesisParaphrase:
      'Büyük mitik yapılar, yerel uygulamalarda izlenebilen küçük belirtilerle de okunabilir.',
  },
  {
    id: 'gregory-nagy',
    name: 'Gregory Nagy',
    dates: '1942-',
    institution: 'Harvard University',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Gregory_Nagy.jpg',
    contribution: [
      'Homeros geleneğini performans ve sözlü-formül kuramlarıyla yeniden yorumladı.',
      'Epik metnin sabit değil, performatif ve tarihsel olarak değişen bir gelenek olduğunu savundu.',
    ],
    works: ['The Best of the Achaeans', 'Homer the Preclassic'],
    focusMyths: ['iliad-achilles', 'odyssey'],
    thesisParaphrase:
      'Epik mit, tek bir metin değil performanslar ağında sürekli yeniden kurulan bir gelenektir.',
  },
];

export default function ScholarsPage() {
  return (
    <section className="section-container py-24">
      <header className="ancient-card p-6">
        <p className="meta-text text-xs uppercase tracking-[0.2em]">Karşılaştırmalı Mitoloji</p>
        <h1 className="mt-2 text-4xl text-gold md:text-5xl">Akademisyenler</h1>
        <p className="mt-3 text-foreground/80">
          MythAtlas paralellerinde sık referans verilen karşılaştırmalı mitoloji
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
                  <p className="text-xs uppercase tracking-[0.12em] text-gold/80">Önemli eserler</p>
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
                    MythAtlas odaklı bağlantılar
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

