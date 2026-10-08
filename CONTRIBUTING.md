# Contributing

Thank you for contributing to AIMistakeLib.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md). Use the provided issue templates before starting a large change.

## Development workflow

1. Create a focused branch from the default branch.
2. Install exact dependencies with `npm ci`.
3. Copy `.env.example` to `.env.local` and use development-only credentials.
4. Keep UI code in `app/`, `components/`, `hooks/`, or `lib/`; keep secrets and provider integrations in `server/`.
5. Validate inputs with schemas from `contracts/`.
6. Add an ordered file under `supabase/migrations/` for every database change; do not treat a manual production edit as a completed migration.

Use two-space indentation, single quotes in TypeScript, PascalCase component names, and `use`-prefixed hook names. Prefer the `@/` alias over long relative imports.

Before opening a pull request, run:

```bash
npm run check
```

Pull requests should explain the problem and solution, identify migrations or environment changes, link relevant issues, and include desktop and mobile screenshots for visible UI changes. Provider smoke tests are optional, can incur charges, and must never be presented as offline verification unless they were actually run. Never include credentials, access tokens, production data, or student uploads.
