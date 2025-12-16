import { Logger } from './logger.js';
export class ErrorHandler {
    private static logger = new Logger('ErrorHandler');
    static handle(error: unknown): void {
        this.logger.error('Unhandled error:', error);
    }
}