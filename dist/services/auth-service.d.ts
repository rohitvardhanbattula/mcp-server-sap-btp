import xssec from '@sap/xssec';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger.js';
import { Config } from '../utils/config.js';
export interface AuthRequest extends Request {
    authInfo?: xssec.SecurityContext;
    jwtToken?: string;
}
export declare class AuthService {
    private xsuaaCredentials;
    private logger;
    private config;
    constructor(logger?: Logger, config?: Config);
    private initializeXSUAA;
    /**
     * Generate OAuth authorization URL for user login
     */
    getAuthorizationUrl(state?: string, requestUrl?: string): string;
    /**
     * Exchange authorization code for access token
     */
    exchangeCodeForToken(code: string, redirectUri?: string): Promise<{
        access_token: string;
        refresh_token?: string;
        expires_in: number;
    }>;
    /**
     * Refresh an access token using a refresh token
     */
    refreshAccessToken(refreshToken: string): Promise<{
        access_token: string;
        refresh_token?: string;
        expires_in: number;
        token_type?: string;
    }>;
    /**
     * Validate JWT token and extract user information
     */
    validateToken(token: string): Promise<xssec.SecurityContext>;
    /**
     * Express middleware for JWT authentication
     * Extracts and validates JWT token from Authorization header
     */
    authenticateJWT(): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    /**
     * Express middleware for optional JWT authentication
     * Validates token if present but doesn't require it
     */
    optionalAuthenticateJWT(): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Check if a user has a specific scope
     */
    hasScope(securityContext: xssec.SecurityContext, scope: string): boolean;
    /**
     * Get user information from security context
     */
    getUserInfo(securityContext: xssec.SecurityContext): {
        username: string;
        email: string;
        givenName: string;
        familyName: string;
        scopes: string[];
    };
    getRedirectUri(requestUrl?: string): string;
    /**
     * Check if XSUAA is configured
     */
    isConfigured(): boolean;
    /**
     * Get XSUAA discovery metadata for OAuth endpoints
     */
    getXSUAADiscoveryMetadata(): {
        issuer: string;
        clientId: string;
        xsappname: string;
        identityZone: string;
        tenantId: string;
        tenantMode: string;
        endpoints: {
            authorization: string;
            token: string;
            userinfo: string;
            jwks: string;
            introspection: string;
            revocation: string;
        };
        verificationKey: string;
    } | null;
    /**
     * Get application-specific scopes from xs-security.json configuration
     */
    getApplicationScopes(): string[];
    /**
     * Get XSUAA service information (safe for public exposure)
     */
    getServiceInfo(): {
        url: string;
        clientId: string;
        xsappname: string;
        identityZone: string;
        tenantId: string;
        tenantMode: string;
        configured: boolean;
    } | null;
    /**
     * Get XSUAA client credentials for OAuth client registration (sensitive)
     * This method should only be used internally for client registration
     */
    getClientCredentials(): {
        client_id: string;
        client_secret: string;
        url: string;
        identityZone: string;
        tenantMode: string;
    } | null;
}
//# sourceMappingURL=auth-service.d.ts.map