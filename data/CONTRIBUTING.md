# Data Contribution Guide

MythAtlas uses static JSON datasets in `src/data` and publishes mirrored files under `public/data`.

## Workflow
1. Fork/branch.
2. Edit relevant JSON in `src/data`.
3. Keep formatting consistent (2-space indentation).
4. Run build locally:
   ```bash
   npm run build
   ```
5. Open PR with a clear summary and source references.

## Adding a Myth
- File: `src/data/myths.json`
- Required checks:
  - `id` is unique, kebab-case.
  - `mythologyId` exists in `mythologies.json`.
  - `origin.lat/lng` are valid coordinates.
  - `themes`, `characters`, and `sources` are arrays.

## Adding a Deity
- File: `src/data/deities.json`
- Required checks:
  - `id` is unique.
  - `mythologyId` exists.
  - `myths` only references existing myth ids.
  - `domain` and `symbols` arrays are non-empty when possible.

## Adding a Sacred Site
- File: `src/data/sacred-sites.json`
- Required checks:
  - `id` is unique.
  - `mythologyId` exists.
  - `coordinates` are valid.
  - Use `associatedMyths` / `associatedDeities` (or legacy `myths` / `deities`) with valid ids.

## PR Checklist
- [ ] Data follows [SCHEMA.md](./SCHEMA.md)
- [ ] New ids do not collide
- [ ] Linked ids resolve correctly
- [ ] `npm run build` passes
