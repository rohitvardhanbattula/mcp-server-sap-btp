import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { HierarchicalSAPToolRegistry } from './tools/hierarchical-tool-registry.js';
import { SAPClient } from './services/sap-client.js';
import { Logger } from './utils/logger.js';
import { Config } from './utils/config.js';
import { DestinationService } from './services/destination-service.js';

export class MCPServer {
    private mcpServer: McpServer;
    private toolRegistry: HierarchicalSAPToolRegistry;

    constructor(discoveredServices: any[]) {
        const logger = new Logger('mcp-server');
        const config = new Config();
        const destService = new DestinationService(logger, config);
        const sapClient = new SAPClient(destService, logger);

        this.mcpServer = new McpServer({ name: "btp-sap-odata-to-mcp-server", version: "1.0.0" });
        this.toolRegistry = new HierarchicalSAPToolRegistry(this.mcpServer, sapClient, logger, discoveredServices);
    }

    async initialize() {
        await this.toolRegistry.registerDiscoveryTools();
    }

    getServer() { return this.mcpServer; }
    setUserToken(token?: string) { this.toolRegistry.setUserToken(token); }
}

export async function createMCPServer(services: any[], token?: string) {
    const server = new MCPServer(services);
    if (token) server.setUserToken(token);
    await server.initialize();
    return server;
}