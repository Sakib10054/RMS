# RestaurantOS frontend refresh

## What changed
- Added a shared design-token layer for page/surface colors, borders, elevation, and muted text, while retaining the existing Tailwind utility classes and emerald/ocean/violet/rose/amber/cyan brand themes.
- Added persistent light/dark mode switching alongside the existing color-theme picker.
- Refined app-shell backgrounds, card elevation, border radii, typography, focus indicators, button interaction states, navigation active states, and table hover/heading treatments.
- Added subtle entrance motion and shimmer loading skeletons, with a reduced-motion accessibility override.
- Improved narrow-screen table handling and touch scrolling without changing page routes or API/service contracts.
- Updated document title and removed the default Vite favicon reference.
- Kept the existing React, React Router, TanStack Query, Axios, Recharts, authentication, and service layers intact.

## Validation
- `tsc -b` passed after the changes.
- `vite build` could not complete in this environment because the packaged `node_modules` lacked Rollup's optional native binary (`@rollup/rollup-linux-x64-gnu`), and the package install did not finish in the available time. Run `npm install` (or `npm ci`) in the frontend folder, then `npm run build` to complete the production build check.

## Remaining review
- A live browser/device pass against a running backend is still recommended to verify every role-specific route and real data state. No backend/API contracts or business logic were intentionally changed.
