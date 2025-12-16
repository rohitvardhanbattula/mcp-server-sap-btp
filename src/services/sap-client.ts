import { executeHttpRequest } from '@sap-cloud-sdk/http-client';
import { DestinationService } from './destination-service.js';
import { Logger } from '../utils/logger.js';

export class SAPClient {
    private userToken?: string;
    constructor(private destinationService: DestinationService, private logger: Logger) {}

    setUserToken(token?: string) { this.userToken = token; }

    async executeRequest(options: { url: string; method: string; data?: any; isDiscovery?: boolean }) {
        const destination = options.isDiscovery 
            ? await this.destinationService.getDiscoveryDestination()
            : await this.destinationService.getExecutionDestination(this.userToken);
            
        return executeHttpRequest(destination, {
            method: options.method as any,
            url: options.url,
            data: options.data,
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        });
    }

    async readEntitySet(url: string, set: string, params: any) {
        // Simple append for params, real implementation handles ? & logic
        const query = new URLSearchParams(params).toString();
        return this.executeRequest({ method: 'GET', url: `${url}${set}?${query}` });
    }
    
    // Stub methods for other operations
    async readEntity(url: string, set: string, key: string) {
        return this.executeRequest({ method: 'GET', url: `${url}${set}('${key}')` });
    }
    async createEntity(url: string, set: string, data: any) {
        return this.executeRequest({ method: 'POST', url: `${url}${set}`, data });
    }
    async updateEntity(url: string, set: string, key: string, data: any) {
        return this.executeRequest({ method: 'PATCH', url: `${url}${set}('${key}')`, data });
    }
    async deleteEntity(url: string, set: string, key: string) {
        return this.executeRequest({ method: 'DELETE', url: `${url}${set}('${key}')` });
    }
}