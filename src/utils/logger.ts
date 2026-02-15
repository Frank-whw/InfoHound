export class Logger {
  private prefix: string;

  constructor(prefix: string = 'InfoHound') {
    this.prefix = prefix;
  }

  private log(level: string, message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] [${this.prefix}] ${message}`, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log('INFO', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log('WARN', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log('ERROR', message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.DEBUG) {
      this.log('DEBUG', message, ...args);
    }
  }
}

export const logger = new Logger();
