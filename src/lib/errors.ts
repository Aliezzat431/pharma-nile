/**
 * PharmaNile Categorized Error Definitions
 * Provides specialized error classes for API responses, logging, and metrics aggregation.
 */

export type ErrorCategory = 'AUTH' | 'DATABASE' | 'NETWORK' | 'VALIDATION' | 'UNKNOWN';

export abstract class PharmaNileError extends Error {
  public abstract readonly category: ErrorCategory;
  public readonly timestamp: string;

  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly details: any = null,
    public readonly originalError: Error | any = null
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date().toISOString();
    
    // Preserve stack trace in modern V8 / Node environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  public toJSON() {
    return {
      name: this.name,
      category: this.category,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      details: this.details,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
    };
  }
}

export class AuthError extends PharmaNileError {
  public readonly category: ErrorCategory = 'AUTH';
  constructor(message: string, statusCode: number = 401, details: any = null) {
    super(message, statusCode, details);
  }
}

export class DatabaseError extends PharmaNileError {
  public readonly category: ErrorCategory = 'DATABASE';
  constructor(message: string, originalError: any = null, details: any = null) {
    // Determine status based on Postgres codes if available
    const code = originalError?.code || '';
    const status = code.startsWith('23') ? 409 : 500; // 23xxx are integrity constraint violations
    super(message, status, details, originalError);
  }
}

export class NetworkError extends PharmaNileError {
  public readonly category: ErrorCategory = 'NETWORK';
  constructor(message: string, originalError: any = null) {
    super(message, 503, null, originalError);
  }
}

export class ValidationError extends PharmaNileError {
  public readonly category: ErrorCategory = 'VALIDATION';
  constructor(message: string, details: any = null) {
    super(message, 400, details);
  }
}

export class UnexpectedError extends PharmaNileError {
  public readonly category: ErrorCategory = 'UNKNOWN';
  constructor(message: string, originalError: any = null) {
    super(message, 500, null, originalError);
  }
}

/**
 * Helper to translate Postgres / Supabase SDK errors to PharmaNile categorized errors.
 */
export function handleDatabaseError(error: any, contextMessage: string): DatabaseError {
  const code = error?.code || 'UNKNOWN_DB_CODE';
  const detail = error?.details || error?.hint || '';
  const message = `${contextMessage} (DB Error [${code}]: ${error?.message || ''}. ${detail})`.trim();
  return new DatabaseError(message, error);
}
