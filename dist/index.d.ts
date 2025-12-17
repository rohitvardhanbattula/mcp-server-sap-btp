import express from 'express';
import 'dotenv/config';
declare global {
    var mcpProxyStates: Map<string, {
        mcpRedirectUri: string;
        state: string;
        mcpCodeChallenge?: string;
        mcpCodeChallengeMethod?: string;
        timestamp: number;
    }>;
}
/**
 * Create Express application
 */
export declare function createApp(): express.Application;
/**
 * Start the server
 */
export declare function startServer(port?: number): Promise<void>;
//# sourceMappingURL=index.d.ts.map