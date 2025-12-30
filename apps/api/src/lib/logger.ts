/**
 * Simple logger utility for services.
 *
 * Uses console methods with consistent formatting.
 * In production, this could be enhanced with structured logging.
 */

export const logger = {
  info(message: string, meta?: Record<string, unknown>): void {
    if (meta) {
      console.info(`[INFO] ${message}`, meta);
    } else {
      console.info(`[INFO] ${message}`);
    }
  },

  warn(message: string, meta?: Record<string, unknown>): void {
    if (meta) {
      console.warn(`[WARN] ${message}`, meta);
    } else {
      console.warn(`[WARN] ${message}`);
    }
  },

  error(message: string, meta?: Record<string, unknown>): void {
    if (meta) {
      console.error(`[ERROR] ${message}`, meta);
    } else {
      console.error(`[ERROR] ${message}`);
    }
  },

  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'development') {
      if (meta) {
        console.debug(`[DEBUG] ${message}`, meta);
      } else {
        console.debug(`[DEBUG] ${message}`);
      }
    }
  },
};
