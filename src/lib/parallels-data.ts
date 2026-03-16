export interface ParallelVersion {
  id: string;
  mythName: string;
  tradition: string;
  culture: string;
  coordinates: [number, number];
  motifs: string[];
  summary: string;
}

export interface ParallelThemeCluster {
  id: string;
  icon: string;
  name: string;
  subtitle: string;
  color: string;
  versions: ParallelVersion[];
}

export interface MapParallelConnection {
  id: string;
  fromMythId: string;
  toMythId: string;
  themeId: string;
  similarity: number;
  rationale: string;
}

export interface CuratedComparisonEntry {
  ids: [string, string];
  similarity: number;
  probableConnection: string;
  analysis: string;
}

export const parallelThemeClusters: ParallelThemeCluster[] = [
  {
    id: 'great-flood',
    icon: '🌊',
    name: 'Büyük Tufan',
    subtitle: 'Kültürler arasında tekrar eden küresel sel anlatıları.',
    color: '#5AC8FA',
    versions: [
      { id: 'noah-flood-curated', mythName: 'Nuh Tufanı', tradition: 'Biblical / Abrahamic', culture: 'Levant', coordinates: [35.2, 31.8], motifs: ['flood', 'ark', 'animals', 'renewal'], summary: 'Seçilmiş kurtuluş ve yeni başlangıç.' },
      { id: 'mesopotamian-flood', mythName: 'Utnapiştim Tufanı', tradition: 'Mesopotamian', culture: 'Sumerian-Babylonian', coordinates: [45.64, 31.32], motifs: ['flood', 'ark', 'birds', 'renewal'], summary: 'En eski yazılı tufan çekirdeği.' },
      { id: 'manu-flood', mythName: 'Manu ve Balık', tradition: 'Hindu', culture: 'Indic', coordinates: [77.2, 28.6], motifs: ['flood', 'boat', 'divine-warning', 'renewal'], summary: 'Matsya uyarır, tohumlar korunur.' },
      { id: 'deucalion-flood', mythName: 'Deukalion Tufanı', tradition: 'Greek', culture: 'Hellenic', coordinates: [22.5, 38.4], motifs: ['flood', 'couple', 'survival', 'new-humanity'], summary: 'Çift, insanlığı yeniden başlatır.' },
      { id: 'nuu-flood-curated', mythName: 'Nu’u Tufanı', tradition: 'Hawaiian', culture: 'Polynesian', coordinates: [-157.8, 21.3], motifs: ['flood', 'canoe', 'mountain', 'renewal'], summary: 'Kano ile kurtuluş varyantı.' },
      { id: 'chinese-flood', mythName: 'Yu Büyük Seli Yönetir', tradition: 'Chinese', culture: 'Huaxia', coordinates: [112.5, 34.7], motifs: ['flood', 'engineering', 'civilization'], summary: 'Selin yönetimi devlet kurucu motife dönüşür.' },
      { id: 'maya-flood', mythName: 'Ağaç İnsanların Tufanı', tradition: 'Maya', culture: 'Kʼicheʼ Maya', coordinates: [-90.5, 15.3], motifs: ['flood', 'failed-humanity', 'reset'], summary: 'Başarısız yaratım sel ile sonlanır.' },
      { id: 'persian-flood', mythName: 'Yima’nın Vara’sı', tradition: 'Persian', culture: 'Iranian', coordinates: [51.4, 35.7], motifs: ['catastrophe', 'shelter', 'selected-life'], summary: 'Felaket öncesi korumalı yaşam alanı.' },
      { id: 'inca-flood-curated', mythName: 'Unu Pachakuti', tradition: 'Inca', culture: 'Quechua', coordinates: [-71.9, -13.5], motifs: ['flood', 'divine-anger', 'reset'], summary: 'Viracocha dünya düzenini sıfırlar.' },
      { id: 'aztec-flood-curated', mythName: 'Coxcox Seli', tradition: 'Aztec', culture: 'Mexica', coordinates: [-99.1, 19.4], motifs: ['flood', 'survival', 'new-humanity'], summary: 'Felaket sonrası insan soyu yeniden kurulur.' },
      { id: 'norse-flood-curated', mythName: 'Bergelmir Seli', tradition: 'Norse', culture: 'Old Norse', coordinates: [10.8, 59.9], motifs: ['primordial-flood', 'ancestral-survival'], summary: 'Ymir kanından doğan kozmik sel.' },
      { id: 'sumerian-ziusudra-curated', mythName: 'Ziusudra Tufanı', tradition: 'Sumerian', culture: 'Sumer', coordinates: [45.0, 31.0], motifs: ['flood', 'boat', 'sacrifice'], summary: 'Utnapiştim öncülü gelenek.' },
      { id: 'korean-flood-curated', mythName: 'Mokdooryeong Seli', tradition: 'Korean', culture: 'Korean', coordinates: [127.0, 37.5], motifs: ['flood', 'survival', 'pairing'], summary: 'Selden sonra soyun sürdürülmesi.' },
      { id: 'tai-flood-curated', mythName: 'Naga Seli', tradition: 'Tai-Lao', culture: 'Southeast Asian', coordinates: [102.6, 17.9], motifs: ['flood', 'serpent', 'reset'], summary: 'Yılan bağlantılı su felaketi.' },
      { id: 'yoruba-flood-curated', mythName: 'Olokun Taşkını', tradition: 'Yoruba', culture: 'West African', coordinates: [3.9, 7.4], motifs: ['flood', 'divine-balance', 'restoration'], summary: 'Denge bozulur, yeni düzen kurulur.' },
      { id: 'maasai-flood-curated', mythName: 'Tumbainot Seli', tradition: 'Maasai', culture: 'East African', coordinates: [36.8, -1.3], motifs: ['flood', 'vessel', 'renewal'], summary: 'Seçilmiş kurtuluş kalıbı.' },
      { id: 'apache-flood-curated', mythName: 'Dağ Tepesi Seli', tradition: 'Apache', culture: 'Native North American', coordinates: [-109.0, 34.0], motifs: ['flood', 'high-ground', 'ancestral-survival'], summary: 'Topluluk yüksek zeminde korunur.' },
      { id: 'guarani-flood-curated', mythName: 'Guarani Büyük Sel', tradition: 'Guarani', culture: 'South American', coordinates: [-57.6, -25.3], motifs: ['flood', 'serpent', 'purification'], summary: 'Arınma ve yeni döngü başlangıcı.' },
      { id: 'aboriginal-flood-curated', mythName: 'Dreaming Sel Varyantları', tradition: 'Aboriginal Australian', culture: 'Aboriginal', coordinates: [133.8, -25.2], motifs: ['flood', 'landform-creation', 'law-renewal'], summary: 'Toprak biçimleri sel hafızasıyla anlatılır.' },
      { id: 'philippine-flood-curated', mythName: 'Ifugao Sel Efsanesi', tradition: 'Philippine', culture: 'Cordillera', coordinates: [121.1, 16.9], motifs: ['flood', 'mountain-refuge', 'new-order'], summary: 'Dağ sığınağı ve toplumsal yeniden kuruluş.' },
    ],
  },
  {
    id: 'creation',
    icon: '🌍',
    name: 'Yaratılış',
    subtitle: 'Kaostan düzene ve boşluktan kozmosa çıkan anlatılar.',
    color: '#7ED957',
    versions: [
      { id: 'genesis-creation-curated', mythName: 'Genesis Yaratılışı', tradition: 'Biblical', culture: 'Hebrew', coordinates: [35.2, 31.8], motifs: ['creation', 'word', 'order-from-chaos'], summary: 'Sözle düzenli yaratım.' },
      { id: 'enuma-elish', mythName: 'Enuma Elish', tradition: 'Mesopotamian', culture: 'Babylonian', coordinates: [44.4, 32.5], motifs: ['creation', 'cosmic-battle', 'primordial-waters'], summary: 'Kozmik savaş sonrası evren kurulumu.' },
      { id: 'pangu-creation', mythName: 'Pangu', tradition: 'Chinese', culture: 'Han', coordinates: [108.9, 34.3], motifs: ['creation', 'cosmic-egg', 'body-becomes-world'], summary: 'Pangu’nun bedeni dünyaya dönüşür.' },
      { id: 'hindu-creation', mythName: 'Purusha / Brahma', tradition: 'Hindu', culture: 'Vedic', coordinates: [77.2, 28.6], motifs: ['creation', 'sacrifice', 'cosmic-body'], summary: 'Kozmik beden ve döngüsel yaratım.' },
      { id: 'polynesian-creation', mythName: 'Rangi ve Papa', tradition: 'Polynesian', culture: 'Maori', coordinates: [174.8, -36.8], motifs: ['creation', 'sky-earth-separation', 'light'], summary: 'Gökyüzü-yer ayrımıyla düzen doğar.' },
      { id: 'inca-viracocha', mythName: 'Viracocha Yaratımı', tradition: 'Inca', culture: 'Quechua', coordinates: [-71.9, -13.5], motifs: ['creation', 'lake-origin', 'multiple-attempts'], summary: 'Yaratıcının çoklu denemeleri.' },
      { id: 'greek-creation', mythName: 'Chaos’tan Olimpos’a', tradition: 'Greek', culture: 'Hellenic', coordinates: [22.3, 40.1], motifs: ['creation', 'succession', 'generational-conflict'], summary: 'Kuşak çatışmasıyla kozmik düzen.' },
      { id: 'norse-creation', mythName: 'Ginnungagap', tradition: 'Norse', culture: 'Old Norse', coordinates: [-18.5, 64.9], motifs: ['creation', 'ice-fire', 'primordial-being'], summary: 'Ymir’in bedeninden dünya.' },
      { id: 'egyptian-creation', mythName: 'Atum ve İlk Tepe', tradition: 'Egyptian', culture: 'Ancient Egyptian', coordinates: [31.2, 30.1], motifs: ['creation', 'primordial-water', 'solar-order'], summary: 'Nun’dan yükselen ilk tepe.' },
      { id: 'nuwa-creation', mythName: 'Nüwa İnsanları Yaratır', tradition: 'Chinese', culture: 'Han', coordinates: [113.6, 34.7], motifs: ['creation', 'clay-humans', 'repairing-sky'], summary: 'Kil insan ve göğün onarımı.' },
      { id: 'aztec-five-suns', mythName: 'Beş Güneş', tradition: 'Aztec', culture: 'Mexica', coordinates: [-99.1, 19.4], motifs: ['creation', 'cyclical-worlds', 'sacrifice'], summary: 'Çağların yaratılıp yıkılması.' },
      { id: 'izanagi-izanami', mythName: 'İzanagi ve İzanami', tradition: 'Japanese', culture: 'Shinto', coordinates: [139.7, 35.6], motifs: ['creation', 'island-formation', 'divine-couple'], summary: 'Adaların ve kami soyunun doğuşu.' },
    ],
  },
  {
    id: 'hero-journey',
    icon: '🦸',
    name: 'Kahraman Yolculuğu',
    subtitle: 'Sınav, kayıp, olgunlaşma ve dönüşe dayalı ortak kahraman matrisi.',
    color: '#F9A826',
    versions: [
      { id: 'heracles-labors', mythName: 'Herkül’ün On İki Görevi', tradition: 'Greek', culture: 'Hellenic', coordinates: [22.8, 37.6], motifs: ['hero', 'trials', 'atonement'], summary: 'Arınma için imkansız görevler.' },
      { id: 'gilgamesh-quest', mythName: 'Gılgamış Destanı', tradition: 'Mesopotamian', culture: 'Sumerian-Akkadian', coordinates: [45.64, 31.32], motifs: ['hero', 'friendship', 'mortality'], summary: 'Ölümlülüğün kabulüyle dönüşüm.' },
      { id: 'ramayana', mythName: 'Rama’nın Yolculuğu', tradition: 'Hindu', culture: 'Indic', coordinates: [79.8, 10.9], motifs: ['hero', 'exile', 'rescue', 'dharma'], summary: 'Sürgün-savaş-dönüş döngüsü.' },
      { id: 'odyssey', mythName: 'Odysseia', tradition: 'Greek', culture: 'Hellenic', coordinates: [20.5, 38.3], motifs: ['hero', 'journey', 'homecoming'], summary: 'Uzun dönüş yolculuğu.' },
      { id: 'beowulf-curated', mythName: 'Beowulf', tradition: 'Anglo-Saxon', culture: 'Germanic', coordinates: [12.6, 55.7], motifs: ['hero', 'monster-slaying', 'fate'], summary: 'Canavar avı ve son savaş.' },
      { id: 'monkey-king', mythName: 'Sun Wukong', tradition: 'Chinese', culture: 'Ming China', coordinates: [116.4, 39.9], motifs: ['hero', 'rebellion', 'pilgrimage'], summary: 'Asi figürün disiplinle olgunlaşması.' },
      { id: 'aeneid', mythName: 'Aeneas Destanı', tradition: 'Roman', culture: 'Roman', coordinates: [12.5, 41.9], motifs: ['hero', 'destiny', 'migration'], summary: 'Kişisel değil tarihsel görev.' },
      { id: 'rostam-labors', mythName: 'Rüstem’in Görevleri', tradition: 'Persian', culture: 'Iranian', coordinates: [51.4, 35.7], motifs: ['hero', 'trials', 'national-epic'], summary: 'Ulusal epik kahramanlık.' },
      { id: 'david-sassoun', mythName: 'Sasunlu Davit', tradition: 'Armenian', culture: 'Armenian', coordinates: [44.5, 40.2], motifs: ['hero', 'justice', 'resistance'], summary: 'Yerel adalet kahramanı.' },
      { id: 'popol-vuh', mythName: 'Kahraman İkizler', tradition: 'Maya', culture: 'Kʼicheʼ Maya', coordinates: [-90.5, 15.3], motifs: ['hero', 'underworld-trials', 'rebirth'], summary: 'Yeraltı sınavlarında zafer.' },
      { id: 'cuchulainn-battle', mythName: 'Cú Chulainn', tradition: 'Celtic', culture: 'Irish', coordinates: [-6.2, 53.3], motifs: ['hero', 'battle-frenzy', 'fate'], summary: 'Trajik savunma kahramanlığı.' },
    ],
  },
  {
    id: 'death-rebirth',
    icon: '🌊',
    name: 'Ölüm ve Yeniden Doğuş',
    subtitle: 'Ölümün döngüsel bir eşik olarak işlendiği güçlü mit aileleri.',
    color: '#D16BA5',
    versions: [
      { id: 'osiris-isis', mythName: 'Osiris’in Dirilişi', tradition: 'Egyptian', culture: 'Ancient Egyptian', coordinates: [32.9, 26.1], motifs: ['death', 'resurrection', 'kingship'], summary: 'Parçalanma ve diriliş.' },
      { id: 'persephone-seasons', mythName: 'Persephone Döngüsü', tradition: 'Greek', culture: 'Hellenic', coordinates: [22.4, 37.0], motifs: ['death', 'underworld', 'seasonal-return'], summary: 'Mevsimsel iniş-çıkış kalıbı.' },
      { id: 'baldr-death-curated', mythName: 'Baldr’ın Ölümü', tradition: 'Norse', culture: 'Old Norse', coordinates: [10.8, 59.9], motifs: ['death', 'innocent-god', 'return'], summary: 'Kozmik sonun habercisi kayıp.' },
      { id: 'dionysus-rebirth-curated', mythName: 'Dionysos’un Dönüşü', tradition: 'Greek-Orphic', culture: 'Hellenic', coordinates: [23.7, 37.9], motifs: ['death', 'dismemberment', 'rebirth'], summary: 'Parçalanma ve yeniden kurulma.' },
      { id: 'jesus-resurrection-curated', mythName: 'İsa’nın Dirilişi', tradition: 'Christian', culture: 'Late Antique Levant', coordinates: [35.2, 31.8], motifs: ['death', 'sacrifice', 'resurrection'], summary: 'Akademik paralellerde merkezi örnek.' },
      { id: 'ishtar-descent', mythName: 'İştar’ın İnişi', tradition: 'Mesopotamian', culture: 'Akkadian', coordinates: [44.4, 33.3], motifs: ['descent', 'death', 'return'], summary: 'Yeraltı inişi ve dönüş.' },
      { id: 'book-of-dead', mythName: 'Duat Yolculuğu', tradition: 'Egyptian', culture: 'Ancient Egyptian', coordinates: [31.2, 30.0], motifs: ['afterlife', 'judgment', 'rebirth'], summary: 'Öte dünya haritası.' },
      { id: 'ragnarok', mythName: 'Ragnarök Sonrası', tradition: 'Norse', culture: 'Old Norse', coordinates: [-21.9, 64.1], motifs: ['cosmic-death', 'renewal'], summary: 'Kozmik yıkım ve yeni dünya.' },
      { id: 'aztec-five-suns', mythName: 'Beş Güneş Döngüsü', tradition: 'Aztec', culture: 'Mexica', coordinates: [-99.1, 19.4], motifs: ['cosmic-death', 'rebirth', 'cyclical-time'], summary: 'Çağların ölümü ve yenilenmesi.' },
      { id: 'popol-vuh', mythName: 'İkizlerin Dönüşü', tradition: 'Maya', culture: 'Kʼicheʼ Maya', coordinates: [-90.5, 15.3], motifs: ['sacrifice', 'death', 'rebirth'], summary: 'Ölümden sonra göksel yükseliş.' },
    ],
  },
  {
    id: 'fire-theft',
    icon: '🔥',
    name: 'Ateşin Çalınması',
    subtitle: 'Ateşin kültür teknolojisi olarak insanlığa geçiş hikayeleri.',
    color: '#FF6B35',
    versions: [
      { id: 'prometheus-fire', mythName: 'Prometheus Ateşi Çalar', tradition: 'Greek', culture: 'Hellenic', coordinates: [22.5, 38.4], motifs: ['fire', 'theft', 'gift-to-humanity', 'punishment'], summary: 'Ateş armağanı ve ağır bedel.' },
      { id: 'maui-fire', mythName: 'Maui Ateşi Getirir', tradition: 'Polynesian', culture: 'Maori-Polynesian', coordinates: [-157.8, 21.3], motifs: ['fire', 'trickster', 'gift-to-humanity'], summary: 'Hileyle ateş bilgisinin aktarımı.' },
      { id: 'aboriginal-crow-fire', mythName: 'Karga Ateşi Yaydı', tradition: 'Aboriginal Australian', culture: 'Aboriginal', coordinates: [144.9, -37.8], motifs: ['fire', 'trickster', 'distribution'], summary: 'Ateşin tekellerden kurtuluşu.' },
      { id: 'coyote-trickster', mythName: 'Koyote Ateşi Çalar', tradition: 'Native American', culture: 'Plateau traditions', coordinates: [-118.2, 34.0], motifs: ['fire', 'trickster', 'community'], summary: 'Topluluk yararı için ateş hırsızlığı.' },
      { id: 'amirani-fire', mythName: 'Amirani', tradition: 'Georgian', culture: 'Kartvelian', coordinates: [44.8, 41.7], motifs: ['fire', 'culture-hero', 'punishment'], summary: 'Kafkas Prometheus’u.' },
      { id: 'aboriginal-fire', mythName: 'Aboriginal Ateş Kökeni', tradition: 'Aboriginal Australian', culture: 'Aboriginal', coordinates: [133.8, -25.2], motifs: ['fire', 'origin', 'sharing'], summary: 'Ateşin yasa ve paylaşım boyutu.' },
      { id: 'zhurong-fire-curated', mythName: 'Zhurong Ateş Düzeni', tradition: 'Chinese', culture: 'Early Chinese', coordinates: [113.0, 34.8], motifs: ['fire', 'order', 'technology'], summary: 'Ateşin düzen kurucu yorumu.' },
    ],
  },
  {
    id: 'sun-moon',
    icon: '🌙',
    name: 'Güneş ve Ay Mitleri',
    subtitle: 'Göksel döngüleri ritüel ve toplumsal takvime bağlayan anlatılar.',
    color: '#F4D35E',
    versions: [
      { id: 'amaterasu-cave', mythName: 'Amaterasu Mağarada', tradition: 'Japanese', culture: 'Shinto', coordinates: [135.5, 34.7], motifs: ['sun', 'withdrawal', 'light-return'], summary: 'Güneş kaybolur, ritüelle geri döner.' },
      { id: 'chang-e-moon', mythName: 'Chang’e Ay’a Çıkar', tradition: 'Chinese', culture: 'Han', coordinates: [116.4, 39.9], motifs: ['moon', 'elixir', 'immortality'], summary: 'Ay ve ölümsüzlük bağı.' },
      { id: 'inca-inti-raymi', mythName: 'Inti Raymi', tradition: 'Inca', culture: 'Quechua', coordinates: [-71.9, -13.5], motifs: ['sun', 'ritual-calendar', 'state-cosmology'], summary: 'Güneş merkezli imparatorluk ritüeli.' },
      { id: 'egyptian-ra-journey', mythName: 'Ra’nın Gece Yolculuğu', tradition: 'Egyptian', culture: 'Ancient Egyptian', coordinates: [32.6, 25.7], motifs: ['sun', 'night-journey', 'rebirth'], summary: 'Her gece ölüm-her sabah doğuş.' },
      { id: 'aztec-coyolxauhqui', mythName: 'Coyolxauhqui Çatışması', tradition: 'Aztec', culture: 'Mexica', coordinates: [-99.1, 19.4], motifs: ['sun-moon-conflict', 'cosmic-war'], summary: 'Güneş-ay gerilimi savaş mitine bağlanır.' },
      { id: 'chinese-chang-e-archer', mythName: 'Hou Yi Dokuz Güneşi Vurur', tradition: 'Chinese', culture: 'Han', coordinates: [108.9, 34.2], motifs: ['sun', 'heroic-restoration'], summary: 'Aşırı güneş düzeni kahramanca düzeltilir.' },
      { id: 'greek-helios-curated', mythName: 'Helios’un Arabası', tradition: 'Greek', culture: 'Hellenic', coordinates: [23.7, 37.9], motifs: ['sun', 'daily-course'], summary: 'Güneşin rotası kişileştirilir.' },
      { id: 'norse-sol-mani-curated', mythName: 'Sól ve Máni', tradition: 'Norse', culture: 'Old Norse', coordinates: [10.8, 59.9], motifs: ['sun-moon', 'cosmic-pursuit'], summary: 'Kozmik kovalamaca modeli.' },
      { id: 'yoruba-sun-moon-curated', mythName: 'Orun ve Oşupa', tradition: 'Yoruba', culture: 'West African', coordinates: [3.9, 7.4], motifs: ['sun-moon', 'balance'], summary: 'Gündüz-gece dengesi toplumsal ölçü olur.' },
      { id: 'maori-maui-sun-curated', mythName: 'Maui Güneşi Yavaşlatır', tradition: 'Maori', culture: 'Polynesian', coordinates: [174.8, -36.8], motifs: ['sun', 'time-control', 'human-benefit'], summary: 'Güneş hareketi insan yaşamına uyarlanır.' },
    ],
  },
  {
    id: 'dragon-serpent',
    icon: '🐍',
    name: 'Ejderha / Yılan',
    subtitle: 'Kaos, bilgelik, sınır ve dönüşümün ortak sembol ağı.',
    color: '#A66CFF',
    versions: [
      { id: 'thor-jormungandr', mythName: 'Thor ve Jörmungandr', tradition: 'Norse', culture: 'Old Norse', coordinates: [-21.9, 64.1], motifs: ['serpent', 'cosmic-battle', 'sea'], summary: 'Yılan kaosu ve tanrısal düzen çatışması.' },
      { id: 'susanoo-serpent', mythName: 'Susanoo ve Orochi', tradition: 'Japanese', culture: 'Shinto', coordinates: [132.5, 35.4], motifs: ['serpent', 'heroic-slaying', 'treasure'], summary: 'Yılan yenilir, kutsal armağan doğar.' },
      { id: 'dragon-kings', mythName: 'Dört Ejderha Kralı', tradition: 'Chinese', culture: 'Han', coordinates: [121.5, 31.2], motifs: ['dragon', 'water', 'weather-control'], summary: 'Ejderha su düzeni kurar.' },
      { id: 'quetzalcoatl', mythName: 'Quetzalcoatl', tradition: 'Mesoamerican', culture: 'Nahua', coordinates: [-99.1, 19.4], motifs: ['feathered-serpent', 'wisdom', 'civilization'], summary: 'Tüylü yılan bilgi ve düzen taşır.' },
      { id: 'dreamtime-rainbow-serpent', mythName: 'Gökkuşağı Yılanı', tradition: 'Aboriginal Australian', culture: 'Aboriginal', coordinates: [133.8, -25.2], motifs: ['serpent', 'creation', 'law', 'water'], summary: 'Yılan toprağı ve yasayı şekillendirir.' },
      { id: 'hittite-illuyanka', mythName: 'Illuyanka', tradition: 'Hittite', culture: 'Anatolian', coordinates: [34.6, 40.0], motifs: ['dragon', 'storm-god', 'kingship'], summary: 'Fırtına tanrısı ejderha düellosu.' },
      { id: 'sigurd-dragon', mythName: 'Sigurd ve Fafnir', tradition: 'Norse-Germanic', culture: 'Germanic', coordinates: [18.1, 59.3], motifs: ['dragon', 'slaying', 'cursed-treasure'], summary: 'Ejderha yenilir, lanet sürer.' },
      { id: 'armenian-vahagn', mythName: 'Vahagn Ejderha Avcısı', tradition: 'Armenian', culture: 'Armenian', coordinates: [44.5, 40.2], motifs: ['dragon', 'storm-fire', 'heroic-birth'], summary: 'Ateşten doğan ejderha avcısı.' },
      { id: 'egypt-apophis-curated', mythName: 'Apophis', tradition: 'Egyptian', culture: 'Ancient Egyptian', coordinates: [31.2, 30.0], motifs: ['serpent', 'chaos', 'solar-cycle'], summary: 'Güneşi yutmaya çalışan kaos yılanı.' },
      { id: 'slavic-zmey-curated', mythName: 'Zmey Gorynych', tradition: 'Slavic', culture: 'East Slavic', coordinates: [37.6, 55.7], motifs: ['dragon', 'multi-head', 'heroic-defense'], summary: 'Çok başlı sınır tehdidi ejderha.' },
    ],
  },
  {
    id: 'creator-god',
    icon: '👁',
    name: 'Yaratıcı Tanrı',
    subtitle: 'Tek yaratıcı fikrinin çoktanrılı sistemlerdeki analogları.',
    color: '#58D68D',
    versions: [
      { id: 'yahweh-creator-curated', mythName: 'YHWH', tradition: 'Biblical', culture: 'Hebrew', coordinates: [35.2, 31.8], motifs: ['single-creator', 'transcendent', 'word-creation'], summary: 'Aşkın tek yaratıcı modeli.' },
      { id: 'allah-creator-curated', mythName: 'Allah', tradition: 'Islamic', culture: 'Arabic-Islamic', coordinates: [39.8, 21.4], motifs: ['single-creator', 'transcendent', 'mercy'], summary: 'Tevhid merkezli yaratıcı anlayışı.' },
      { id: 'brahma-creator-curated', mythName: 'Brahma', tradition: 'Hindu', culture: 'Indic', coordinates: [74.5, 26.4], motifs: ['creator', 'emanation', 'cycle'], summary: 'Yaratım işlevi trinitik yapıda ayrışır.' },
      { id: 'ra-atum-creator-curated', mythName: 'Atum / Ra', tradition: 'Egyptian', culture: 'Ancient Egyptian', coordinates: [31.2, 30.0], motifs: ['creator', 'self-generation', 'solar-order'], summary: 'Kendinden doğan yaratıcı figür.' },
      { id: 'olodumare-creator-curated', mythName: 'Olodumare', tradition: 'Yoruba', culture: 'West African', coordinates: [3.9, 7.4], motifs: ['high-god', 'delegated-creation'], summary: 'Yaratım aracı ilahilerle yürür.' },
      { id: 'viracocha-creator-curated', mythName: 'Viracocha', tradition: 'Inca', culture: 'Quechua', coordinates: [-71.9, -13.5], motifs: ['creator', 'world-fashioning', 'withdrawal'], summary: 'Dünyayı kurup geri çekilen yaratıcı.' },
      { id: 'taaroa-creator-curated', mythName: 'Taʻaroa', tradition: 'Polynesian', culture: 'Tahitian', coordinates: [-149.6, -17.5], motifs: ['creator', 'cosmic-shell', 'self-emergence'], summary: 'Kozmik kabuktan açılan yaratıcı.' },
      { id: 'anu-creator-curated', mythName: 'Anu', tradition: 'Mesopotamian', culture: 'Sumerian-Akkadian', coordinates: [45.0, 31.0], motifs: ['sky-father', 'high-god', 'remote-sovereignty'], summary: 'Uzak ama en yüksek ilahi otorite.' },
      { id: 'rod-creator-curated', mythName: 'Rod', tradition: 'Slavic', culture: 'Proto-Slavic', coordinates: [30.5, 50.4], motifs: ['creator', 'fate', 'ancestral-origin'], summary: 'Kader ve soy kurucu yaratıcı figür.' },
    ],
  },
];

export const parallelThemeColorById = parallelThemeClusters.reduce<Record<string, string>>((acc, cluster) => {
  acc[cluster.id] = cluster.color;
  return acc;
}, {});

export const mapParallelConnections: MapParallelConnection[] = [
  { id: 'arc-flood-1', fromMythId: 'mesopotamian-flood', toMythId: 'manu-flood', themeId: 'great-flood', similarity: 93, rationale: 'Uyarı-gemi-yeniden başlangıç kalıbı.' },
  { id: 'arc-flood-2', fromMythId: 'mesopotamian-flood', toMythId: 'deucalion-flood', themeId: 'great-flood', similarity: 86, rationale: 'Seçilmiş hayatta kalış anlatısı.' },
  { id: 'arc-flood-3', fromMythId: 'mesopotamian-flood', toMythId: 'chinese-flood', themeId: 'great-flood', similarity: 77, rationale: 'Sel sonrası düzen inşası.' },
  { id: 'arc-creation-1', fromMythId: 'enuma-elish', toMythId: 'greek-creation', themeId: 'creation', similarity: 84, rationale: 'Kozmik kuşak çatışması.' },
  { id: 'arc-creation-2', fromMythId: 'pangu-creation', toMythId: 'norse-creation', themeId: 'creation', similarity: 75, rationale: 'Kozmik bedenin dünyaya dönüşmesi.' },
  { id: 'arc-creation-3', fromMythId: 'polynesian-creation', toMythId: 'inca-viracocha', themeId: 'creation', similarity: 69, rationale: 'Aşamalı yaratılış ve toplumlandırma.' },
  { id: 'arc-hero-1', fromMythId: 'heracles-labors', toMythId: 'gilgamesh-quest', themeId: 'hero-journey', similarity: 89, rationale: 'Sınavlar ve ölümlülük farkındalığı.' },
  { id: 'arc-hero-2', fromMythId: 'odyssey', toMythId: 'ramayana', themeId: 'hero-journey', similarity: 79, rationale: 'Sürgün-yolculuk-dönüş matrisi.' },
  { id: 'arc-hero-3', fromMythId: 'monkey-king', toMythId: 'heracles-labors', themeId: 'hero-journey', similarity: 71, rationale: 'Aşırı güç ve disiplin teması.' },
  { id: 'arc-death-1', fromMythId: 'osiris-isis', toMythId: 'persephone-seasons', themeId: 'death-rebirth', similarity: 82, rationale: 'Ölüm-dönüş ve mevsimsel ritim.' },
  { id: 'arc-death-2', fromMythId: 'book-of-dead', toMythId: 'ragnarok', themeId: 'death-rebirth', similarity: 67, rationale: 'Kozmik son/yeniden başlangıç şeması.' },
  { id: 'arc-fire-1', fromMythId: 'prometheus-fire', toMythId: 'maui-fire', themeId: 'fire-theft', similarity: 91, rationale: 'Ateşin kültür armağanı olması.' },
  { id: 'arc-fire-2', fromMythId: 'prometheus-fire', toMythId: 'coyote-trickster', themeId: 'fire-theft', similarity: 74, rationale: 'İlahi kaynaktan toplumsal ateş transferi.' },
  { id: 'arc-sun-1', fromMythId: 'amaterasu-cave', toMythId: 'chang-e-moon', themeId: 'sun-moon', similarity: 68, rationale: 'Göksel düzenin kriz ve dönüşü.' },
  { id: 'arc-sun-2', fromMythId: 'inca-inti-raymi', toMythId: 'amaterasu-cave', themeId: 'sun-moon', similarity: 65, rationale: 'Ritüel merkezli güneş kozmolojisi.' },
  { id: 'arc-serpent-1', fromMythId: 'thor-jormungandr', toMythId: 'susanoo-serpent', themeId: 'dragon-serpent', similarity: 83, rationale: 'Yılan-kaos ile düzen çatışması.' },
  { id: 'arc-serpent-2', fromMythId: 'quetzalcoatl', toMythId: 'dreamtime-rainbow-serpent', themeId: 'dragon-serpent', similarity: 76, rationale: 'Yılan figürünün yaratım ve düzen rolü.' },
];

export const curatedComparisons: CuratedComparisonEntry[] = [
  {
    ids: ['noah-flood-curated', 'mesopotamian-flood'],
    similarity: 95,
    probableConnection: 'Levant-Mesopotamya hattında metin ve sözlü gelenek dolaşımı.',
    analysis: 'Gemi, seçilmiş kurtuluş, ilahi yargı ve tufan sonrası yeni düzen öğeleri çok güçlü biçimde örtüşür.',
  },
  {
    ids: ['prometheus-fire', 'maui-fire'],
    similarity: 90,
    probableConnection: 'Doğrudan temas yerine kültür-kurucu trickster/isyankar arketipinin bağımsız tekrarı.',
    analysis: 'İki anlatı da ateşi teknik sıçrama olarak kodlar; biri titan isyanı, diğeri trickster zekasıyla çalışır.',
  },
  {
    ids: ['zeus', 'jupiter'],
    similarity: 97,
    probableConnection: 'Roma’nın bilinçli Helen uyarlaması; güçlü doğrudan kültürel transfer.',
    analysis: 'Zeus-Jupiter hattı aynı gök-baba çekirdeğinin iki siyasi yorumu gibidir. Odin kıyasında eksen bilgelik-savaş yönüne kayar.',
  },
  {
    ids: ['heracles-labors', 'gilgamesh-quest'],
    similarity: 88,
    probableConnection: 'Yakın Doğu-Akdeniz epik anlatı kalıplarının uzun dönemli dolaşımı.',
    analysis: 'Yarı-ilahi güç, zor görevler ve ölümlülük farkındalığı ortak yapıyı kurar; sonuç ham zafer değil dönüşümdür.',
  },
  {
    ids: ['osiris-isis', 'persephone-seasons'],
    similarity: 82,
    probableConnection: 'Doğu Akdeniz tarım kültleri ve mevsimsel ritüellerde paralel gelişim/etkileşim.',
    analysis: 'Biri krallık ve öte dünya hukukunu, diğeri mevsim döngüsünü öne çıkarır; ikisi de kayıp-dönüş ritmiyle toplumsal takvimi düzenler.',
  },
];

export function createPairKey(leftId: string, rightId: string): string {
  return [leftId, rightId].sort().join('::');
}

export function calculateParallelSimilarity(a: ParallelVersion, b: ParallelVersion): number {
  const motifsA = new Set(a.motifs.map((item) => item.toLowerCase()));
  const motifsB = new Set(b.motifs.map((item) => item.toLowerCase()));

  let overlap = 0;
  motifsA.forEach((motif) => {
    if (motifsB.has(motif)) overlap += 1;
  });
  const unionSet = new Set<string>();
  motifsA.forEach((motif) => unionSet.add(motif));
  motifsB.forEach((motif) => unionSet.add(motif));
  const union = unionSet.size || 1;

  const motifScore = (overlap / union) * 78;
  const traditionBoost =
    a.tradition.toLowerCase() === b.tradition.toLowerCase()
      ? 10
      : a.culture.toLowerCase() === b.culture.toLowerCase()
        ? 6
        : 0;

  const distancePenalty = Math.min(12, haversineKm(a.coordinates, b.coordinates) / 1500);
  const raw = motifScore + traditionBoost + 20 - distancePenalty;
  return Math.max(30, Math.min(98, Math.round(raw)));
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const p1 = toRad(lat1);
  const p2 = toRad(lat2);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 6371 * (2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}
