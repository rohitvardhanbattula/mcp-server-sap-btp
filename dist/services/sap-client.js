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
    setUserToken(token) {
        this.currentUserToken = token;
        this.logger.debug(`User token ${token ? 'set' : 'cleared'} for SAP client`);
    }
    async getDiscoveryDestination() {
        if (!this.discoveryDestination) {
            this.discoveryDestination = await this.destinationService.getDiscoveryDestination();
        }
        return this.discoveryDestination;
    }
    async getExecutionDestination() {
        return await this.destinationService.getExecutionDestination(this.currentUserToken);
    }
    async getDestination() {
        return this.getDiscoveryDestination();
    }
    async executeRequest(options) {
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
            this.logger.debug(`Request completed successfully with status: ${response.status}`);
            return response;
        }
        catch (error) {
            this.logger.error(`Request failed:`, error);
            throw this.handleError(error);
        }
    }
    async readEntitySet(servicePath, entitySet, queryOptions, isDiscovery = false, pathParameters, navigationProperty) {
        let url = `${servicePath}${entitySet}`;
        if (pathParameters) {
            url += `(${pathParameters})`;
        }
        if (navigationProperty) {
            url += `/${navigationProperty}`;
        }
        if (queryOptions) {
            const params = new URLSearchParams();
            Object.entries(queryOptions).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.set(key, this.sanitizeQueryParam(String(value)));
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
        const url = `${servicePath}${entitySet}(${key})`;
        return this.executeRequest({
            method: 'GET',
            url,
            isDiscovery
        });
    }
    async createEntity(servicePath, entitySet, data) {
        const url = `${servicePath}${entitySet}`;
        const response = await this.executeRequest({
            method: 'POST',
            url,
            data
        });
        const createdEntity = typeof data === 'object' && data !== null
            ? { ...data }
            : {};
        if (response.headers && response.headers['location']) {
            const locationHeader = response.headers['location'];
            const match = locationHeader.match(/\(([^)]+)\)$/);
            if (match) {
                createdEntity.__key = match[1];
            }
        }
        return {
            ...response,
            data: createdEntity
        };
    }
    async updateEntity(servicePath, entitySet, key, data) {
        const url = `${servicePath}${entitySet}(${key})`;
        const cleanData = this.cleanUpdateData(data);
        const response = await this.executeRequest({
            method: 'PATCH',
            url,
            data: cleanData
        });
        return {
            ...response,
            data: {
                message: `Entity updated successfully with key: ${key}`,
                success: true,
                key: key,
                updatedFields: Object.keys(cleanData)
            }
        };
    }
    async deleteEntity(servicePath, entitySet, key) {
        const url = `${servicePath}${entitySet}(${key})`;
        await this.executeRequest({
            method: 'DELETE',
            url
        });
        return {
            data: {
                message: `Entity deleted successfully with key: ${key}`,
                success: true,
                key: key
            }
        };
    }
    sanitizeQueryParam(value) {
        return value
            .replace(/'/g, "''")
            .replace(/\n/g, ' ')
            .replace(/\r/g, ' ');
    }
    cleanUpdateData(data) {
        if (!data || typeof data !== 'object') {
            return {};
        }
        const cleaned = {};
        const reserved = ['__metadata', '__deferred', '__key'];
        for (const [key, value] of Object.entries(data)) {
            if (reserved.includes(key)) {
                continue;
            }
            if (value === undefined) {
                continue;
            }
            cleaned[key] = value;
        }
        return cleaned;
    }
    handleError(error) {
        if (typeof error === 'object' &&
            error !== null &&
            'rootCause' in error &&
            error.rootCause?.response) {
            const response = error.rootCause.response;
            const message = response.data?.error?.message || response.statusText || 'Unknown error';
            return new Error(`SAP API Error ${response.status}: ${message}`);
        }
        return error instanceof Error ? error : new Error(String(error));
    }
}
//# sourceMappingURL=sap-client.js.map