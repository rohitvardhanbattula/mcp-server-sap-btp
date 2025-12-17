import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ODataService } from './types/sap-types.js';
export declare class MCPServer {
    private mcpServer;
    private toolRegistry;
    private logger;
    constructor(discoveredServices: ODataService[]);
    initialize(): Promise<void>;
    getServer(): McpServer;
    setUserToken(token?: string): void;
}
export declare function createMCPServer(services: ODataService[], token?: string): Promise<MCPServer>;
//# sourceMappingURL=mcp-server.d.ts.map