// lib/redis.ts
// Env vars `KV_REST_API_URL` / `KV_REST_API_TOKEN` are auto-provisioned by
// the Vercel Marketplace Upstash integration. Locally, `vercel env pull .env`
// syncs them.
import { Redis } from '@upstash/redis';

declare global {
  // eslint-disable-next-line no-var
  var __upstashRedis: Redis | undefined;
}

function createRedis(): Redis {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error(
      'Missing KV_REST_API_URL or KV_REST_API_TOKEN — run `vercel env pull .env` to sync.',
    );
  }
  return new Redis({ url, token });
}

export const redis = globalThis.__upstashRedis ?? createRedis();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__upstashRedis = redis;
}
