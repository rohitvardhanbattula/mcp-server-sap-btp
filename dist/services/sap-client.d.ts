import { HttpDestination } from '@sap-cloud-sdk/connectivity';
import { DestinationService } from './destination-service.js';
import { Logger } from '../utils/logger.js';
export declare class SAPClient {
    private destinationService;
    private logger;
    private discoveryDestination;
    private config;
    private currentUserToken?;
    constructor(destinationService: DestinationService, logger: Logger);
    /**
     * Set the current user's JWT token for subsequent operations
     */
    setUserToken(token?: string): void;
    /**
     * Get destination for discovery operations (technical user)
     */
    getDiscoveryDestination(): Promise<HttpDestination>;
    /**
     * Get destination for execution operations (with JWT if available)
     */
    getExecutionDestination(): Promise<HttpDestination>;
    /**
     * Legacy method - defaults to discovery destination
     */
    getDestination(): Promise<HttpDestination>;
    executeRequest(options: {
        url: string;
        method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
        data?: unknown;
        headers?: Record<string, string>;
        isDiscovery?: boolean;
    }): Promise<import("@sap-cloud-sdk/http-client").HttpResponse>;
    readEntitySet(servicePath: string, entitySet: string, queryOptions?: {
        $filter?: string;
        $select?: string;
        $expand?: string;
        $orderby?: string;
        $top?: number;
        $skip?: number;
    }, isDiscovery?: boolean): Promise<import("@sap-cloud-sdk/http-client").HttpResponse>;
    readEntity(servicePath: string, entitySet: string, key: string, isDiscovery?: boolean): Promise<import("@sap-cloud-sdk/http-client").HttpResponse>;
    createEntity(servicePath: string, entitySet: string, data: unknown): Promise<import("@sap-cloud-sdk/http-client").HttpResponse>;
    updateEntity(servicePath: string, entitySet: string, key: string, data: unknown): Promise<import("@sap-cloud-sdk/http-client").HttpResponse>;
    deleteEntity(servicePath: string, entitySet: string, key: string): Promise<import("@sap-cloud-sdk/http-client").HttpResponse>;
    private handleError;
}
//# sourceMappingURL=sap-client.d.ts.map