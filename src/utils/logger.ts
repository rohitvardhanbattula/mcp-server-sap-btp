import winston from 'winston';

export class Logger {
    private winston: winston.Logger;
    constructor(private component: string) {
        this.winston = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            defaultMeta: { component: this.component },
            transports: [new winston.transports.Console()]
        });
    }
    debug(message: string, meta?: unknown) { this.winston.debug(message, meta); }
    info(message: string, meta?: unknown) { this.winston.info(message, meta); }
    warn(message: string, meta?: unknown) { this.winston.warn(message, meta); }
    error(message: string, meta?: unknown) { this.winston.error(message, meta); }
}