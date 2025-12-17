import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { HierarchicalSAPToolRegistry } from './tools/hierarchical-tool-registry.js';
import { SAPClient } from './services/sap-client.js';
import { Logger } from './utils/logger.js';
import { Config } from './utils/config.js';
import { DestinationService } from './services/destination-service.js';
import { SAPDiscoveryService } from './services/sap-discovery.js';
export class MCPServer {
    mcpServer;
    toolRegistry;
    logger;
    constructor(discoveredServices) {
        this.logger = new Logger('mcp-server');
        const config = new Config();
        const destService = new DestinationService(this.logger, config);
        const sapClient = new SAPClient(destService, this.logger);
        this.mcpServer = new McpServer({ name: "btp-sap-odata-to-mcp-server", version: "1.0.0" });
        this.toolRegistry = new HierarchicalSAPToolRegistry(this.mcpServer, sapClient, this.logger, discoveredServices);
    }
    async initialize() {
        await this.toolRegistry.registerDiscoveryTools();
    }
    getServer() { return this.mcpServer; }
    setUserToken(token) { this.toolRegistry.setUserToken(token); }
}
export async function createMCPServer(services, token) {
    const server = new MCPServer(services);
    if (token)
        server.setUserToken(token);
    await server.initialize();
    return server;
}
// -------------------------------------------------------------------------
// STANDALONE EXECUTION LOGIC (For 'npm run start:stdio' and Inspector)
// -------------------------------------------------------------------------
import { fileURLToPath } from 'url';
// Check if this file is being run directly (not imported)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const logger = new Logger('mcp-server-stdio');
    const config = new Config();
    const destinationService = new DestinationService(logger, config);
    const sapClient = new SAPClient(destinationService, logger);
    const sapDiscoveryService = new SAPDiscoveryService(sapClient, logger, config);
    logger.info('🚀 Starting MCP Server in STDIO mode...');
    // In STDIO mode, we might not have a user token initially, 
    // or we might strictly rely on technical users for discovery.
    // Discovery is required before starting the server.
    sapDiscoveryService.discoverAllServices()
        .then(async (services) => {
        const server = new MCPServer(services);
        await server.initialize();
        const transport = new StdioServerTransport();
        await server.getServer().connect(transport);
        logger.info('✅ MCP Server connected via STDIO');
    })
        .catch((err) => {
        logger.error('❌ Failed to start STDIO server:', err);
        process.exit(1);
    });
}
//# sourceMappingURL=mcp-server.js.map