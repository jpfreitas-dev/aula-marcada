import 'dotenv/config';

import { defineConfig } from 'prisma/config';

// Prisma CLI (migrate deploy) needs a direct Postgres session (advisory locks).
// Runtime queries use DATABASE_URL (pooled) via lib/prisma.ts.
const migrationDatabaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!migrationDatabaseUrl) {
  throw new Error('DIRECT_URL or DATABASE_URL must be defined for Prisma CLI');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: migrationDatabaseUrl,
  },
});
