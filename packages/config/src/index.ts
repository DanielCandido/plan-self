export interface AppConfig {
  databaseUrl: string;
  redisUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
}

export const loadConfig = (): AppConfig => ({
  databaseUrl: process.env.DATABASE_URL ?? '',
  redisUrl: process.env.REDIS_URL ?? '',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-only-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-only-refresh',
});
