import { readFileSync, existsSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = dirname(fileURLToPath(import.meta.url));
process.env.PASSENGER_APP_ROOT ||= appRoot;

const configuredEnvFile = process.env.SITE_ENV_FILE
  ? (isAbsolute(process.env.SITE_ENV_FILE) ? process.env.SITE_ENV_FILE : join(appRoot, process.env.SITE_ENV_FILE))
  : null;

for (const envFile of [join(appRoot, '.env'), configuredEnvFile].filter(Boolean)) {
  if (!existsSync(envFile)) continue;
  const content = readFileSync(envFile, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const index = line.indexOf('=');
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    value = value.replace(/^['"]|['"]$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}

const { startServer } = await import('./dist/server/entry.mjs');

startServer();
