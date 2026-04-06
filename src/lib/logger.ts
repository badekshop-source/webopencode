// src/lib/logger.ts
// Production-ready logging utility for error tracking and monitoring

type LogLevel = 'debug'| 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = (process.env.NODE_ENV === 'production' ? 'info' : 'debug')as LogLevel;

function formatLog(entry: LogEntry): string {
  const { level, message, timestamp, context, error } = entry;
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  let log = `${prefix} ${message}`;
  
  if (context && Object.keys(context).length > 0) {
    log += `\n  Context: ${JSON.stringify(context)}`;
  }
  
  if (error) {
    log += `\n  Error: ${error.message}`;
    if (error.stack) {
      log += `\n  Stack: ${error.stack}`;
    }
  }
  
  return log;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>) {
    if (!shouldLog('debug')) return;
    const entry: LogEntry = {
      level: 'debug',
      message,
      timestamp: new Date().toISOString(),
      context,
    };
    console.debug(formatLog(entry));
  },

  info(message: string, context?: Record<string, unknown>) {
    if (!shouldLog('info')) return;
    const entry: LogEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      context,
    };
    console.info(formatLog(entry));
  },

  warn(message: string, context?: Record<string, unknown>) {
    if (!shouldLog('warn')) return;
    const entry: LogEntry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      context,
    };
    console.warn(formatLog(entry));
  },

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>) {
    if (!shouldLog('error')) return;
    const err = error instanceof Error ? error : new Error(String(error));
    const entry: LogEntry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      context,
      error: err,
    };
    console.error(formatLog(entry));
  },

  api(name: string, duration: number, status: 'success' | 'error', context?: Record<string, unknown>) {
    const level: LogLevel = status === 'error' ? 'error' : 'info';
    if (!shouldLog(level)) return;
    
    const entry: LogEntry = {
      level,
      message: `API ${name} ${status} (${duration}ms)`,
      timestamp: new Date().toISOString(),
      context: { ...context, duration, status },
    };
    
    if (level === 'error') {
      console.error(formatLog(entry));
    } else {
      console.info(formatLog(entry));
    }
  },

  db(operation: string, table: string, duration: number, status: 'success' | 'error') {
    const level: LogLevel = status === 'error' ? 'error' : 'debug';
    if (!shouldLog(level)) return;
    
    const entry: LogEntry = {
      level,
      message: `DB ${operation} on ${table} ${status} (${duration}ms)`,
      timestamp: new Date().toISOString(),
      context: { operation, table, duration, status },
    };
    
    if (level === 'error') {
      console.error(formatLog(entry));
    } else {
      console.debug(formatLog(entry));
    }
  },
};

export function withLogging<T extends(...args: unknown[]) => Promise<unknown>>(
  fn: T,
  name: string
): T {
  return (async (...args: Parameters<T>) => {
    const start = Date.now();
    try {
      const result = await fn(...args);
      logger.api(name, Date.now() - start, 'success');
      return result;
    } catch (error) {
      logger.api(name, Date.now() - start, 'error');
      throw error;
    }
  }) as T;
}

export default logger;