# AGENTS.md - Agentic Coding Guidelines

## Build/Lint/Test Commands

- Build: `npm run build` (vite build)
- Lint: `npm run lint` (ESLint on src/, no fix)
- Test: `npm run test` (Vitest run all)
- Single test: `vitest run tests/path/to/test.ts` (e.g., vitest run tests/utils/bank-detector.test.ts)
- Type check: `npm run check` (svelte-check)
- Format: `npm run format` (Prettier)
- Coverage: `npm run test:coverage`

## Code Style Guidelines

- **Imports**: Use ES modules, group by external/internal, no unused imports (warned).
- **Formatting**: Prettier - single quotes, no semicolons, trailing commas, 100 width, 2 spaces.
- **Types**: TypeScript strictNullChecks on, but strict off; explicit any allowed; use interfaces for objects.
- **Naming**: camelCase for variables/functions, PascalCase for types/components/classes, kebab-case for files.
- **Error Handling**: Use try-catch for async ops; throw custom errors; avoid console.error in prod.
- **Svelte**: Use runes (Svelte 5); no reactive functions; prefer stores for state.
- **Security**: No secrets in code; validate inputs; use bcryptjs for hashing.
- **Conventions**: Follow existing patterns; prefer const; use \_ for unused vars.
