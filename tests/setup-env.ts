// src/lib/config/env.ts validates the environment at module load, so every
// test that imports app code needs a well-formed environment first. Vitest
// runs setup files before any test module is imported. The ?? guards keep a
// developer's real exported environment from being clobbered. Object.assign
// is used because @types/node marks NODE_ENV readonly.
const { NODE_ENV, DATABASE_URL, REDIS_URL } = process.env;
Object.assign(process.env, {
  NODE_ENV: NODE_ENV ?? "test",
  DATABASE_URL: DATABASE_URL ?? "postgresql://postgres:test-password@127.0.0.1:5432/test",
  REDIS_URL: REDIS_URL ?? "redis://127.0.0.1:6379",
});
