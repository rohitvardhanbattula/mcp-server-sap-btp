import { executeHttpRequest } from '@sap-cloud-sdk/http-client';
import { HttpDestination } from '@sap-cloud-sdk/connectivity';
import { DestinationService } from './destination-service.js';
import { Logger } from '../utils/logger.js';
import { Config } from '../utils/config.js';

export class SAPClient {
    private discoveryDestination: HttpDestination | null = null;
    private config: Config;
    private currentUserToken?: string;

    constructor(
        private destinationService: DestinationService,
        private logger: Logger
    ) {
        this.config = new Config();
    }

    setUserToken(token?: string) {
        this.currentUserToken = token;
        this.logger.debug(`User token ${token ? 'set' : 'cleared'} for SAP client`);
    }

    async getDiscoveryDestination(): Promise<HttpDestination> {
        if (!this.discoveryDestination) {
            this.discoveryDestination = await this.destinationService.getDiscoveryDestination();
        }
        return this.discoveryDestination;
    }

    async getExecutionDestination(): Promise<HttpDestination> {
        return await this.destinationService.getExecutionDestination(this.currentUserToken);
    }

    async getDestination(): Promise<HttpDestination> {
        return this.getDiscoveryDestination();
    }

    async executeRequest(options: {
        url: string;
        method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
        data?: unknown;
        headers?: Record<string, string>;
        isDiscovery?: boolean;
    }) {
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

            const response = await executeHttpRequest(destination as HttpDestination, requestOptions);

            this.logger.debug(`Request completed successfully with status: ${response.status}`);
            return response;

        } catch (error) {
            this.logger.error(`Request failed:`, error);
            throw this.handleError(error);
        }
    }

    async readEntitySet(
        servicePath: string,
        entitySet: string,
        queryOptions?: {
            $filter?: string;
            $select?: string;
            $expand?: string;
            $orderby?: string;
            $top?: number;
            $skip?: number;
        },
        isDiscovery = false,
        pathParameters?: string,
        navigationProperty?: string
    ) {
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

    async readEntity(servicePath: string, entitySet: string, key: string, isDiscovery = false) {
        const url = `${servicePath}${entitySet}(${key})`;

        return this.executeRequest({
            method: 'GET',
            url,
            isDiscovery
        });
    }

    async createEntity(servicePath: string, entitySet: string, data: unknown) {
        const url = `${servicePath}${entitySet}`;

        const response = await this.executeRequest({
            method: 'POST',
            url,
            data
        });

        const createdEntity = typeof data === 'object' && data !== null 
            ? { ...data as Record<string, unknown> }
            : {};
        
        if (response.headers && response.headers['location']) {
            const locationHeader = response.headers['location'];
            const match = locationHeader.match(/\(([^)]+)\)$/);
            if (match) {
                (createdEntity as Record<string, unknown>).__key = match[1];
            }
        }

        return {
            ...response,
            data: createdEntity
        };
    }

    async updateEntity(servicePath: string, entitySet: string, key: string, data: unknown) {
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

    async deleteEntity(servicePath: string, entitySet: string, key: string) {
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

    private sanitizeQueryParam(value: string): string {
        return value
            .replace(/'/g, "''")
            .replace(/\n/g, ' ')
            .replace(/\r/g, ' ');
    }

    private cleanUpdateData(data: unknown): Record<string, unknown> {
        if (!data || typeof data !== 'object') {
            return {};
        }

        const cleaned: Record<string, unknown> = {};
        const reserved = ['__metadata', '__deferred', '__key'];

        for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
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

    private handleError(error: unknown): Error {
        if (
            typeof error === 'object' &&
            error !== null &&
            'rootCause' in error &&
            (error as { rootCause?: { response?: { status: number; data?: { error?: { message?: string } }; statusText?: string } } }).rootCause?.response
        ) {
            const response = (error as { rootCause: { response: { status: number; data?: { error?: { message?: string } }; statusText?: string } } }).rootCause.response;
            const message = response.data?.error?.message || response.statusText || 'Unknown error';
            return new Error(`SAP API Error ${response.status}: ${message}`);
        }
        return error instanceof Error ? error : new Error(String(error));
    }
}