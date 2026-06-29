type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[MIN_LEVEL];
}

function format(level: LogLevel, tag: string, message: string, meta?: unknown): string {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}] [${tag}] ${message}`;
  if (meta !== undefined) {
    return `${base} ${typeof meta === 'string' ? meta : JSON.stringify(meta)}`;
  }
  return base;
}

export const logger = {
  debug(tag: string, message: string, meta?: unknown) {
    if (shouldLog('debug')) console.debug(format('debug', tag, message, meta));
  },
  info(tag: string, message: string, meta?: unknown) {
    if (shouldLog('info')) console.info(format('info', tag, message, meta));
  },
  warn(tag: string, message: string, meta?: unknown) {
    if (shouldLog('warn')) console.warn(format('warn', tag, message, meta));
  },
  error(tag: string, message: string, meta?: unknown) {
    if (shouldLog('error')) console.error(format('error', tag, message, meta));
  },
};
