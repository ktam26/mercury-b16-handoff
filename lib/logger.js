/**
 * Simple console logging utility for the Mercury B16 app
 * Logs are only active in development mode
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  info: (message, ...args) => {
    if (isDev) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },

  error: (message, ...args) => {
    if (isDev) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },

  warn: (message, ...args) => {
    if (isDev) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  debug: (message, ...args) => {
    if (isDev) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },

  // User interaction logging
  pageView: (pageName) => {
    if (isDev) {
      console.log(`[PAGE VIEW] ${pageName}`);
    }
  },

  click: (element, data = {}) => {
    if (isDev) {
      console.log(`[CLICK] ${element}`, data);
    }
  },

  navigation: (from, to) => {
    if (isDev) {
      console.log(`[NAVIGATION] ${from} → ${to}`);
    }
  },
};