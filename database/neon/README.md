# Neon — preparation only

No file here has been executed against Neon. Nothing runs automatically.
Read [the complete audit and cutover plan](../../NEON-INTEGRATION-PLAN.md) first.

Proposed manual order after reviewing the target branch and impact:

1. Back up/export any existing data and inventory files in both old Storage buckets.
2. Review `preflight.sql` (read only) on a Neon development branch. An existing
   `portfolio` schema must match the proposed definitions; `IF NOT EXISTS` does
   not reconcile schema drift. Stop and design an explicit additive migration
   if it differs. Existing `public` objects are untouched.
3. Review/run `migrations/001_portfolio.sql` with the migration owner. It creates
   ten tables in a dedicated schema, with indexes and no PUBLIC permissions.
4. If importing data, map IDs first and import before seeding. `works.id` and
   `projects.id` are text: existing UUIDs can be retained as strings. Map the four
   canonical projects to their slugs to avoid duplicates. Normalize subscriber
   emails and aggregate duplicate searches before loading. Identity IDs require
   `OVERRIDING SYSTEM VALUE` and a sequence reset after import.
5. Review/run `migrations/002_seed_portfolio.sql`. It only inserts missing IDs,
   never overwrites/deletes rows. Expected four canonical slugs, eight gallery
   entries in total, no Regal Stay and no testimonial/analytics seeds.
6. Create a separate runtime role privately in the Neon console (no password
   script in this repo). Grant `USAGE ON SCHEMA portfolio`, `SELECT, INSERT,
   UPDATE, DELETE ON ALL TABLES IN SCHEMA portfolio`, and `USAGE, SELECT ON ALL
   SEQUENCES IN SCHEMA portfolio` **to that chosen role**. No schema CREATE,
   TRUNCATE, DDL, or PUBLIC/anonymous grants. Revisit narrower per-table grants
   once repositories are implemented. Future migrations must grant new objects
   explicitly. Use the owner connection only for manual migrations.
7. Configure `DATABASE_URL` with the runtime role connection string, preserving
   TLS (`sslmode=require` or `verify-full`). Keep it in ignored local env files;
   never prefix it with `NEXT_PUBLIC_`. Node 22/24 LTS recommended; the driver
   requires Node >=19. Use the provider's pooled URL for application use; use
   a direct owner connection in the SQL editor/manual migration workflow.
8. Implement and test the API cutover described in the main report on the
   development branch. Setting DATABASE_URL alone does not switch providers.

All statements use schema-qualified names, no Supabase extensions, storage/auth
schemas, browser database SDK, or automatic schema synchronization. No destructive
down migration is supplied: rollback application configuration to the prior
backend after reconciling writes; retain Neon data for investigation.

`src/lib/neon.js` is server-only and lazy. Example for a future authenticated API:

```js
import { queryDatabase } from '@/lib/neon';
// Validate input and enforce JWT authorization/visibility before querying.
const rows = await queryDatabase`
  SELECT id, title FROM portfolio.works WHERE id = ${id} AND visible = true
`;
```

Do not concatenate request values into SQL or pass arbitrary request bodies as
column names. Return a generic API error; never log the original driver exception
or request parameters. Bigint values/counts and timestamp serialization must be
mapped deliberately to the existing JSON contract during cutover.
