import { defineConfig } from 'prisma/config';

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://lemon:lemon_secret@localhost:5432/lemon_seasons?schema=public';

export default defineConfig({
  datasourceUrl: DATABASE_URL,
  migrate: {
    url: DATABASE_URL,
  },
});
