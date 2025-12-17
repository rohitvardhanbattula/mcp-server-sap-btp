import { executeHttpRequest } from '@sap-cloud-sdk/http-client';
import { Config } from '../utils/config.js';
export class SAPClient {
    destinationService;
    logger;
    discoveryDestination = null;
    config;
    currentUserToken;
    constructor(destinationService, logger) {
        this.destinationService = destinationService;
        this.logger = logger;
        this.config = new Config();
    }
    /**
     * Set the current user's JWT token for subsequent operations
     */
    setUserToken(token) {
        this.currentUserToken = token;
        this.logger.debug(`User token ${token ? 'set' : 'cleared'} for SAP client`);
    }
    /**
     * Get destination for discovery operations (technical user)
     */
    async getDiscoveryDestination() {
        if (!this.discoveryDestination) {
            this.discoveryDestination = await this.destinationService.getDiscoveryDestination();
        }
        return this.discoveryDestination;
    }
    /**
     * Get destination for execution operations (with JWT if available)
     */
    async getExecutionDestination() {
        return await this.destinationService.getExecutionDestination(this.currentUserToken);
    }
    /**
     * Legacy method - defaults to discovery destination
     */
    async getDestination() {
        return this.getDiscoveryDestination();
    }
    async executeRequest(options) {
        // Use discovery destination for metadata/discovery calls, execution destination for data operations
        const destination = options.isDiscovery
            ? await this.getDiscoveryDestination()
            : await this.getExecutionDestination();
        const requestOptions = {
            method: options.method,
            url: options.url,
            data: options.data,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            }
        };
        try {
            this.logger.debug(`Executing ${options.method} request to ${options.url}`);
            if (!destination.url) {
                throw new Error('Destination URL is not configured');
            }
            const response = await executeHttpRequest(destination, requestOptions);
            this.logger.debug(`Request completed successfully`);
            return response;
        }
        catch (error) {
            this.logger.error(`Request failed:`, error);
            throw this.handleError(error);
        }
    }
    async readEntitySet(servicePath, entitySet, queryOptions, isDiscovery = false) {
        let url = `${servicePath}${entitySet}`;
        if (queryOptions) {
            const params = new URLSearchParams();
            Object.entries(queryOptions).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.set(key, String(value));
                }
            });
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
        }
        return this.executeRequest({
            method: 'GET',
            url,
            isDiscovery
        });
    }
    async readEntity(servicePath, entitySet, key, isDiscovery = false) {
        const url = `${servicePath}${entitySet}('${key}')`;
        return this.executeRequest({
            method: 'GET',
            url,
            isDiscovery
        });
    }
    async createEntity(servicePath, entitySet, data) {
        const url = `${servicePath}${entitySet}`;
        return this.executeRequest({
            method: 'POST',
            url,
            data
        });
    }
    async updateEntity(servicePath, entitySet, key, data) {
        const url = `${servicePath}${entitySet}('${key}')`;
        return this.executeRequest({
            method: 'PATCH',
            url,
            data
        });
    }
    async deleteEntity(servicePath, entitySet, key) {
        const url = `${servicePath}${entitySet}('${key}')`;
        return this.executeRequest({
            method: 'DELETE',
            url
        });
    }
    handleError(error) {
        if (typeof error === 'object' &&
            error !== null &&
            'rootCause' in error &&
            error.rootCause?.response) {
            const response = error.rootCause.response;
            return new Error(`SAP API Error ${response.status}: ${response.data?.error?.message || response.statusText}`);
        }
        return error instanceof Error ? error : new Error(String(error));
    }
}
//# sourceMappingURL=sap-client.js.map