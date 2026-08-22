# Fresh15 Partner — Next.js Migration Verification

## Migration
- React/TanStack Start runtime migrated to Next.js App Router.
- Existing partner routes preserved under `app/` with compatibility wrappers around the existing feature modules.
- TanStack Query retained for authenticated client-side data fetching and mutations.
- API access centralized in `src/lib/api-client.ts`.
- Theme/background tokens remain centralized in `src/styles.css`.
- Next.js route navigation uses `next/link`/`next/navigation` behind `src/lib/next-router-compat.tsx`.
- Added Next root error and 404 boundaries.
- Added hydration-safe `suppressHydrationWarning` at the root and client-only persistence for auth/theme state.

## Commands
```bash
npm i
npm run build
npm start
```

## Sandbox verification status
`npm run build` could not be executed to completion in the packaging sandbox because the npm registry was unavailable (`EAI_AGAIN registry.npmjs.org`) and there was no local dependency cache containing Next.js. The source was additionally checked with the globally available TypeScript parser in no-resolve mode to catch syntax errors.

The package therefore does **not** claim a completed production build from this sandbox. Run the commands above after extraction; any compiler diagnostics should be treated as the authoritative final check.

## Environment
Copy `.env.example` to `.env.local` when a non-default API host is required:

```env
NEXT_PUBLIC_API_BASE_URL=https://fresh15-main.onrender.com
```
