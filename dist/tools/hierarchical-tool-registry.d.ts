import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SAPClient } from "../services/sap-client.js";
import { Logger } from "../utils/logger.js";
import { ODataService } from "../types/sap-types.js";
export declare class HierarchicalSAPToolRegistry {
    private mcpServer;
    private sapClient;
    private logger;
    private discoveredServices;
    private serviceCategories;
    private userToken?;
    constructor(mcpServer: McpServer, sapClient: SAPClient, logger: Logger, discoveredServices: ODataService[]);
    setUserToken(token?: string): void;
    registerDiscoveryTools(): Promise<void>;
    private categorizeServices;
    private discoverServicesAndEntitiesMinimal;
    private getEntityMetadataFull;
    private performMinimalSearch;
    private executeEntityOperation;
    private buildKeyValue;
    private formatKeyValue;
    private validateAndCleanData;
    registerServiceMetadataResources(): void;
    private getSystemInstructions;
}
//# sourceMappingURL=hierarchical-tool-registry.d.ts.map