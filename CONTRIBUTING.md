# Contributing to MythAtlas

Thanks for contributing to MythAtlas. This project combines product code and curated mythology datasets, so we keep changes reviewable, traceable, and easy to validate.

## Ground Rules
- Keep pull requests focused and small.
- Prefer descriptive commit messages with clear intent.
- Update docs when behavior or structure changes.
- Do not include secrets, credentials, or private data.

## Development Workflow
1. Fork the repository or create a feature branch.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Make your changes.
4. Run quality checks:
   ```bash
   npm run lint
   npm run qa:data-integrity
   npm run build
   ```
5. Open a pull request with a concise summary and verification steps.

## Branch and Commit Conventions
- Branch names should be specific, e.g. `feature/add-egyptian-sites` or `fix/map-popup-overflow`.
- Use concise commit subjects in imperative mood, e.g. `Add data integrity check for coordinates`.
- Link related issues when applicable.

## Data Contributions
For myths, deities, mythologies, and sacred sites, follow the dedicated guide:
- [data/CONTRIBUTING.md](./data/CONTRIBUTING.md)
- [data/SCHEMA.md](./data/SCHEMA.md)

## Pull Request Checklist
- [ ] Scope is focused and production-ready.
- [ ] Lint and build pass locally.
- [ ] Data changes follow schema and keep ids stable.
- [ ] Documentation is updated where relevant.
