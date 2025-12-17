import { SAPClient } from './sap-client.js';
import { Logger } from '../utils/logger.js';
import { Config } from '../utils/config.js';
import { ODataService } from '../types/sap-types.js';
export declare class SAPDiscoveryService {
    private sapClient;
    private logger;
    private config;
    private catalogEndpoints;
    constructor(sapClient: SAPClient, logger: Logger, config: Config);
    discoverAllServices(): Promise<ODataService[]>;
    /**
     * Filter services based on configuration patterns
     */
    private filterServices;
    private discoverV4Services;
    private discoverV2Services;
    private parseV4CatalogResponse;
    private parseV2CatalogResponse;
    private getServiceMetadata;
    private parseMetadata;
    private extractEntityTypes;
    private extractEntitySets;
    private extractNamespace;
}
//# sourceMappingURL=sap-discovery.d.ts.map