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
    setUserToken(token?: string): void;
    getDiscoveryDestination(): Promise<HttpDestination>;
    getExecutionDestination(): Promise<HttpDestination>;
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
    }, isDiscovery?: boolean, pathParameters?: string, navigationProperty?: string): Promise<import("@sap-cloud-sdk/http-client").HttpResponse>;
    readEntity(servicePath: string, entitySet: string, key: string, isDiscovery?: boolean): Promise<import("@sap-cloud-sdk/http-client").HttpResponse>;
    createEntity(servicePath: string, entitySet: string, data: unknown): Promise<{
        data: {
            [x: string]: unknown;
        };
        status: number;
        headers: any;
        request: any;
    }>;
    updateEntity(servicePath: string, entitySet: string, key: string, data: unknown): Promise<{
        data: {
            message: string;
            success: boolean;
            key: string;
            updatedFields: string[];
        };
        status: number;
        headers: any;
        request: any;
    }>;
    deleteEntity(servicePath: string, entitySet: string, key: string): Promise<{
        data: {
            message: string;
            success: boolean;
            key: string;
        };
    }>;
    private sanitizeQueryParam;
    private cleanUpdateData;
    private handleError;
}
//# sourceMappingURL=sap-client.d.ts.map