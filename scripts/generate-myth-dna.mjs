import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mythsPath = path.resolve(__dirname, '../src/data/myths.json');

const ELEMENTS = [
  'flood',
  'fire',
  'forbidden_fruit',
  'underworld',
  'divine_birth',
  'betrayal',
  'sacrifice',
  'resurrection',
  'transformation',
  'quest',
  'creation_from_chaos',
  'cosmic_battle',
  'trickery',
  'forbidden_knowledge',
  'descent',
  'ascent',
  'prophecy',
  'revenge',
  'love_tragedy',
  'monster_slaying',
];

const ARCHETYPES = [
  'hero',
  'shadow',
  'trickster',
  'wise_old_man',
  'great_mother',
  'anima',
  'animus',
  'self',
  'threshold_guardian',
  'herald',
  'shapeshifter',
  'ally',
];

const STRUCTURE = [
  'ordinary_world',
  'call_to_adventure',
  'refusal',
  'mentor',
  'crossing_threshold',
  'tests',
  'ordeal',
  'reward',
  'road_back',
  'resurrection',
  'return',
];

const UNIVERSAL_SIGNAL_ELEMENTS = new Set([
  'flood',
  'quest',
  'underworld',
  'creation_from_chaos',
  'sacrifice',
  'transformation',
  'cosmic_battle',
  'monster_slaying',
  'resurrection',
]);

const toSetByOrder = (values, order) => {
  const seen = new Set(values);
  return order.filter((item) => seen.has(item));
};

const normalize = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const hasAny = (blob, terms) => terms.some((term) => blob.includes(term));

function inferElements(myth, blob) {
  const elements = new Set();

  if (hasAny(blob, ['flood', 'deluge', 'ark', 'inundation', 'tufan'])) {
    elements.add('flood');
    elements.add('quest');
  }

  if (hasAny(blob, ['fire', 'sun', 'solar', 'flame', 'volcan'])) elements.add('fire');
  if (hasAny(blob, ['forbidden fruit', 'eden', 'apple'])) elements.add('forbidden_fruit');
  if (hasAny(blob, ['underworld', 'hades', 'afterlife', 'hell', 'nether', 'dead'])) {
    elements.add('underworld');
    elements.add('descent');
  }
  if (hasAny(blob, ['divine birth', 'miraculous birth', 'virgin', 'demigod', 'twin sons', 'born of'])) {
    elements.add('divine_birth');
  }
  if (hasAny(blob, ['betray', 'treach', 'fratricide', 'deceive'])) elements.add('betrayal');
  if (hasAny(blob, ['sacrifice', 'offering', 'penance', 'selfless', 'martyr'])) elements.add('sacrifice');
  if (hasAny(blob, ['resurrection', 'rebirth', 'rise again', 'revive'])) {
    elements.add('resurrection');
  }
  if (hasAny(blob, ['transform', 'metamorph', 'shape', 'change'])) elements.add('transformation');
  if (hasAny(blob, ['quest', 'journey', 'odyssey', 'search', 'labors', 'trial', 'homecoming'])) elements.add('quest');
  if (hasAny(blob, ['creation', 'chaos', 'primordial', 'origin', 'cosmic egg', 'cosmos'])) {
    elements.add('creation_from_chaos');
  }
  if (hasAny(blob, ['cosmic battle', 'ragnarok', 'titanomach', 'war of gods', 'apocalypse', 'pralaya'])) {
    elements.add('cosmic_battle');
  }
  if (hasAny(blob, ['trickster', 'trickery', 'cunning', 'deception', 'theft', 'fox'])) elements.add('trickery');
  if (hasAny(blob, ['knowledge', 'wisdom', 'secret', 'forbidden', 'stole fire'])) elements.add('forbidden_knowledge');
  if (hasAny(blob, ['ascent', 'apotheosis', 'ascend', 'heaven'])) elements.add('ascent');
  if (hasAny(blob, ['prophecy', 'oracle', 'fate', 'doom', 'divination'])) elements.add('prophecy');
  if (hasAny(blob, ['revenge', 'vengeance', 'wrath'])) elements.add('revenge');
  if (hasAny(blob, ['love', 'traged', 'loss', 'forbidden-glance', 'devotion'])) elements.add('love_tragedy');
  if (hasAny(blob, ['dragon', 'monster', 'hydra', 'slay', 'beast'])) elements.add('monster_slaying');
  if (hasAny(blob, ['punishment', 'divine judgment', 'divine-judgment', 'hubris', 'wrath of gods'])) {
    elements.add('revenge');
  }

  const type = normalize(myth.type);
  if (type === 'creation') {
    elements.add('creation_from_chaos');
    elements.add('resurrection');
  }
  if (type === 'hero' || type === 'quest') elements.add('quest');
  if (type === 'afterlife') {
    elements.add('underworld');
    elements.add('descent');
  }
  if (type === 'war' || type === 'cosmology') elements.add('cosmic_battle');
  if (type === 'trickster') elements.add('trickery');
  if (type === 'transformation') elements.add('transformation');
  if (type === 'love') elements.add('love_tragedy');

  if (elements.has('flood')) {
    elements.add('revenge');
    elements.add('quest');
    elements.add('resurrection');
  }

  return toSetByOrder(elements, ELEMENTS);
}

function inferArchetypes(myth, blob, elements) {
  const archetypes = new Set();
  const type = normalize(myth.type);

  if (type === 'hero' || type === 'quest' || type === 'war' || elements.includes('quest')) archetypes.add('hero');
  if (elements.includes('flood')) {
    archetypes.add('hero');
    archetypes.add('great_mother');
    archetypes.add('self');
  }
  if (hasAny(blob, ['betray', 'revenge', 'wrath', 'monster', 'underworld', 'dark'])) archetypes.add('shadow');
  if (elements.includes('trickery') || type === 'trickster') archetypes.add('trickster');
  if (hasAny(blob, ['wisdom', 'mentor', 'sage', 'oracle', 'prophecy', 'law'])) archetypes.add('wise_old_man');
  if (hasAny(blob, ['mother', 'fertility', 'earth', 'demeter', 'gaia', 'goddess'])) archetypes.add('great_mother');
  if (hasAny(blob, ['love', 'beauty', 'devotion', 'bride'])) archetypes.add('anima');
  if (hasAny(blob, ['war', 'king', 'storm', 'thunder', 'father', 'mars'])) archetypes.add('animus');
  if (elements.includes('creation_from_chaos') || elements.includes('resurrection')) {
    archetypes.add('self');
  }
  if (elements.includes('monster_slaying') || elements.includes('underworld') || hasAny(blob, ['guardian', 'gate', 'threshold'])) {
    archetypes.add('threshold_guardian');
  }
  if (elements.includes('prophecy') || hasAny(blob, ['messenger', 'call', 'omen'])) archetypes.add('herald');
  if (elements.includes('transformation') || hasAny(blob, ['shapeshift', 'fox', 'wolf', 'mask'])) archetypes.add('shapeshifter');
  if (hasAny(blob, ['ally', 'companion', 'twin', 'loyal', 'friend'])) archetypes.add('ally');

  if (archetypes.size < 3) {
    archetypes.add('hero');
    archetypes.add('shadow');
    archetypes.add('self');
  }

  return toSetByOrder(archetypes, ARCHETYPES);
}

function inferStructure(myth, blob, elements) {
  const beats = new Set(['ordinary_world', 'call_to_adventure']);
  const type = normalize(myth.type);

  if (hasAny(blob, ['refuse', 'reluct', 'hesitat', 'banish'])) beats.add('refusal');
  if (hasAny(blob, ['mentor', 'guide', 'athena', 'sage', 'teacher', 'prophet'])) beats.add('mentor');

  if (type !== 'creation') beats.add('crossing_threshold');
  if (type === 'hero' || type === 'quest' || type === 'war' || hasAny(blob, ['trial', 'test', 'labors', 'ordeal'])) {
    beats.add('tests');
  }

  beats.add('ordeal');

  if (hasAny(blob, ['reward', 'boon', 'immortality', 'fire', 'wins'])) beats.add('reward');
  if (hasAny(blob, ['return', 'homecoming', 'back', 'restore']) || type === 'hero' || type === 'quest') {
    beats.add('road_back');
    beats.add('return');
  }

  if (elements.includes('resurrection')) beats.add('resurrection');
  if (type === 'creation') {
    beats.add('crossing_threshold');
    beats.add('reward');
    beats.add('return');
  }

  return toSetByOrder(beats, STRUCTURE);
}

function inferMoral(elements) {
  const set = new Set(elements);
  if (set.has('flood')) return 'When moral order collapses, survival depends on humility, responsibility, and renewal.';
  if (set.has('forbidden_knowledge') || set.has('fire')) {
    return 'Knowledge can elevate humanity, but it always carries ethical responsibility and cost.';
  }
  if (set.has('quest') && set.has('sacrifice')) {
    return 'Endurance and sacrifice transform the self and restore balance to the wider community.';
  }
  if (set.has('love_tragedy')) {
    return 'Love is powerful, yet trust and restraint decide whether it heals or destroys.';
  }
  if (set.has('cosmic_battle') || set.has('creation_from_chaos')) {
    return 'Order is never final; every generation must defend meaning against returning chaos.';
  }
  if (set.has('trickery')) {
    return 'Cunning can challenge power, but deceit always leaves moral consequences.';
  }
  return 'Human flourishing requires aligning personal desire with communal and cosmic responsibility.';
}

function inferEmotion(blob, elements) {
  const set = new Set(elements);
  if (set.has('love_tragedy')) return hasAny(blob, ['death', 'loss', 'grief']) ? 'grief' : 'love';
  if (set.has('revenge') || hasAny(blob, ['wrath', 'rage', 'war'])) return 'rage';
  if (set.has('underworld') || set.has('flood')) return 'fear';
  if (set.has('sacrifice') || set.has('resurrection')) return 'hope';
  if (set.has('creation_from_chaos') || set.has('prophecy')) return 'wonder';
  if (set.has('betrayal') || hasAny(blob, ['hubris', 'shame'])) return 'shame';
  return hasAny(blob, ['honor', 'glory', 'kingship']) ? 'pride' : 'wonder';
}

function inferScope(blob, elements) {
  const set = new Set(elements);
  if (set.has('creation_from_chaos') || set.has('cosmic_battle')) return 'universal';
  if (set.has('flood') || hasAny(blob, ['foundation', 'civilization', 'kingship', 'empire', 'rome'])) {
    return 'civilizational';
  }
  if (hasAny(blob, ['season', 'harvest', 'festival', 'tribe', 'community', 'law'])) return 'communal';
  return 'personal';
}

function inferOriginTheory(myth, elements) {
  const universalSignal = elements.filter((item) => UNIVERSAL_SIGNAL_ELEMENTS.has(item)).length;

  if (myth.parallels.length >= 4 || universalSignal >= 4) return 'universal';
  if (myth.parallels.length >= 1) return 'diffusion';
  if (universalSignal >= 1) return 'convergent';
  return 'unknown';
}

function buildDNA(myth) {
  const blob = normalize([
    myth.name,
    myth.type,
    myth.summary,
    myth.significance,
    ...(myth.characters || []),
    ...(myth.themes || []),
    ...(myth.tags || []),
  ].join(' '));

  const elements = inferElements(myth, blob);
  const archetypes = inferArchetypes(myth, blob, elements);
  const structure = inferStructure(myth, blob, elements);

  return {
    elements,
    archetypes,
    structure,
    moralLesson: inferMoral(elements),
    emotionalCore: inferEmotion(blob, elements),
    cosmicScope: inferScope(blob, elements),
    originTheory: inferOriginTheory(myth, elements),
  };
}

const raw = await readFile(mythsPath, 'utf8');
const myths = JSON.parse(raw);

const enriched = myths.map((myth) => ({
  ...myth,
  dna: buildDNA(myth),
}));

await writeFile(mythsPath, `${JSON.stringify(enriched, null, 2)}\n`, 'utf8');
console.log(`Updated ${enriched.length} myths with DNA.`);

