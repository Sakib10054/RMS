# RestaurantOS frontend review — changes

## Changed files

1. `src/components/RecipeImage.tsx` — new reusable recipe image component with consistent image sizing, lazy loading, failed-image fallback, and accessible fallback text.
2. `src/lib/imageUrl.ts` — new shared URL resolver for absolute URLs, data/blob URLs, and relative paths returned by the API.
3. `src/pages/CustomerDashboardPage.tsx` — improved responsive dashboard layout, loading/error feedback, offer cards, image fallback, and safer display for missing order/table fields.
4. `src/pages/CustomerMenuPage.tsx` — shared image component, improved responsive text layout, accessible search label, and pressed state on Offers-only filter.
5. `src/pages/CustomerReservationsPage.tsx` — shared image component for pre-order recipe choices and user-facing error handling for reservation cancellation.

## Validation

- TypeScript project build/check passed using `node node_modules/typescript/bin/tsc -b --force --pretty false`.
- Vite production bundling could not be completed in this environment because the uploaded `node_modules` does not contain the platform-specific optional dependency `@rollup/rollup-linux-x64-gnu`. On Windows, run `npm install` inside `frontend` and then `npm run build`.

## Install

Copy the five changed files into the same paths in your project. The new files are `src/components/RecipeImage.tsx` and `src/lib/imageUrl.ts`. Keep your existing `.env` and set `VITE_API_BASE_URL` to your backend origin (for example `http://localhost:8080`, without `/api`).
