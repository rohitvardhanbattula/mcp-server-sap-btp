import { Logger } from './logger.js';
export class ErrorHandler {
    static logger = new Logger('ErrorHandler');
    static handle(error) {
        let errObj = {};
        if (typeof error === 'object' && error !== null) {
            errObj = error;
        }
        this.logger.error('Unhandled error:', {
            message: errObj.message,
            stack: errObj.stack,
            code: errObj.code,
            statusCode: errObj.statusCode
        });
        // In production, you might want to send to monitoring service
        if (process.env.NODE_ENV === 'production') {
            // Send to monitoring service
        }
    }
    static categorizeError(error) {
        // Type guard for error object
        if (typeof error !== 'object' || error === null) {
            return 'Unknown';
        }
        const err = error;
        if (err.statusCode) {
            switch (err.statusCode) {
                case 401: return 'Authentication';
                case 403: return 'Authorization';
                case 404: return 'NotFound';
                case 500: return 'ServerError';
                default: return 'HttpError';
            }
        }
        if (err.code) {
            if (err.code.includes('TIMEOUT'))
                return 'Timeout';
            if (err.code.includes('CONNECTION'))
                return 'Connection';
        }
        return 'Unknown';
    }
}
//# sourceMappingURL=error-handler.js.map