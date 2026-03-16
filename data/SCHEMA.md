# MythAtlas JSON Schema Reference

This document describes fields used by MythAtlas JSON files in `src/data`.

## Mythology
File: `src/data/mythologies.json`

### Fields
- `id` (`string`, required): unique kebab-case id.
- `name` (`string`, required): mythology system name.
- `region` (`string`, required): geographic region label.
- `culture` (`string`, required): cultural origin label.
- `era` (`string`, required): textual date range.
- `origin` (`object`, required):
  - `lat` (`number`)
  - `lng` (`number`)
- `boundingBox` (`[number, number, number, number]`, required): `[west, south, east, north]`.
- `color` (`string`, required): hex color.
- `description` (`string`, required)
- `significance` (`string`, required)
- `pantheonSize` (`number`, required)
- `primaryLanguage` (`string`, required)
- `imageUrl` (`string`, required)
- `tags` (`string[]`, required)

### Example
```json
{
  "id": "greek",
  "name": "Greek Mythology",
  "region": "Greece & Aegean",
  "culture": "Hellenic",
  "era": "2000 BCE - 400 CE",
  "origin": { "lat": 37.9, "lng": 23.7 },
  "boundingBox": [19, 34, 30, 42],
  "color": "#4A90D9",
  "description": "...",
  "significance": "...",
  "pantheonSize": 12,
  "primaryLanguage": "Ancient Greek",
  "imageUrl": "https://...",
  "tags": ["olympus", "heroism"]
}
```

## Myth
File: `src/data/myths.json`

### Fields
- `id` (`string`, required)
- `mythologyId` (`string`, required): must exist in mythologies.
- `name` (`string`, required)
- `type` (`string`, required): e.g. `creation`, `hero`, `trickster`.
- `origin` (`object`, required): `lat`, `lng`.
- `characters` (`string[]`, required)
- `summary` (`string`, required)
- `significance` (`string`, required)
- `themes` (`string[]`, required)
- `parallels` (`string[]`, required): myth ids.
- `era` (`string`, required)
- `imageUrl` (`string`, required)
- `sources` (`string[]`, required)
- `tags` (`string[]`, required)

### Example
```json
{
  "id": "prometheus-fire",
  "mythologyId": "greek",
  "name": "Prometheus Steals Fire",
  "type": "quest",
  "origin": { "lat": 38.47, "lng": 22.5 },
  "characters": ["Prometheus", "Zeus"],
  "summary": "...",
  "significance": "...",
  "themes": ["fire", "defiance"],
  "parallels": ["maui-fire"],
  "era": "800 BCE",
  "imageUrl": "https://...",
  "sources": ["Theogony"],
  "tags": ["culture-hero"]
}
```

## Deity
File: `src/data/deities.json`

### Fields
- `id` (`string`, required)
- `mythologyId` (`string`, required)
- `name` (`string`, required)
- `alternateNames` (`string[]`, required)
- `domain` (`string[]`, required)
- `type` (`string`, required)
- `origin` (`object`, required): `lat`, `lng`.
- `description` (`string`, required)
- `myths` (`string[]`, required): myth ids.
- `equivalents` (`string[]`, required): deity ids.
- `imageUrl` (`string`, required)
- `symbols` (`string[]`, required)
- `era` (`string`, required)

### Example
```json
{
  "id": "zeus",
  "mythologyId": "greek",
  "name": "Zeus",
  "alternateNames": ["Jupiter"],
  "domain": ["sky", "thunder"],
  "type": "god",
  "origin": { "lat": 40.0, "lng": 22.0 },
  "description": "...",
  "myths": ["prometheus-fire"],
  "equivalents": ["jupiter"],
  "imageUrl": "https://...",
  "symbols": ["thunderbolt", "eagle"],
  "era": "Classical"
}
```

## Sacred Site
File: `src/data/sacred-sites.json`

### Fields
- `id` (`string`, required)
- `mythologyId` (`string`, required)
- `name` (`string`, required)
- `type` (`string`, required): e.g. `temple`, `oracle`, `ruins`.
- `coordinates` (`object`, required): `lat`, `lng`.
- `description` (`string`, required)
- `significance` (`string`, optional)
- `associatedMyths` (`string[]`, optional)
- `associatedDeities` (`string[]`, optional)
- `myths` (`string[]`, optional, legacy)
- `deities` (`string[]`, optional, legacy)
- `era` (`string`, optional)
- `imageUrl` (`string`, required)
- `modernStatus` (`string`, optional)
- `country` (`string`, optional)
- `tags` (`string[]`, optional)
- `archaeology` (`object`, optional but recommended):
  - `discoveryHistory`:
    - `firstDocumented` (`string`)
    - `majorExcavations` (`array` of `{ year, led_by, institution, findings }`)
    - `currentStatus` (`"active_excavation" | "completed" | "protected" | "unexcavated" | "inaccessible"`)
    - `protectionStatus` (`"UNESCO" | "national_heritage" | "local_protection" | "unprotected" | "disputed"`)
  - `artifacts` (`array` of `{ id, name, type, period, currentLocation, description, mythologicalSignificance, imageUrl, museumUrl }`)
  - `inscriptions` (`array` of `{ id, text, translation, language, period, significance, scholar }`)
  - `architecture` (`object`):
    - `originalStructure`, `constructionPeriod`, `dimensions`, `materials[]`, `constructionTechnique`, `modifications[]`, `currentState`
  - `museumConnections` (`array` of `{ museumName, city, country, collectionUrl, artifactCount, notableArtifacts[] }`)
  - `chronology` (`array` of `{ period, event, type }`, where `type` is one of `construction | destruction | rediscovery | excavation | cultural_event | conquest`)

### Example
```json
{
  "id": "delphi",
  "mythologyId": "greek",
  "name": "Temple of Delphi",
  "type": "oracle",
  "coordinates": { "lat": 38.48, "lng": 22.5 },
  "description": "...",
  "associatedMyths": ["apollo-oracle"],
  "associatedDeities": ["apollo"],
  "era": "Classical",
  "imageUrl": "https://...",
  "modernStatus": "UNESCO site",
  "country": "Greece",
  "tags": ["pilgrimage", "prophecy"]
}
```
