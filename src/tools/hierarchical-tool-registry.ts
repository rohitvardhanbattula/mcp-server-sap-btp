import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SAPClient } from "../services/sap-client.js";
import { Logger } from "../utils/logger.js";
import { z } from "zod";

export class HierarchicalSAPToolRegistry {
    constructor(private mcpServer: McpServer, private sapClient: SAPClient, private logger: Logger, private discoveredServices: any[]) {}
    
    async registerDiscoveryTools() {
        this.mcpServer.tool("discover-sap-data", { query: z.string().optional() }, async () => ({ content: [{ type: "text", text: "Discovery" }] }));
        this.mcpServer.tool("get-entity-metadata", { serviceId: z.string(), entityName: z.string() }, async () => ({ content: [{ type: "text", text: "Metadata" }] }));
        this.mcpServer.tool("execute-sap-operation", { serviceId: z.string(), entityName: z.string(), operation: z.string() }, async () => ({ content: [{ type: "text", text: "Execution" }] }));
    }
    registerServiceMetadataResources() {}
    setUserToken(token?: string) { this.sapClient.setUserToken(token); }
}