import xssec from '@sap/xssec';
import xsenv from '@sap/xsenv';
import { Logger } from '../utils/logger.js';

export class AuthService {
    private xsuaaCredentials: any;
    constructor(private logger: Logger, config: any) {
        try {
            xsenv.loadEnv();
            this.xsuaaCredentials = xsenv.getServices({ xsuaa: { label: 'xsuaa' } }).xsuaa;
        } catch { this.logger.warn('XSUAA not configured'); }
    }

    authenticateJWT() {
        return async (req: any, res: any, next: any) => {
            if (!this.xsuaaCredentials) return next();
            const token = req.headers.authorization?.substring(7);
            if (!token) return res.status(401).json({ error: 'Missing token' });
            
            xssec.createSecurityContext(token, this.xsuaaCredentials, (err: any, context: any) => {
                if (err) return res.status(401).json({ error: 'Invalid token' });
                req.authInfo = context;
                req.jwtToken = token;
                next();
            });
        };
    }

    optionalAuthenticateJWT() {
        return (req: any, res: any, next: any) => next(); // Simplified
    }
}