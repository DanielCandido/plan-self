const STORAGE_KEY_REMEMBER = 'planself:remember_me';
const STORAGE_KEY_REMEMBER_EMAIL = 'planself:remember_email';
const STORAGE_KEY_BOOTSTRAPPED = 'planself:bootstrapped';

function isClient() {
  return typeof window !== 'undefined';
}

export const storage = {
  setRememberMe(value: boolean) {
    if (!isClient()) return;
    try {
      localStorage.setItem(STORAGE_KEY_REMEMBER, JSON.stringify(value));
    } catch {
      /* storage unavailable */
    }
  },

  getRememberMe(): boolean {
    if (!isClient()) return false;
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_REMEMBER) ?? 'false');
    } catch {
      return false;
    }
  },

  setRememberEmail(email: string) {
    if (!isClient()) return;
    try {
      localStorage.setItem(STORAGE_KEY_REMEMBER_EMAIL, email);
    } catch {
      /* storage unavailable */
    }
  },

  getRememberEmail(): string {
    if (!isClient()) return '';
    try {
      return localStorage.getItem(STORAGE_KEY_REMEMBER_EMAIL) ?? '';
    } catch {
      return '';
    }
  },

  setBootstrapped(value: boolean) {
    if (!isClient()) return;
    try {
      sessionStorage.setItem(STORAGE_KEY_BOOTSTRAPPED, JSON.stringify(value));
    } catch {
      /* storage unavailable */
    }
  },

  getBootstrapped(): boolean {
    if (!isClient()) return false;
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY_BOOTSTRAPPED) ?? 'false');
    } catch {
      return false;
    }
  },

  clear() {
    if (!isClient()) return;
    try {
      localStorage.removeItem(STORAGE_KEY_REMEMBER);
      localStorage.removeItem(STORAGE_KEY_REMEMBER_EMAIL);
      sessionStorage.removeItem(STORAGE_KEY_BOOTSTRAPPED);
    } catch {
      /* storage unavailable */
    }
  },
};
