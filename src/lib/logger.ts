/**
 * PharmaNile Structured Logger
 * Provides structured JSON logging in production and formatted logs in development.
 * Supports error serialization, request IDs, and category labels.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  category?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
    details?: any;
  };
}

class StructuredLogger {
  private isProduction = process.env.NODE_ENV === 'production';

  private formatError(err: Error | any) {
    if (!err) return undefined;
    if (err instanceof Error) {
      return {
        message: err.message,
        // In production, we explicitly preserve the stack trace for Sentry/Log aggregators
        stack: err.stack,
        code: (err as any).code,
        details: (err as any).details || undefined
      };
    }
    return {
      message: typeof err === 'string' ? err : JSON.stringify(err)
    };
  }

  private log(level: LogLevel, message: string, options: { 
    category?: string; 
    requestId?: string; 
    metadata?: Record<string, any>; 
    error?: Error | any;
  } = {}) {
    const payload: LogPayload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      category: options.category || 'General',
      requestId: options.requestId,
      metadata: options.metadata,
      error: this.formatError(options.error)
    };

    if (this.isProduction) {
      // Production: structured single-line JSON log
      console.log(JSON.stringify(payload));
    } else {
      // Development: Dev-friendly formatted output
      const colorMap = {
        debug: '\x1b[36m%s\x1b[0m', // Cyan
        info: '\x1b[32m%s\x1b[0m',  // Green
        warn: '\x1b[33m%s\x1b[0m',  // Yellow
        error: '\x1b[31m%s\x1b[0m'   // Red
      };
      
      const timeStr = `[${payload.timestamp.split('T')[1].substring(0, 8)}]`;
      const reqStr = payload.requestId ? ` (Req: ${payload.requestId})` : '';
      const catStr = `[${payload.category}]`;
      
      console.log(colorMap[level], `${timeStr} ${level.toUpperCase()} ${catStr}${reqStr}: ${message}`);
      
      if (options.metadata) {
        console.log(JSON.stringify(options.metadata, null, 2));
      }
      if (payload.error) {
        console.error('\x1b[31m%s\x1b[0m', payload.error.stack || payload.error.message);
      }
    }
  }

  public debug(message: string, options?: Parameters<StructuredLogger['log']>[2]) {
    this.log('debug', message, options);
  }

  public info(message: string, options?: Parameters<StructuredLogger['log']>[2]) {
    this.log('info', message, options);
  }

  public warn(message: string, options?: Parameters<StructuredLogger['log']>[2]) {
    this.log('warn', message, options);
  }

  public error(message: string, options?: Parameters<StructuredLogger['log']>[2]) {
    this.log('error', message, options);
  }
}

export const logger = new StructuredLogger();
