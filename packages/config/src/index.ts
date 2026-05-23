import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface AppConfig {
  databaseUrl: string;
  redisUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
}

export interface ApiConfig {
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  appBaseUrl: string;
  googleOauthUrl: string;
  githubOauthUrl: string;
  nodeEnv: string;
}

export interface WorkerConfig {
  redisUrl: string;
}

export interface GatewayConfig {
  port: number;
}

const MONOREPO_MARKERS = ['turbo.json', '.env.example'];

const findMonorepoRoot = (startDir: string): string | undefined => {
  let current = startDir;

  while (true) {
    const hasAllMarkers = MONOREPO_MARKERS.every((marker) => existsSync(join(current, marker)));
    if (hasAllMarkers) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      return undefined;
    }
    current = parent;
  }
};

const resolveRepoRoot = (): string => {
  const cwdRoot = findMonorepoRoot(process.cwd());
  if (cwdRoot) {
    return cwdRoot;
  }

  const sourceRoot = findMonorepoRoot(dirname(fileURLToPath(import.meta.url)));
  if (sourceRoot) {
    return sourceRoot;
  }

  console.warn(
    '[config] Could not detect monorepo root (expected markers: turbo.json and .env.example). Falling back to process.cwd() for .env lookup.',
  );
  return process.cwd();
};

export const resolveRootEnvPath = (): string => join(resolveRepoRoot(), '.env');

export const loadRootEnv = (): { path: string; loaded: boolean } => {
  const envPath = resolveRootEnvPath();
  if (!existsSync(envPath)) {
    return { path: envPath, loaded: false };
  }

  process.loadEnvFile(envPath);
  return { path: envPath, loaded: true };
};

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is required`);
  }
  return value;
};

const readEnvOrDefault = (key: string, fallback: string): string => process.env[key] ?? fallback;

export const loadConfig = (): AppConfig => ({
  databaseUrl: requireEnv('DATABASE_URL'),
  redisUrl: requireEnv('REDIS_URL'),
  jwtAccessSecret: requireEnv('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: requireEnv('JWT_REFRESH_SECRET'),
});

export const loadApiConfig = (): ApiConfig => ({
  jwtAccessSecret: requireEnv('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: requireEnv('JWT_REFRESH_SECRET'),
  appBaseUrl: readEnvOrDefault('APP_BASE_URL', 'http://localhost:3000'),
  googleOauthUrl: readEnvOrDefault('GOOGLE_OAUTH_URL', '#'),
  githubOauthUrl: readEnvOrDefault('GITHUB_OAUTH_URL', '#'),
  nodeEnv: readEnvOrDefault('NODE_ENV', 'development'),
});

export const loadWorkerConfig = (): WorkerConfig => ({
  redisUrl: readEnvOrDefault('REDIS_URL', 'redis://localhost:6379'),
});

export const loadGatewayConfig = (): GatewayConfig => {
  const rawPort = process.env.GATEWAY_PORT;
  if (!rawPort) {
    return { port: 3010 };
  }

  const port = Number.parseInt(rawPort, 10);
  if (Number.isNaN(port) || port <= 0 || port > 65535) {
    throw new Error('GATEWAY_PORT must be a number between 1 and 65535');
  }

  return { port };
};
