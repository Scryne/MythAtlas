# MythAtlas

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![React](https://img.shields.io/badge/React-18-149eca?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![MapLibre](https://img.shields.io/badge/MapLibre-GL-2f9e44)
![License](https://img.shields.io/badge/License-MIT-gold)

MythAtlas is a public mythology atlas that maps myths, deities, and sacred sites across civilizations.

## Highlights
- Interactive world map for mythologies, myths, deities, and sacred sites.
- Rich detail pages with cross-links between entities.
- Open data model powered by static JSON for easy contribution.
- CI pipeline with data integrity checks and production build validation.

## Vision
- Build a visually rich atlas for comparative mythology.
- Keep data open and contribution-friendly through static JSON files.
- Provide fast, accessible exploration on map, detail, and analytics surfaces.

## Screenshots
![Home](./public/screenshots/home.svg)
![Map](./public/screenshots/map.svg)

## Tech Stack
- Next.js App Router (TypeScript)
- Tailwind CSS + Framer Motion
- MapLibre GL (map)
- Recharts + D3 force (visual analytics)
- Static JSON dataset (`src/data`) and read-only public data endpoints (`public/data`)

## Local Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   npm run start
   ```

## Quality Checks
- Run linting:
  ```bash
  npm run lint
  ```
- Run data integrity audit:
  ```bash
  npm run qa:data-integrity
  ```
- Run release gate (lint + audits + build):
  ```bash
  npm run qa:release
  ```

## Project Structure
- `src/app`: App Router pages and route handlers.
- `src/components`: Reusable UI and map components.
- `src/data`: Canonical source datasets.
- `public/data`: Client-facing mirrored datasets and geojson assets.
- `data/`: Documentation for schemas and contribution workflow.
- `qa/`: Audit scripts and QA automation.

## Data Contribution Guide
- Add or edit JSON records in `src/data`.
- Keep ids stable and kebab-case.
- Validate against documented schema before opening a PR.
- See full contributor workflow in [data/CONTRIBUTING.md](./data/CONTRIBUTING.md).

## Contributing
- Read [CONTRIBUTING.md](./CONTRIBUTING.md) for branching, commit, and PR expectations.
- For data-specific additions, follow [data/CONTRIBUTING.md](./data/CONTRIBUTING.md).

## JSON Schemas
- Mythologies: [data/SCHEMA.md#mythology](./data/SCHEMA.md#mythology)
- Myths: [data/SCHEMA.md#myth](./data/SCHEMA.md#myth)
- Deities: [data/SCHEMA.md#deity](./data/SCHEMA.md#deity)
- Sacred Sites: [data/SCHEMA.md#sacred-site](./data/SCHEMA.md#sacred-site)

## Security
If you discover a security issue, report it privately via the process in [SECURITY.md](./SECURITY.md).

## License
MIT. See [LICENSE](./LICENSE).
