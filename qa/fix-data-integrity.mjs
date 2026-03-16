#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DATA_ROOTS = [path.join(ROOT, 'src', 'data'), path.join(ROOT, 'public', 'data')];

const mythRefCorrections = new Map([
  ['hercules-labors', 'heracles-labors'],
  ['rustam-labors', 'rostam-labors'],
]);

const deityRefCorrections = new Map([
  ['charon', 'charun'],
  ['frey', 'freyr'],
  ['yama', 'yama-deity'],
  ['achilles', 'achilles-deity'],
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function dedupe(items) {
  return [...new Set(items)];
}

for (const root of DATA_ROOTS) {
  const mythsPath = path.join(root, 'myths.json');
  const deitiesPath = path.join(root, 'deities.json');
  const sitesPath = path.join(root, 'sacred-sites.json');

  const myths = readJson(mythsPath);
  const deities = readJson(deitiesPath);
  const sites = readJson(sitesPath);

  const mythIds = new Set(myths.map((item) => item.id));
  const deityIds = new Set(deities.map((item) => item.id));

  for (const myth of myths) {
    const nextParallels = [];
    for (const ref of myth.parallels || []) {
      const corrected = mythRefCorrections.get(ref) ?? ref;
      if (mythIds.has(corrected)) nextParallels.push(corrected);
    }
    myth.parallels = dedupe(nextParallels);
  }

  for (const deity of deities) {
    const nextEquivalents = [];
    for (const ref of deity.equivalents || []) {
      const corrected = deityRefCorrections.get(ref) ?? ref;
      if (deityIds.has(corrected)) nextEquivalents.push(corrected);
    }
    deity.equivalents = dedupe(nextEquivalents);

    const nextMyths = [];
    for (const ref of deity.myths || []) {
      const corrected = mythRefCorrections.get(ref) ?? ref;
      if (mythIds.has(corrected)) nextMyths.push(corrected);
    }
    deity.myths = dedupe(nextMyths);
  }

  for (const site of sites) {
    const deityField = Array.isArray(site.associatedDeities)
      ? 'associatedDeities'
      : Array.isArray(site.deities)
        ? 'deities'
        : null;
    const mythField = Array.isArray(site.associatedMyths)
      ? 'associatedMyths'
      : Array.isArray(site.myths)
        ? 'myths'
        : null;

    if (deityField) {
      const next = [];
      for (const ref of site[deityField]) {
        const corrected = deityRefCorrections.get(ref) ?? ref;
        if (deityIds.has(corrected)) next.push(corrected);
      }
      site[deityField] = dedupe(next);
    }

    if (mythField) {
      const next = [];
      for (const ref of site[mythField]) {
        const corrected = mythRefCorrections.get(ref) ?? ref;
        if (mythIds.has(corrected)) next.push(corrected);
      }
      site[mythField] = dedupe(next);
    }

    const status = String(site.modernStatus || '').toLowerCase();
    site.stillExists = !status.includes('mythical');
  }

  writeJson(mythsPath, myths);
  writeJson(deitiesPath, deities);
  writeJson(sitesPath, sites);
}

console.log('Data integrity normalization applied to src/data and public/data.');
