import { getDestination, HttpDestination } from '@sap-cloud-sdk/connectivity';
import { Logger } from '../utils/logger.js';
import { Config } from '../utils/config.js';

export class DestinationService {
    constructor(private logger: Logger, private config: Config) {}

    async initialize() { this.logger.info('Destination service initialized'); }

    async getDiscoveryDestination(): Promise<HttpDestination> {
        const name = this.config.get('sap.discoveryDestinationName', 'SAP_SYSTEM');
        return this.getDestination(name);
    }

    async getExecutionDestination(jwtToken?: string): Promise<HttpDestination> {
        const name = this.config.get('sap.executionDestinationName', 'SAP_SYSTEM');
        return this.getDestination(name, jwtToken);
    }

    private async getDestination(name: string, jwt?: string): Promise<HttpDestination> {
        const dest = await getDestination({ destinationName: name, jwt });
        if (!dest) throw new Error(`Destination ${name} not found`);
        return dest as HttpDestination;
    }
}