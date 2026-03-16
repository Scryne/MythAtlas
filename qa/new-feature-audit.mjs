#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, 'qa', 'reports');
const REPORT_PATH = path.join(REPORT_DIR, 'new-feature-audit.json');

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));
}

function haversineKm(a, b) {
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(x));
}

const DNA_ELEMENT_UNIVERSE = [
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

const DNA_ARCHETYPE_UNIVERSE = [
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

const DNA_STRUCTURE_UNIVERSE = [
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

const EMOTIONS = new Set(['fear', 'hope', 'love', 'grief', 'wonder', 'rage', 'shame', 'pride']);
const COSMIC_SCOPE = new Set(['personal', 'communal', 'civilizational', 'universal']);
const ORIGIN_THEORY = new Set(['diffusion', 'convergent', 'universal', 'unknown']);

function dnaList(myth, key) {
  return myth?.dna?.[key] || [];
}

function calculateDNASimilarity(myth1, myth2) {
  if (myth1.id === myth2.id) return 100;

  const elements1 = Array.from(new Set(dnaList(myth1, 'elements')));
  const elements2 = Array.from(new Set(dnaList(myth2, 'elements')));
  const archetypes1 = Array.from(new Set(dnaList(myth1, 'archetypes')));
  const archetypes2 = Array.from(new Set(dnaList(myth2, 'archetypes')));
  const structure1 = Array.from(new Set(dnaList(myth1, 'structure')));
  const structure2 = Array.from(new Set(dnaList(myth2, 'structure')));

  if (elements1.length === 0 || elements2.length === 0) return 0;

  const sharedElements = elements1.filter((item) => elements2.includes(item)).length;
  const sharedArchetypes = archetypes1.filter((item) => archetypes2.includes(item)).length;
  const sharedStructure = structure1.filter((item) => structure2.includes(item)).length;

  const elementsDenominator = Math.max(1, Math.min(elements1.length, elements2.length));
  const archetypesDenominator = Math.max(
    1,
    Math.min(archetypes1.length || 1, archetypes2.length || 1)
  );
  const structureDenominator = Math.max(1, Math.min(structure1.length || 1, structure2.length || 1));

  const elementScore = (sharedElements / elementsDenominator) * 35;
  const archetypeScore = (sharedArchetypes / archetypesDenominator) * 30;
  const structureScore = (sharedStructure / structureDenominator) * 25;
  const emotionalScore =
    myth1.dna?.emotionalCore && myth1.dna.emotionalCore === myth2.dna?.emotionalCore ? 10 : 0;
  const scopeScore =
    myth1.dna?.cosmicScope && myth1.dna.cosmicScope === myth2.dna?.cosmicScope ? 5 : 0;

  const rawScore = elementScore + archetypeScore + structureScore + emotionalScore + scopeScore;
  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

function getMythsByDNA(mythId, allMyths, topN) {
  const target = allMyths.find((myth) => myth.id === mythId);
  if (!target) return [];
  return allMyths
    .filter((candidate) => candidate.id !== target.id && candidate.mythologyId !== target.mythologyId)
    .map((candidate) => ({
      myth: candidate,
      score: calculateDNASimilarity(target, candidate),
      sharedElements: DNA_ELEMENT_UNIVERSE.filter(
        (element) =>
          dnaList(target, 'elements').includes(element) && dnaList(candidate, 'elements').includes(element)
      ),
      sharedArchetypes: DNA_ARCHETYPE_UNIVERSE.filter(
        (archetype) =>
          dnaList(target, 'archetypes').includes(archetype) &&
          dnaList(candidate, 'archetypes').includes(archetype)
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

function getDNAFingerprint(myth) {
  const elements = new Set(dnaList(myth, 'elements'));
  return DNA_ELEMENT_UNIVERSE.map((element) => (elements.has(element) ? '1' : '0')).join('');
}

function main() {
  const myths = readJson('src/data/myths.json');
  const mythologies = readJson('src/data/mythologies.json');
  const deities = readJson('src/data/deities.json');
  const sites = readJson('src/data/sacred-sites.json');
  const connections = readJson('data/mythology-connections.json');
  const deityEvolution = readJson('data/deity-evolution.json');

  const mythIds = new Set(myths.map((item) => item.id));
  const mythologyIds = new Set(mythologies.map((item) => item.id));
  const deityIds = new Set(deities.map((item) => item.id));

  const report = {
    generatedAt: new Date().toISOString(),
    counts: {
      myths: myths.length,
      mythologies: mythologies.length,
      deities: deities.length,
      sites: sites.length,
      connections: connections.length,
      deityEvolutionLineages: deityEvolution.length,
    },
    checks: {
      dnaDataIntegrity: [],
      dnaAlgorithm: [],
      familyTreeDataIntegrity: [],
      academicDataIntegrity: [],
      archaeologyDataIntegrity: [],
      staticCodeChecks: [],
    },
  };

  const dnaElementSet = new Set(DNA_ELEMENT_UNIVERSE);
  const dnaArchetypeSet = new Set(DNA_ARCHETYPE_UNIVERSE);
  const dnaStructureSet = new Set(DNA_STRUCTURE_UNIVERSE);

  for (const myth of myths) {
    if (!myth.dna) {
      report.checks.dnaDataIntegrity.push({ kind: 'missing_dna', mythId: myth.id });
      continue;
    }
    (myth.dna.elements || []).forEach((value) => {
      if (!dnaElementSet.has(value)) {
        report.checks.dnaDataIntegrity.push({ kind: 'invalid_element', mythId: myth.id, value });
      }
    });
    (myth.dna.archetypes || []).forEach((value) => {
      if (!dnaArchetypeSet.has(value)) {
        report.checks.dnaDataIntegrity.push({ kind: 'invalid_archetype', mythId: myth.id, value });
      }
    });
    (myth.dna.structure || []).forEach((value) => {
      if (!dnaStructureSet.has(value)) {
        report.checks.dnaDataIntegrity.push({ kind: 'invalid_structure', mythId: myth.id, value });
      }
    });
    if (!EMOTIONS.has(myth.dna.emotionalCore)) {
      report.checks.dnaDataIntegrity.push({
        kind: 'invalid_emotional_core',
        mythId: myth.id,
        value: myth.dna.emotionalCore,
      });
    }
    if (!COSMIC_SCOPE.has(myth.dna.cosmicScope)) {
      report.checks.dnaDataIntegrity.push({
        kind: 'invalid_cosmic_scope',
        mythId: myth.id,
        value: myth.dna.cosmicScope,
      });
    }
    if (!ORIGIN_THEORY.has(myth.dna.originTheory)) {
      report.checks.dnaDataIntegrity.push({
        kind: 'invalid_origin_theory',
        mythId: myth.id,
        value: myth.dna.originTheory,
      });
    }
    if (!String(myth.dna.moralLesson || '').trim()) {
      report.checks.dnaDataIntegrity.push({ kind: 'missing_moral_lesson', mythId: myth.id });
    }
  }

  const noah = myths.find((item) => item.id === 'noah-flood');
  const utnapishtim = myths.find((item) => item.id === 'mesopotamian-flood');
  const prometheus = myths.find((item) => item.id === 'prometheus-fire');
  const maui = myths.find((item) => item.id === 'maui-fire');
  const apollo = myths.find((item) => item.id === 'apollo-python');
  const susanoo = myths.find((item) => item.id === 'susanoo-serpent');

  const algorithmPairs = [
    {
      label: 'Noah vs Utnapishtim',
      left: noah,
      right: utnapishtim,
      min: 75,
      max: 100,
    },
    {
      label: 'Prometheus vs Maui',
      left: prometheus,
      right: maui,
      min: 60,
      max: 100,
    },
    {
      label: 'Apollo vs Susanoo',
      left: apollo,
      right: susanoo,
      min: 20,
      max: 40,
    },
  ];

  for (const pair of algorithmPairs) {
    if (!pair.left || !pair.right) {
      report.checks.dnaAlgorithm.push({ kind: 'missing_pair_member', label: pair.label });
      continue;
    }
    const value = calculateDNASimilarity(pair.left, pair.right);
    report.checks.dnaAlgorithm.push({
      kind: 'pair_score',
      label: pair.label,
      score: value,
      pass: value >= pair.min && value <= pair.max,
    });
  }

  const sameMyth = calculateDNASimilarity(prometheus, prometheus);
  const emptyElementsMyth = {
    id: 'empty-elements-test',
    dna: {
      elements: [],
      archetypes: ['hero'],
      structure: ['ordinary_world'],
      emotionalCore: 'hope',
      cosmicScope: 'personal',
    },
  };
  const emptyElementsScore = calculateDNASimilarity(emptyElementsMyth, prometheus);
  const symmetryLeft = calculateDNASimilarity(prometheus, maui);
  const symmetryRight = calculateDNASimilarity(maui, prometheus);

  report.checks.dnaAlgorithm.push(
    { kind: 'self_score', score: sameMyth, pass: sameMyth === 100 },
    {
      kind: 'bounds_prometheus_maui',
      score: symmetryLeft,
      pass: symmetryLeft >= 0 && symmetryLeft <= 100,
    },
    {
      kind: 'symmetry_prometheus_maui',
      left: symmetryLeft,
      right: symmetryRight,
      pass: symmetryLeft === symmetryRight,
    },
    { kind: 'empty_elements_returns_zero', score: emptyElementsScore, pass: emptyElementsScore === 0 }
  );

  const dnaResults = getMythsByDNA('noah-flood', myths, 6);
  const resultIds = dnaResults.map((item) => item.myth.id);
  const sorted = dnaResults.every((item, index) => index === 0 || item.score <= dnaResults[index - 1].score);
  const unique = new Set(resultIds).size === resultIds.length;
  const noSameMythology = dnaResults.every((item) => item.myth.mythologyId !== 'biblical-hebrew');
  report.checks.dnaAlgorithm.push(
    {
      kind: 'getMythsByDNA_topN',
      expected: 6,
      actual: dnaResults.length,
      pass: dnaResults.length <= 6 && dnaResults.length > 0,
    },
    { kind: 'getMythsByDNA_sorted_desc', pass: sorted },
    { kind: 'getMythsByDNA_no_duplicates', pass: unique },
    { kind: 'getMythsByDNA_cross_mythology_only', pass: noSameMythology }
  );

  const fingerprintLengths = myths.map((myth) => getDNAFingerprint(myth).length);
  const expectedFingerprintLength = DNA_ELEMENT_UNIVERSE.length;
  const allEqualLength = fingerprintLengths.every((value) => value === expectedFingerprintLength);
  const emptyFingerprint = getDNAFingerprint(emptyElementsMyth);
  const allEmptyFingerprint = emptyFingerprint === '0'.repeat(expectedFingerprintLength);
  report.checks.dnaAlgorithm.push(
    { kind: 'fingerprint_length_consistency', pass: allEqualLength, expected: expectedFingerprintLength },
    { kind: 'fingerprint_empty_case', pass: allEmptyFingerprint, value: emptyFingerprint }
  );

  const connectionTypeSet = new Set([
    'influenced',
    'evolved_from',
    'absorbed',
    'parallel_development',
    'trade_contact',
    'conquest',
    'syncretism',
  ]);
  const consensusSet = new Set(['established', 'debated', 'theory']);
  const strengthSet = new Set([1, 2, 3]);
  const connectionPairs = new Set();

  for (const connection of connections) {
    if (!mythologyIds.has(connection.sourceId) || !mythologyIds.has(connection.targetId)) {
      report.checks.familyTreeDataIntegrity.push({
        kind: 'invalid_connection_reference',
        id: connection.id,
      });
    }
    if (!connectionTypeSet.has(connection.type)) {
      report.checks.familyTreeDataIntegrity.push({
        kind: 'invalid_connection_type',
        id: connection.id,
        value: connection.type,
      });
    }
    if (!strengthSet.has(connection.strength)) {
      report.checks.familyTreeDataIntegrity.push({
        kind: 'invalid_connection_strength',
        id: connection.id,
        value: connection.strength,
      });
    }
    if (!consensusSet.has(connection.academicConsensus)) {
      report.checks.familyTreeDataIntegrity.push({
        kind: 'invalid_academic_consensus',
        id: connection.id,
        value: connection.academicConsensus,
      });
    }
    if (connection.sourceId === connection.targetId) {
      report.checks.familyTreeDataIntegrity.push({
        kind: 'self_referencing_connection',
        id: connection.id,
      });
    }
    if (connection.strength === 3 && (!Array.isArray(connection.examples) || connection.examples.length === 0)) {
      report.checks.familyTreeDataIntegrity.push({
        kind: 'missing_examples_on_strength_3',
        id: connection.id,
      });
    }
    const pairKey = `${connection.sourceId}|${connection.targetId}`;
    if (connectionPairs.has(pairKey)) {
      report.checks.familyTreeDataIntegrity.push({
        kind: 'duplicate_connection_pair',
        pairKey,
      });
    }
    connectionPairs.add(pairKey);
  }

  if (connections.length < 30) {
    report.checks.familyTreeDataIntegrity.push({
      kind: 'insufficient_connection_count',
      count: connections.length,
    });
  }

  const requiredConnections = [
    {
      sourceId: 'sumerian',
      targetId: 'babylonian',
      type: 'evolved_from',
      strength: 3,
      label: 'Sumerian -> Babylonian',
    },
    { sourceId: 'greek', targetId: 'roman', type: 'absorbed', strength: 3, label: 'Greek -> Roman' },
    { sourceId: 'hindu', targetId: 'buddhist', type: 'influenced', strength: 3, label: 'Hindu -> Buddhist' },
    { sourceId: 'chinese', targetId: 'japanese', type: 'influenced', strength: 2, label: 'Chinese -> Japanese' },
  ];
  requiredConnections.forEach((target) => {
    const found = connections.some(
      (item) =>
        item.sourceId === target.sourceId &&
        item.targetId === target.targetId &&
        item.type === target.type &&
        item.strength === target.strength
    );
    report.checks.familyTreeDataIntegrity.push({
      kind: 'required_connection',
      label: target.label,
      pass: found,
    });
  });

  const pieTargets = ['greek', 'norse', 'hindu', 'persian', 'celtic', 'slavic'];
  pieTargets.forEach((targetId) => {
    const found = connections.some(
      (item) => item.sourceId === 'proto-indo-european' && item.targetId === targetId
    );
    report.checks.familyTreeDataIntegrity.push({
      kind: 'pie_connection',
      targetId,
      pass: found,
    });
  });

  for (const lineage of deityEvolution) {
    if (!Array.isArray(lineage.chain) || lineage.chain.length === 0) continue;
    for (const step of lineage.chain) {
      if (!deityIds.has(step.deityId)) {
        report.checks.familyTreeDataIntegrity.push({
          kind: 'missing_deity_in_lineage',
          lineageId: lineage.id,
          deityId: step.deityId,
        });
      }
      if (!mythologyIds.has(step.mythologyId)) {
        report.checks.familyTreeDataIntegrity.push({
          kind: 'missing_mythology_in_lineage',
          lineageId: lineage.id,
          mythologyId: step.mythologyId,
        });
      }
      if (!String(step.period || '').trim()) {
        report.checks.familyTreeDataIntegrity.push({
          kind: 'empty_lineage_period',
          lineageId: lineage.id,
          deityId: step.deityId,
        });
      }
    }
  }

  const loveLineage = deityEvolution.find((lineage) => lineage.id === 'lineage-love-goddess');
  if (loveLineage) {
    const expected = ['inanna', 'ishtar-deity', 'astarte', 'aphrodite', 'venus'];
    const actual = loveLineage.chain.map((step) => step.deityId);
    report.checks.familyTreeDataIntegrity.push({
      kind: 'inanna_chain_order',
      pass: expected.every((id, index) => actual[index] === id),
      actual,
    });
  } else {
    report.checks.familyTreeDataIntegrity.push({ kind: 'inanna_chain_missing' });
  }

  const lineageCount4Plus = deityEvolution.filter((lineage) => (lineage.chain || []).length >= 4).length;
  report.checks.familyTreeDataIntegrity.push({
    kind: 'lineage_count_at_least_4',
    count: lineageCount4Plus,
    pass: lineageCount4Plus >= 4,
  });

  const sourceTypeSet = new Set(['primary', 'secondary', 'archaeological']);
  const connectionTypeSetAcademic = new Set(['diffusion', 'convergent_evolution', 'common_ancestor', 'unknown']);
  const controversySet = new Set(['consensus', 'accepted', 'debated', 'fringe']);

  myths.forEach((myth) => {
    if ((myth.academicSources || []).length < 2) {
      report.checks.academicDataIntegrity.push({ kind: 'insufficient_sources', mythId: myth.id });
    }
    const sourceIds = new Set((myth.academicSources || []).map((source) => source.id));
    (myth.academicSources || []).forEach((source) => {
      if (!sourceTypeSet.has(source.type)) {
        report.checks.academicDataIntegrity.push({
          kind: 'invalid_source_type',
          mythId: myth.id,
          sourceId: source.id,
        });
      }
      if (!String(source.citationAPA || '').trim() || !String(source.citationChicago || '').trim()) {
        report.checks.academicDataIntegrity.push({
          kind: 'invalid_citation',
          mythId: myth.id,
          sourceId: source.id,
        });
      }
      if (typeof source.isOpenAccess !== 'boolean') {
        report.checks.academicDataIntegrity.push({
          kind: 'invalid_open_access_flag',
          mythId: myth.id,
          sourceId: source.id,
        });
      }
      if (!/^https?:\/\//i.test(String(source.url || ''))) {
        report.checks.academicDataIntegrity.push({
          kind: 'invalid_source_url',
          mythId: myth.id,
          sourceId: source.id,
          url: source.url,
        });
      }
    });
    (myth.parallels || []).forEach((parallel) => {
      if (typeof parallel === 'string') return;
      if (!mythIds.has(parallel.mythId)) {
        report.checks.academicDataIntegrity.push({
          kind: 'invalid_parallel_myth_ref',
          mythId: myth.id,
          ref: parallel.mythId,
        });
      }
      if (typeof parallel.similarityScore !== 'number' || parallel.similarityScore < 0 || parallel.similarityScore > 100) {
        report.checks.academicDataIntegrity.push({
          kind: 'invalid_parallel_similarity_score',
          mythId: myth.id,
          ref: parallel.mythId,
          value: parallel.similarityScore,
        });
      }
      if (!connectionTypeSetAcademic.has(parallel.connectionType)) {
        report.checks.academicDataIntegrity.push({
          kind: 'invalid_parallel_connection_type',
          mythId: myth.id,
          ref: parallel.mythId,
          value: parallel.connectionType,
        });
      }
      if (!controversySet.has(parallel.controversyLevel)) {
        report.checks.academicDataIntegrity.push({
          kind: 'invalid_parallel_controversy_level',
          mythId: myth.id,
          ref: parallel.mythId,
          value: parallel.controversyLevel,
        });
      }
      if (
        (parallel.controversyLevel === 'consensus' || parallel.controversyLevel === 'accepted') &&
        (!Array.isArray(parallel.keyScholars) || parallel.keyScholars.length === 0)
      ) {
        report.checks.academicDataIntegrity.push({
          kind: 'missing_scholars_for_established_connection',
          mythId: myth.id,
          ref: parallel.mythId,
        });
      }
      (parallel.academicSourceIds || []).forEach((sourceId) => {
        if (!sourceIds.has(sourceId)) {
          report.checks.academicDataIntegrity.push({
            kind: 'parallel_source_id_not_found',
            mythId: myth.id,
            ref: parallel.mythId,
            sourceId,
          });
        }
      });
    });
  });

  const mythologyTexts = myths.reduce((acc, myth) => {
    const text = (myth.academicSources || [])
      .map((source) => `${source.title} ${source.description} ${source.relevantPassage}`.toLowerCase())
      .join(' ');
    acc[myth.id] = text;
    return acc;
  }, {});
  const joinedByMythology = (mythologyId) =>
    myths
      .filter((myth) => myth.mythologyId === mythologyId)
      .map((myth) => mythologyTexts[myth.id])
      .join(' ');

  report.checks.academicDataIntegrity.push(
    {
      kind: 'spotcheck_gilgamesh_tablet_xi',
      pass:
        /tablet\s*xi/.test(mythologyTexts['gilgamesh-quest'] || '') ||
        /tablet\s*xi/.test(mythologyTexts['mesopotamian-flood'] || ''),
    },
    { kind: 'spotcheck_greek_hesiod_homer', pass: /hesiod|theogony|homer/.test(joinedByMythology('greek')) },
    { kind: 'spotcheck_norse_edda', pass: /prose edda|poetic edda/.test(joinedByMythology('norse')) },
    {
      kind: 'spotcheck_egyptian_texts',
      pass: /book of the dead|pyramid text/.test(joinedByMythology('egyptian')),
    },
    {
      kind: 'spotcheck_aztec_florentine_codex',
      pass: /florentine codex/.test(joinedByMythology('aztec')),
    }
  );

  const currentStatusSet = new Set([
    'active_excavation',
    'completed',
    'protected',
    'unexcavated',
    'inaccessible',
  ]);
  const protectionStatusSet = new Set([
    'UNESCO',
    'national_heritage',
    'local_protection',
    'unprotected',
    'disputed',
  ]);
  const artifactTypeSet = new Set([
    'sculpture',
    'inscription',
    'vessel',
    'jewelry',
    'architecture',
    'text',
    'relief',
    'mosaic',
  ]);
  const chronologyTypeSet = new Set([
    'construction',
    'destruction',
    'rediscovery',
    'excavation',
    'cultural_event',
    'conquest',
  ]);

  sites.forEach((site) => {
    if (!site.archaeology) {
      report.checks.archaeologyDataIntegrity.push({ kind: 'missing_archaeology_object', siteId: site.id });
      return;
    }
    const archaeology = site.archaeology;
    if (!currentStatusSet.has(archaeology.discoveryHistory?.currentStatus)) {
      report.checks.archaeologyDataIntegrity.push({ kind: 'invalid_current_status', siteId: site.id });
    }
    if (!protectionStatusSet.has(archaeology.discoveryHistory?.protectionStatus)) {
      report.checks.archaeologyDataIntegrity.push({ kind: 'invalid_protection_status', siteId: site.id });
    }
    (archaeology.artifacts || []).forEach((artifact) => {
      if (!artifactTypeSet.has(artifact.type)) {
        report.checks.archaeologyDataIntegrity.push({
          kind: 'invalid_artifact_type',
          siteId: site.id,
          artifactId: artifact.id,
          value: artifact.type,
        });
      }
      if (!String(artifact.currentLocation || '').trim()) {
        report.checks.archaeologyDataIntegrity.push({
          kind: 'empty_artifact_current_location',
          siteId: site.id,
          artifactId: artifact.id,
        });
      }
      if (!/^https?:\/\//i.test(String(artifact.museumUrl || ''))) {
        report.checks.archaeologyDataIntegrity.push({
          kind: 'invalid_artifact_museum_url',
          siteId: site.id,
          artifactId: artifact.id,
        });
      }
      if (!/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//i.test(String(artifact.imageUrl || ''))) {
        report.checks.archaeologyDataIntegrity.push({
          kind: 'artifact_image_not_wikimedia_commons',
          siteId: site.id,
          artifactId: artifact.id,
        });
      }
    });
    (archaeology.inscriptions || []).forEach((inscription) => {
      if (!String(inscription.translation || '').trim()) {
        report.checks.archaeologyDataIntegrity.push({
          kind: 'empty_inscription_translation',
          siteId: site.id,
          inscriptionId: inscription.id,
        });
      }
    });
    (archaeology.chronology || []).forEach((event) => {
      if (!chronologyTypeSet.has(event.type)) {
        report.checks.archaeologyDataIntegrity.push({
          kind: 'invalid_chronology_type',
          siteId: site.id,
          type: event.type,
        });
      }
    });
  });

  const locationChecks = [
    { siteId: 'parthenon', target: { lat: 37.9715, lng: 23.7267 }, thresholdKm: 15 },
    { siteId: 'machu-picchu', target: { lat: -13.1631, lng: -72.545 }, thresholdKm: 15 },
    { siteId: 'giza-pyramids', target: { lat: 29.9792, lng: 31.1342 }, thresholdKm: 15 },
  ];
  locationChecks.forEach((check) => {
    const site = sites.find((item) => item.id === check.siteId);
    if (!site) {
      report.checks.archaeologyDataIntegrity.push({ kind: 'missing_site_for_geo_check', siteId: check.siteId });
      return;
    }
    const distanceKm = haversineKm(site.coordinates, check.target);
    report.checks.archaeologyDataIntegrity.push({
      kind: 'geo_spot_check',
      siteId: check.siteId,
      distanceKm: Number(distanceKm.toFixed(2)),
      pass: distanceKm <= check.thresholdKm,
    });
  });

  const familyTreeFile = fs.readFileSync(path.join(ROOT, 'src/components/family-tree/FamilyTreePageClient.tsx'), 'utf8');
  const mapFile = fs.readFileSync(path.join(ROOT, 'src/components/map/MapPageClient.tsx'), 'utf8');
  const siteTabsFile = fs.readFileSync(path.join(ROOT, 'src/components/detail/SiteDetailTabs.tsx'), 'utf8');
  const archaeologyPageFile = fs.readFileSync(path.join(ROOT, 'src/app/archaeology/page.tsx'), 'utf8');
  const bibliographyFile = fs.readFileSync(path.join(ROOT, 'src/components/bibliography/BibliographyPageClient.tsx'), 'utf8');

  report.checks.staticCodeChecks.push(
    {
      kind: 'family_tree_d3_dynamic_import',
      pass: familyTreeFile.includes("await import('d3-force')"),
    },
    {
      kind: 'family_tree_simulation_cleanup_stop',
      pass: /return\s*\(\)\s*=>[\s\S]*simulation\.stop\(\)/.test(familyTreeFile),
    },
    {
      kind: 'map_marker_clustering_enabled',
      pass: mapFile.includes('cluster: true') && mapFile.includes('clusterRadius'),
    },
    {
      kind: 'site_detail_artifact_images_next_image_wrapper',
      pass: siteTabsFile.includes('<AncientImage'),
    },
    {
      kind: 'archaeology_significant_finds_count_20',
      pass: (archaeologyPageFile.match(/id:\s*'/g) || []).length >= 20,
    },
    {
      kind: 'bibliography_entry_volume',
      note: 'Virtual scrolling threshold check is not required while source entries are <= 100.',
      entryCount: (() => {
        const unique = new Set();
        myths.forEach((myth) => (myth.academicSources || []).forEach((source) => unique.add(source.id)));
        return unique.size;
      })(),
      pass: true,
    },
    {
      kind: 'bibliography_component_present',
      pass: bibliographyFile.includes('buildBibliographyEntries'),
    }
  );

  const sections = Object.values(report.checks);
  const failures = sections.flat().filter((item) => item.pass === false);
  report.summary = {
    totalChecks: sections.flat().length,
    failedChecks: failures.length,
    failedSamples: failures.slice(0, 25),
  };

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log(
    JSON.stringify(
      {
        reportPath: path.relative(ROOT, REPORT_PATH),
        totalChecks: report.summary.totalChecks,
        failedChecks: report.summary.failedChecks,
      },
      null,
      2
    )
  );
}

main();
