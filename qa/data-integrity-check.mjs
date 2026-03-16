#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_DATA = path.join(ROOT, 'src', 'data');
const REPORT_DIR = path.join(ROOT, 'qa', 'reports');
const REPORT_PATH = path.join(REPORT_DIR, 'data-integrity-report.json');

const REQUIRED_MYTHOLOGY_FIELDS = [
  'id',
  'name',
  'region',
  'color',
  'origin',
  'boundingBox',
  'era',
  'description',
];

const REQUIRED_MYTH_FIELDS = [
  'id',
  'mythologyId',
  'name',
  'type',
  'origin',
  'summary',
  'themes',
  'parallels',
  'sources',
];

const REQUIRED_DEITY_FIELDS = [
  'id',
  'mythologyId',
  'name',
  'domain',
  'type',
  'origin',
  'myths',
  'equivalents',
];

const REQUIRED_SITE_FIELDS = [
  'id',
  'mythologyId',
  'name',
  'type',
  'coordinates',
  'description',
  'imageUrl',
];

const MYTH_TYPE_ENUM = new Set([
  'creation',
  'hero',
  'trickster',
  'love',
  'war',
  'afterlife',
  'nature',
  'cosmology',
  'transformation',
  'quest',
]);

const DEITY_TYPE_ENUM = new Set([
  'god',
  'goddess',
  'demigod',
  'titan',
  'spirit',
  'trickster',
  'monster',
]);

const SITE_TYPE_ENUM = new Set([
  'temple',
  'oracle',
  'burial',
  'battlefield',
  'birthplace',
  'natural',
  'ruins',
  'city',
  'mountain',
]);

const WIKIMEDIA_RE = /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//i;
const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const MYTH_ORIGIN_DISTANCE_OUTLIER_KM = 4500;
const SITE_ORIGIN_DISTANCE_OUTLIER_KM = 6000;

const ANCIENT_SOURCE_HINTS = [
  'theogony',
  'iliad',
  'odyssey',
  'aeneid',
  'metamorphoses',
  'poetic edda',
  'prose edda',
  'popol vuh',
  'epic of gilgamesh',
  'book of the dead',
  'mahabharata',
  'ramayana',
  'shahnameh',
  'kalevala',
  'kojiki',
  'nihon shoki',
  'enuma elish',
  'homeric hymn',
  'hymn',
  'veda',
  'upanishad',
  'quran',
  'bible',
  'avesta',
  'talmud',
  'sutra',
];

const SOURCE_SUSPICIOUS_HINTS = ['wikipedia', 'http://', 'https://', 'blog', 'youtube', 'podcast', 'modern retelling'];

const ORIGIN_ANCHORS = {
  greek: { lat: 37.98, lng: 23.72, label: 'Athens, Greece', maxKm: 700 },
  norse: { lat: 59.91, lng: 10.75, label: 'Oslo region, Scandinavia', maxKm: 1400 },
  aztec: { lat: 19.43, lng: -99.13, label: 'Mexico Valley', maxKm: 500 },
  japanese: { lat: 35.68, lng: 139.69, label: 'Japan core region', maxKm: 1000 },
  turkic: { lat: 47.92, lng: 106.92, label: 'Mongolian steppe (Tengrist core)', maxKm: 1700 },
};

const SITE_ANCHORS = {
  parthenon: { lat: 37.9715, lng: 23.7267, maxKm: 10, label: 'Parthenon, Athens' },
  delphi: { lat: 38.4824, lng: 22.501, maxKm: 10, label: 'Delphi sanctuary' },
  'giza-pyramids': { lat: 29.9792, lng: 31.1342, maxKm: 10, label: 'Giza Pyramid Complex' },
  'machu-picchu': { lat: -13.1631, lng: -72.545, maxKm: 10, label: 'Machu Picchu' },
  stonehenge: { lat: 51.1789, lng: -1.8262, maxKm: 10, label: 'Stonehenge' },
};

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(SRC_DATA, `${name}.json`), 'utf8'));
}

function pushIssue(target, code, message, extra = {}) {
  target.push({ code, message, ...extra });
}

function hasRequiredFields(obj, requiredFields) {
  return requiredFields.filter((field) => obj[field] === undefined || obj[field] === null);
}

function isCoordinate(value) {
  return (
    value &&
    typeof value === 'object' &&
    Number.isFinite(value.lat) &&
    Number.isFinite(value.lng) &&
    value.lat >= -90 &&
    value.lat <= 90 &&
    value.lng >= -180 &&
    value.lng <= 180
  );
}

function isBoundingBox(value) {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((item) => Number.isFinite(item)) &&
    value[0] < value[2] &&
    value[1] < value[3]
  );
}

function inBoundingBox(coord, box) {
  if (!isCoordinate(coord) || !isBoundingBox(box)) return false;
  return coord.lng >= box[0] && coord.lng <= box[2] && coord.lat >= box[1] && coord.lat <= box[3];
}

function haversineKm(a, b) {
  const r = 6371;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(x));
}

function resolveParallelReferenceId(ref) {
  if (typeof ref === 'string') return ref;
  if (ref && typeof ref === 'object' && typeof ref.mythId === 'string') return ref.mythId;
  return null;
}

function getDuplicateIds(items, entity) {
  const seen = new Set();
  const dupes = [];
  for (const item of items) {
    if (seen.has(item.id)) dupes.push(item.id);
    seen.add(item.id);
  }
  return dupes.map((id) => ({ entity, id }));
}

const mythologies = readJson('mythologies');
const myths = readJson('myths');
const deities = readJson('deities');
const sacredSites = readJson('sacred-sites');

const mythologyIds = new Set(mythologies.map((item) => item.id));
const mythIds = new Set(myths.map((item) => item.id));
const deityIds = new Set(deities.map((item) => item.id));

const mythologyById = new Map(mythologies.map((item) => [item.id, item]));

const report = {
  generatedAt: new Date().toISOString(),
  counts: {
    mythologies: mythologies.length,
    myths: myths.length,
    deities: deities.length,
    sacredSites: sacredSites.length,
  },
  duplicateIds: [
    ...getDuplicateIds(mythologies, 'mythology'),
    ...getDuplicateIds(myths, 'myth'),
    ...getDuplicateIds(deities, 'deity'),
    ...getDuplicateIds(sacredSites, 'site'),
  ],
  issues: {
    mythologies: [],
    myths: [],
    deities: [],
    sacredSites: [],
    crossReferences: [],
    contentQuality: [],
  },
};

for (const mythology of mythologies) {
  const missing = hasRequiredFields(mythology, REQUIRED_MYTHOLOGY_FIELDS);
  if (missing.length) {
    pushIssue(report.issues.mythologies, 'missing_required_fields', `Missing required fields: ${missing.join(', ')}`, {
      id: mythology.id,
      missing,
    });
  }

  if (!HEX_RE.test(String(mythology.color || ''))) {
    pushIssue(report.issues.mythologies, 'invalid_color_hex', 'Color is not a valid hex code.', {
      id: mythology.id,
      value: mythology.color,
    });
  }

  if (!isCoordinate(mythology.origin)) {
    pushIssue(report.issues.mythologies, 'invalid_origin', 'Origin coordinate is invalid.', {
      id: mythology.id,
      value: mythology.origin,
    });
  }

  if (!isBoundingBox(mythology.boundingBox)) {
    pushIssue(report.issues.mythologies, 'invalid_bounding_box', 'Bounding box is invalid format [sw_lng, sw_lat, ne_lng, ne_lat].', {
      id: mythology.id,
      value: mythology.boundingBox,
    });
  } else if (isCoordinate(mythology.origin) && !inBoundingBox(mythology.origin, mythology.boundingBox)) {
    pushIssue(report.issues.mythologies, 'origin_outside_bounding_box', 'Origin is outside the declared mythology bounding box.', {
      id: mythology.id,
      origin: mythology.origin,
      boundingBox: mythology.boundingBox,
    });
  }

  if (!WIKIMEDIA_RE.test(String(mythology.imageUrl || ''))) {
    pushIssue(report.issues.mythologies, 'invalid_image_url', 'Image URL is not a Wikimedia Commons upload URL.', {
      id: mythology.id,
      imageUrl: mythology.imageUrl,
    });
  }

  if (ORIGIN_ANCHORS[mythology.id] && isCoordinate(mythology.origin)) {
    const anchor = ORIGIN_ANCHORS[mythology.id];
    const km = haversineKm(mythology.origin, anchor);
    if (km > anchor.maxKm) {
      pushIssue(
        report.issues.contentQuality,
        'mythology_origin_anchor_distance',
        `Mythology origin is far from expected anchor (${anchor.label}).`,
        { id: mythology.id, distanceKm: Number(km.toFixed(1)), anchor: anchor.label }
      );
    }
  }
}

for (const myth of myths) {
  const missing = hasRequiredFields(myth, REQUIRED_MYTH_FIELDS);
  if (missing.length) {
    pushIssue(report.issues.myths, 'missing_required_fields', `Missing required fields: ${missing.join(', ')}`, {
      id: myth.id,
      missing,
    });
  }

  if (!mythologyIds.has(myth.mythologyId)) {
    pushIssue(report.issues.crossReferences, 'invalid_mythology_reference', 'Myth points to missing mythologyId.', {
      kind: 'myth.mythologyId',
      id: myth.id,
      ref: myth.mythologyId,
    });
  }

  if (!MYTH_TYPE_ENUM.has(myth.type)) {
    pushIssue(report.issues.myths, 'invalid_myth_type', 'Myth type is not in enum.', {
      id: myth.id,
      value: myth.type,
    });
  }

  if (!Array.isArray(myth.themes) || myth.themes.length === 0) {
    pushIssue(report.issues.myths, 'empty_themes', 'Myth themes must be a non-empty array.', {
      id: myth.id,
      value: myth.themes,
    });
  }

  if (!Array.isArray(myth.sources) || myth.sources.length === 0) {
    pushIssue(report.issues.myths, 'empty_sources', 'Myth sources must be a non-empty array.', {
      id: myth.id,
    });
  } else {
    const joined = myth.sources.join(' ').toLowerCase();
    const hasSuspicious = SOURCE_SUSPICIOUS_HINTS.some((hint) => joined.includes(hint));
    if (hasSuspicious) {
      pushIssue(report.issues.contentQuality, 'suspicious_myth_sources', 'Myth sources may not reference canonical ancient texts.', {
        id: myth.id,
        sources: myth.sources,
        hasSuspicious,
      });
    }
  }

  if (!isCoordinate(myth.origin)) {
    pushIssue(report.issues.myths, 'invalid_origin', 'Myth origin coordinate is invalid.', {
      id: myth.id,
      value: myth.origin,
    });
  } else if (mythologyIds.has(myth.mythologyId)) {
    const mythology = mythologyById.get(myth.mythologyId);
    if (mythology) {
      const inBox = isBoundingBox(mythology.boundingBox) && inBoundingBox(myth.origin, mythology.boundingBox);
      const distance = haversineKm(mythology.origin, myth.origin);
      if (!inBox && distance > MYTH_ORIGIN_DISTANCE_OUTLIER_KM) {
        pushIssue(report.issues.contentQuality, 'myth_origin_geography_outlier', 'Myth origin is geographically far from mythology origin and outside mythology bounding box.', {
          id: myth.id,
          mythologyId: myth.mythologyId,
          distanceKm: Number(distance.toFixed(1)),
        });
      }
    }
  }

  if (!WIKIMEDIA_RE.test(String(myth.imageUrl || ''))) {
    pushIssue(report.issues.myths, 'invalid_image_url', 'Image URL is not a Wikimedia Commons upload URL.', {
      id: myth.id,
      imageUrl: myth.imageUrl,
    });
  }

  if (!Array.isArray(myth.parallels)) {
    pushIssue(report.issues.myths, 'invalid_parallels', 'Myth parallels must be an array.', {
      id: myth.id,
    });
  } else {
    for (const ref of myth.parallels) {
      const refId = resolveParallelReferenceId(ref);
      if (!refId) {
        pushIssue(report.issues.myths, 'invalid_parallel_reference_shape', 'Parallel myth reference must be a string id or object with mythId.', {
          id: myth.id,
          ref,
        });
        continue;
      }
      if (!mythIds.has(refId)) {
        pushIssue(report.issues.crossReferences, 'broken_parallel_reference', 'Parallel myth reference does not exist.', {
          kind: 'myth.parallels',
          id: myth.id,
          ref: refId,
        });
      }
    }
  }
}

for (const deity of deities) {
  const missing = hasRequiredFields(deity, REQUIRED_DEITY_FIELDS);
  if (missing.length) {
    pushIssue(report.issues.deities, 'missing_required_fields', `Missing required fields: ${missing.join(', ')}`, {
      id: deity.id,
      missing,
    });
  }

  if (!mythologyIds.has(deity.mythologyId)) {
    pushIssue(report.issues.crossReferences, 'invalid_mythology_reference', 'Deity points to missing mythologyId.', {
      kind: 'deity.mythologyId',
      id: deity.id,
      ref: deity.mythologyId,
    });
  }

  if (!DEITY_TYPE_ENUM.has(deity.type)) {
    pushIssue(report.issues.deities, 'invalid_deity_type', 'Deity type is not in enum.', {
      id: deity.id,
      value: deity.type,
    });
  }

  if (!Array.isArray(deity.domain) || deity.domain.length === 0) {
    pushIssue(report.issues.deities, 'empty_domain', 'Deity domain must be non-empty.', {
      id: deity.id,
      value: deity.domain,
    });
  }

  if (!isCoordinate(deity.origin)) {
    pushIssue(report.issues.deities, 'invalid_origin', 'Deity origin coordinate is invalid.', {
      id: deity.id,
      value: deity.origin,
    });
  }

  if (!WIKIMEDIA_RE.test(String(deity.imageUrl || ''))) {
    pushIssue(report.issues.deities, 'invalid_image_url', 'Image URL is not a Wikimedia Commons upload URL.', {
      id: deity.id,
      imageUrl: deity.imageUrl,
    });
  }

  if (Array.isArray(deity.equivalents)) {
    for (const ref of deity.equivalents) {
      if (!deityIds.has(ref)) {
        pushIssue(report.issues.crossReferences, 'broken_deity_equivalent_reference', 'Deity equivalent reference does not exist.', {
          kind: 'deity.equivalents',
          id: deity.id,
          ref,
        });
      }
    }
  } else {
    pushIssue(report.issues.deities, 'invalid_equivalents_array', 'Deity equivalents must be an array.', {
      id: deity.id,
      value: deity.equivalents,
    });
  }

  if (Array.isArray(deity.myths)) {
    for (const ref of deity.myths) {
      if (!mythIds.has(ref)) {
        pushIssue(report.issues.crossReferences, 'broken_deity_myth_reference', 'Deity myth reference does not exist.', {
          kind: 'deity.myths',
          id: deity.id,
          ref,
        });
      }
    }
  } else {
    pushIssue(report.issues.deities, 'invalid_myths_array', 'Deity myths must be an array.', {
      id: deity.id,
      value: deity.myths,
    });
  }
}

for (const site of sacredSites) {
  const missing = hasRequiredFields(site, REQUIRED_SITE_FIELDS);
  if (missing.length) {
    pushIssue(report.issues.sacredSites, 'missing_required_fields', `Missing required fields: ${missing.join(', ')}`, {
      id: site.id,
      missing,
    });
  }

  if (!mythologyIds.has(site.mythologyId)) {
    pushIssue(report.issues.crossReferences, 'invalid_mythology_reference', 'Site points to missing mythologyId.', {
      kind: 'site.mythologyId',
      id: site.id,
      ref: site.mythologyId,
    });
  }

  if (!SITE_TYPE_ENUM.has(site.type)) {
    pushIssue(report.issues.sacredSites, 'invalid_site_type', 'Sacred site type is not in enum.', {
      id: site.id,
      value: site.type,
    });
  }

  if (!isCoordinate(site.coordinates)) {
    pushIssue(report.issues.sacredSites, 'invalid_coordinates', 'Site coordinates are invalid.', {
      id: site.id,
      value: site.coordinates,
    });
  }

  if (!WIKIMEDIA_RE.test(String(site.imageUrl || ''))) {
    pushIssue(report.issues.sacredSites, 'invalid_image_url', 'Image URL is not a Wikimedia Commons upload URL.', {
      id: site.id,
      imageUrl: site.imageUrl,
    });
  }

  if (typeof site.stillExists !== 'boolean') {
    pushIssue(report.issues.sacredSites, 'missing_still_exists_boolean', 'stillExists field is missing or not boolean.', {
      id: site.id,
      value: site.stillExists,
    });
  }

  const mythsRef = Array.isArray(site.associatedMyths)
    ? site.associatedMyths
    : Array.isArray(site.myths)
      ? site.myths
      : null;
  const deitiesRef = Array.isArray(site.associatedDeities)
    ? site.associatedDeities
    : Array.isArray(site.deities)
      ? site.deities
      : null;

  if (!Array.isArray(mythsRef)) {
    pushIssue(report.issues.sacredSites, 'invalid_site_myths_array', 'Site myths reference array is missing.', {
      id: site.id,
    });
  } else {
    for (const ref of mythsRef) {
      if (!mythIds.has(ref)) {
        pushIssue(report.issues.crossReferences, 'broken_site_myth_reference', 'Site myth reference does not exist.', {
          kind: 'site.myths',
          id: site.id,
          ref,
        });
      }
    }
  }

  if (!Array.isArray(deitiesRef)) {
    pushIssue(report.issues.sacredSites, 'invalid_site_deities_array', 'Site deities reference array is missing.', {
      id: site.id,
    });
  } else {
    for (const ref of deitiesRef) {
      if (!deityIds.has(ref)) {
        pushIssue(report.issues.crossReferences, 'broken_site_deity_reference', 'Site deity reference does not exist.', {
          kind: 'site.deities',
          id: site.id,
          ref,
        });
      }
    }
  }

  if (isCoordinate(site.coordinates)) {
    const mythology = mythologyById.get(site.mythologyId);
    if (mythology) {
      const distance = haversineKm(mythology.origin, site.coordinates);
      const inBox = isBoundingBox(mythology.boundingBox) && inBoundingBox(site.coordinates, mythology.boundingBox);
      if (!inBox && distance > SITE_ORIGIN_DISTANCE_OUTLIER_KM) {
        pushIssue(report.issues.contentQuality, 'site_origin_geography_outlier', 'Site is geographically far from mythology origin and outside mythology bounding box.', {
          id: site.id,
          mythologyId: site.mythologyId,
          distanceKm: Number(distance.toFixed(1)),
        });
      }
    }
  }

  if (SITE_ANCHORS[site.id] && isCoordinate(site.coordinates)) {
    const anchor = SITE_ANCHORS[site.id];
    const km = haversineKm(site.coordinates, anchor);
    if (km > anchor.maxKm) {
      pushIssue(report.issues.contentQuality, 'site_anchor_distance', 'Site coordinate is far from known location.', {
        id: site.id,
        distanceKm: Number(km.toFixed(1)),
        anchor: anchor.label,
      });
    }
  }
}

const totals = {
  mythologies: report.issues.mythologies.length,
  myths: report.issues.myths.length,
  deities: report.issues.deities.length,
  sacredSites: report.issues.sacredSites.length,
  crossReferences: report.issues.crossReferences.length,
  contentQuality: report.issues.contentQuality.length,
  duplicates: report.duplicateIds.length,
};

report.summary = {
  ...totals,
  totalIssues:
    totals.mythologies +
    totals.myths +
    totals.deities +
    totals.sacredSites +
    totals.crossReferences +
    totals.contentQuality +
    totals.duplicates,
};

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

const brief = {
  counts: report.counts,
  summary: report.summary,
  reportPath: path.relative(ROOT, REPORT_PATH),
};

console.log(JSON.stringify(brief, null, 2));

if (report.summary.totalIssues > 0) {
  process.exitCode = 1;
}
