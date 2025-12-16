import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SAPClient } from "../services/sap-client.js";
import { Logger } from "../utils/logger.js";
export class SAPToolRegistry {
    constructor(private mcpServer: McpServer, private sapClient: SAPClient, private logger: Logger, private discoveredServices: any[]) {}
    registerServiceMetadataResources() {}
    async registerServiceCRUDTools() {}
}