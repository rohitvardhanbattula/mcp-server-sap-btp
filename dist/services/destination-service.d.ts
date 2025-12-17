import { HttpDestination } from '@sap-cloud-sdk/connectivity';
import { Logger } from '../utils/logger.js';
import { Config } from '../utils/config.js';
export declare class DestinationService {
    private logger;
    private config;
    private vcapServices;
    constructor(logger: Logger, config?: Config);
    initialize(): Promise<void>;
    /**
     * Get destination for API discovery (uses technical user)
     */
    getDiscoveryDestination(): Promise<HttpDestination>;
    /**
     * Get destination for API execution (uses JWT token if provided)
     */
    getExecutionDestination(jwtToken?: string): Promise<HttpDestination>;
    /**
     * Legacy method for backward compatibility
     */
    getSAPDestination(): Promise<HttpDestination>;
    /**
     * Internal method to get destination with optional JWT
     */
    private getDestination;
    private getJWT;
    getDestinationCredentials(): unknown;
    getConnectivityCredentials(): unknown;
    getXSUAACredentials(): unknown;
}
//# sourceMappingURL=destination-service.d.ts.map