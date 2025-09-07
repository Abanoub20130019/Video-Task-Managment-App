import pino from 'pino';

// Create logger instance
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
  ...(process.env.NODE_ENV === 'production' && {
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }),
});

// Enhanced logger with context
export class Logger {
  private context: string;

  constructor(context: string = 'App') {
    this.context = context;
  }

  private formatMessage(message: string, meta?: any) {
    return {
      context: this.context,
      message,
      ...(meta && { meta }),
    };
  }

  info(message: string, meta?: any) {
    logger.info(this.formatMessage(message, meta));
  }

  error(message: string, error?: Error | any, meta?: any) {
    logger.error({
      ...this.formatMessage(message, meta),
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    });
  }

  warn(message: string, meta?: any) {
    logger.warn(this.formatMessage(message, meta));
  }

  debug(message: string, meta?: any) {
    logger.debug(this.formatMessage(message, meta));
  }

  trace(message: string, meta?: any) {
    logger.trace(this.formatMessage(message, meta));
  }

  // HTTP request logging
  logRequest(req: any, res: any, responseTime?: number) {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      ...(responseTime && { responseTime: `${responseTime}ms` }),
    };

    if (res.statusCode >= 400) {
      this.error('HTTP Request Error', null, logData);
    } else {
      this.info('HTTP Request', logData);
    }
  }

  // Database operation logging
  logDbOperation(operation: string, collection: string, duration?: number, error?: Error) {
    const logData = {
      operation,
      collection,
      ...(duration && { duration: `${duration}ms` }),
    };

    if (error) {
      this.error(`Database ${operation} failed`, error, logData);
    } else {
      this.debug(`Database ${operation} completed`, logData);
    }
  }

  // Cache operation logging
  logCacheOperation(operation: string, key: string, hit?: boolean, ttl?: number) {
    const logData = {
      operation,
      key,
      ...(hit !== undefined && { hit }),
      ...(ttl && { ttl: `${ttl}s` }),
    };

    this.debug(`Cache ${operation}`, logData);
  }

  // Authentication logging
  logAuth(event: string, userId?: string, email?: string, ip?: string, success: boolean = true) {
    const logData = {
      event,
      ...(userId && { userId }),
      ...(email && { email }),
      ...(ip && { ip }),
      success,
    };

    if (success) {
      this.info(`Auth: ${event}`, logData);
    } else {
      this.warn(`Auth Failed: ${event}`, logData);
    }
  }

  // Performance logging
  logPerformance(operation: string, duration: number, meta?: any) {
    const logData = {
      operation,
      duration: `${duration}ms`,
      ...(meta && { meta }),
    };

    if (duration > 1000) {
      this.warn('Slow operation detected', logData);
    } else {
      this.debug('Performance metric', logData);
    }
  }
}

// Create default logger instances for different contexts
export const appLogger = new Logger('App');
export const dbLogger = new Logger('Database');
export const cacheLogger = new Logger('Cache');
export const authLogger = new Logger('Auth');
export const apiLogger = new Logger('API');

// Performance measurement utility
export function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  logger: Logger = appLogger
): Promise<T> {
  const start = Date.now();
  
  return fn().then(
    (result) => {
      const duration = Date.now() - start;
      logger.logPerformance(operation, duration);
      return result;
    },
    (error) => {
      const duration = Date.now() - start;
      logger.logPerformance(operation, duration, { error: true });
      throw error;
    }
  );
}

// Request timing middleware helper
export function createRequestTimer() {
  const start = Date.now();
  
  return {
    end: () => Date.now() - start,
  };
}

export default logger;