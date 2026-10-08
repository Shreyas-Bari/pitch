/**
 * Safe local/session storage helper.
 * Strictly adheres to PITCH security requirements:
 * - Refresh tokens are stored ONLY in HttpOnly cookies, never in localStorage/sessionStorage.
 * - Only non-sensitive UI preferences or session presence hints are stored.
 */

const STORAGE_PREFIX = 'pitch_';

export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = window.localStorage.getItem(STORAGE_PREFIX + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch {
      // Ignore storage write errors (e.g., private browsing mode)
    }
  },

  remove(key) {
    try {
      window.localStorage.removeItem(STORAGE_PREFIX + key);
    } catch {
      // Ignore
    }
  },

  session: {
    get(key, defaultValue = null) {
      try {
        const item = window.sessionStorage.getItem(STORAGE_PREFIX + key);
        return item ? JSON.parse(item) : defaultValue;
      } catch {
        return defaultValue;
      }
    },

    set(key, value) {
      try {
        window.sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      } catch {
        // Ignore
      }
    },

    remove(key) {
      try {
        window.sessionStorage.removeItem(STORAGE_PREFIX + key);
      } catch {
        // Ignore
      }
    },
  },
};

export default storage;
