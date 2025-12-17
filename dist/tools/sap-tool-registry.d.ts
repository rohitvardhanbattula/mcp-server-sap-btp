import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SAPClient } from "../services/sap-client.js";
import { Logger } from "../utils/logger.js";
import { ODataService } from "../types/sap-types.js";
export declare class SAPToolRegistry {
    private mcpServer;
    private sapClient;
    private logger;
    private discoveredServices;
    private toolNameMapping;
    private usedShortNames;
    constructor(mcpServer: McpServer, sapClient: SAPClient, logger: Logger, discoveredServices: ODataService[]);
    registerServiceMetadataResources(): void;
    registerServiceCRUDTools(): Promise<void>;
    private registerReadEntitySetTool;
    private registerReadEntityTool;
    private registerCreateEntityTool;
    private registerUpdateEntityTool;
    private registerDeleteEntityTool;
    private buildKeyValue;
    private getZodSchemaForODataType;
    private generateShortToolName;
    private abbreviateServiceId;
    private abbreviateEntityName;
    private getShortHash;
    /**
     * Clean query options by removing null and undefined values
     * @param args Raw arguments from MCP tool call
     * @returns Clean query options object
     */
    static buildQueryOptions(args: Record<string, unknown>): Record<string, string | number>;
}
//# sourceMappingURL=sap-tool-registry.d.ts.map