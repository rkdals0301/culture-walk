# Culture Walk Agent Guide

## Project

Culture Walk (`문화산책`) is a mobile-first map service for discovering Korean cultural events. It uses Next.js 16, React 19, Tailwind CSS, Cloudflare Workers through OpenNext, Cloudflare D1, and Cloudflare KV.

## Repository Layout

- `src/app`: App Router pages and API routes.
- `src/components`: UI grouped by feature (`Map`, `Header`, `BottomSheet`, and shared `Common`).
- `src/services`: TourAPI access, normalization, snapshot synchronization, cache, and domain logic.
- `src/db/schema.ts`: Drizzle schema.
- `db/migrations`: Append-only D1 migrations. Never rewrite an applied migration.
- `tests`: Node test runner tests, especially data normalization and synchronization behavior.
- `worker.js`: Cloudflare Worker scheduled-event entry point.
- `wrangler.jsonc`: Worker bindings and cron schedules.

## Development Commands

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run db:migrate:local
npm run db:migrate:remote
npm run deploy
```

Run focused checks for a small change. Run `npm test`, `npm run typecheck`, and `npm run lint` before deploying or after changing shared data, API, or UI behavior.

## Implementation Rules

- Use TypeScript with the `@/*` import alias and keep strict types intact.
- Keep server-only TourAPI and D1 code in API routes, worker code, or services. Do not expose secrets to client components.
- Preserve the existing feature-oriented component structure. Reuse `Button`, `IconButton`, `CultureCategoryBadge`, and shared surface classes before adding a new primitive.
- Use Lucide icons for new controls. Icon-only controls require an accessible label or tooltip.
- Keep Korean UI copy concise and action-oriented.
- Do not edit generated directories such as `.next` or `.open-next`.
- Do not commit `.env*`, API keys, sync tokens, database exports, or generated Worker artifacts.

## Data Synchronization Rules

- The list snapshot uses stable `tourapi:{contentId}` source keys, staging rows, and an ownership lock. Do not replace it with delete-and-reinsert logic.
- List synchronization owns list fields only. It must not overwrite detail fields populated by TourAPI detail endpoints.
- A successful, validated snapshot is required before changing missing counts or deactivating records. The first absence keeps an event active; the second consecutive validated absence deactivates it.
- Detail reads use stale-while-revalidate: return D1/KV data first, record a refresh request when stale, and let the scheduled Worker call TourAPI.
- Keep external API failures non-destructive: retain previously stored detail data and use the existing retry/backoff fields.
- Any migration that changes synchronization fields must update both `db/migrations` and `src/db/schema.ts`, then add or update a test.

## Deployment and Operations

- Apply remote D1 migrations before deploying code that depends on them.
- `SYNC_TOKEN` and `TOUR_API_KEY` are Worker secrets. Set them with `wrangler secret put`; never add them to `wrangler.jsonc`.
- Check `GET /api/health` after deployment. It reports active counts, coordinate/date quality, cache state, and the most recent snapshot result.
- Cron schedules are defined in `wrangler.jsonc`. Do not alter cadence without considering TourAPI quota, Worker subrequest limits, and D1 write volume.
- On Windows, stop local `wrangler dev` processes that own `.open-next` before running a production build; otherwise OpenNext cannot clear its build output.

## Change Checklist

1. Keep the change scoped and update tests for altered behavior.
2. Verify light and dark themes for UI changes at mobile and desktop widths.
3. Run the appropriate validation commands.
4. Review `git diff` and `git status` before committing.
5. After deployment, verify `/api/health` and the affected public route.
