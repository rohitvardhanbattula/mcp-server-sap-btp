import winston from 'winston';
export class Logger {
    component;
    winston;
    constructor(component) {
        this.component = component;
        this.winston = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
            defaultMeta: {
                component: this.component,
                service: 'btp-sap-odata-to-mcp-server'
            },
            transports: [
                new winston.transports.Console()
            ]
        });
    }
    debug(message, meta) {
        this.winston.debug(message, meta);
    }
    info(message, meta) {
        this.winston.info(message, meta);
    }
    warn(message, meta) {
        this.winston.warn(message, meta);
    }
    error(message, meta) {
        this.winston.error(message, meta);
    }
}
//# sourceMappingURL=logger.js.map