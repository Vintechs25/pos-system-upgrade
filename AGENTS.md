# Project Notes

## Server functions
- TanStack `*.functions.ts` files live in `src/lib/` (e.g. `src/lib/business-provisioning.functions.ts`, `src/lib/mpesa.functions.ts`), never in `src/server/` — the bundler's import protection blocks the whole `src/server/` directory from client bundles, and these files are imported by UI components.
- Keep `.functions.ts` files to `createServerFn` declarations only; any service-role/admin client (`@/integrations/supabase/client.server`) stays out of the top level when possible.
