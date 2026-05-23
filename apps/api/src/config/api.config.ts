import { loadApiConfig, loadRootEnv } from '@plan-self/config';

const { path: envPath, loaded } = loadRootEnv();

export const apiConfig = loadApiConfig();

if (!loaded) {
  console.warn(`[api] Root .env not found at ${envPath}. Using environment variables provided by the runtime.`);
}
