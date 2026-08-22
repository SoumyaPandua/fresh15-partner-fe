# Fresh15 Partner — Next.js

Fresh15 Delivery Partner application migrated from the original React/TanStack Start runtime to Next.js App Router.

## Production

```bash
npm i
npm run build
npm start
```

## Development

```bash
npm run dev
```

## Architecture

- **Next.js App Router** for routing, route-level loading boundaries, production code splitting, and client navigation.
- **TanStack Query** for authenticated delivery/notification data and mutations.
- **Centralized API client** in `src/lib/api-client.ts`.
- **Centralized theme/design tokens** in `src/styles.css`.
- **Persistent auth/theme state** in `src/lib/app-state.tsx`.
- **Socket.IO realtime delivery/location layer** in `src/lib/realtime.tsx` and `src/lib/socket.ts`.
- **Next-compatible router bridge** in `src/lib/next-router-compat.tsx` so existing feature components can be migrated without rewriting every interaction at once.

Next automatically code-splits routes and prefetches visible `Link` destinations in production, which helps make page transitions feel app-like. See the official Next.js navigation guidance: https://nextjs.org/learn/dashboard-app/navigating-between-pages

## Theme

Most global visual decisions live in:

```text
src/styles.css
```

Change the CSS variables, gradients, shadows, and motion tokens there instead of editing individual pages.

## API

```env
NEXT_PUBLIC_API_BASE_URL=https://fresh15-main.onrender.com
```

The default value points to the existing Fresh15 backend so the migrated app remains usable without extra configuration.
