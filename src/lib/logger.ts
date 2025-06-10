/**
 * Simple logger utility to replace console statements
 * Can be easily extended with external logging services
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private minLevel: LogLevel;
  
  constructor() {
    // Set log level based on environment
    this.minLevel = process.env.NODE_ENV === 'development' 
      ? LogLevel.DEBUG 
      : LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${levelName}: ${message}${contextStr}`;
  }

  debug(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    console.info(this.formatMessage(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    console.warn(this.formatMessage(LogLevel.WARN, message, context));
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const errorContext = error ? { 
      ...context, 
      error: error.message, 
      stack: error.stack 
    } : context;
    
    console.error(this.formatMessage(LogLevel.ERROR, message, errorContext));
  }

  // API-specific logging methods
  apiRequest(method: string, url: string, context?: Record<string, any>): void {
    this.info(`API Request: ${method} ${url}`, context);
  }

  apiResponse(method: string, url: string, status: number, context?: Record<string, any>): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const message = `API Response: ${method} ${url} - ${status}`;
    
    if (level === LogLevel.ERROR) {
      this.error(message, undefined, context);
    } else {
      this.info(message, context);
    }
  }

  // Auth-specific logging
  authEvent(event: string, userId?: string, context?: Record<string, any>): void {
    this.info(`Auth: ${event}`, { userId, ...context });
  }

  // Report-specific logging
  reportEvent(event: string, reportId?: string, context?: Record<string, any>): void {
    this.info(`Report: ${event}`, { reportId, ...context });
  }
}

// Export singleton instance
export const logger = new Logger();

// Helper for backward compatibility with existing console.log statements
export const log = {
  debug: (message: string, ...args: any[]) => logger.debug(message, { args }),
  info: (message: string, ...args: any[]) => logger.info(message, { args }),
  warn: (message: string, ...args: any[]) => logger.warn(message, { args }),
  error: (message: string, error?: Error) => logger.error(message, error),
};