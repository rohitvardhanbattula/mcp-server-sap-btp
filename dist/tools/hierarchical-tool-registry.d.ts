import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SAPClient } from "../services/sap-client.js";
import { Logger } from "../utils/logger.js";
import { ODataService } from "../types/sap-types.js";
/**
 * Hierarchical Tool Registry - Solves the "tool explosion" problem with 3-level architecture
 *
 * Instead of registering hundreds of CRUD tools upfront (5 ops × 40+ entities × services),
 * this registry uses a 3-level progressive discovery approach optimized for LLM token efficiency:
 *
 * Level 1: discover-sap-data - Lightweight search returning minimal service/entity list
 * Returns: serviceId, serviceName, entityName only (for LLM decision making)
 * Fallback: If no matches, returns ALL services with entities (minimal fields)
 *
 * Level 2: get-entity-metadata - Full schema details for selected service/entity
 * Returns: Complete entity schema with properties, types, keys, capabilities
 * Purpose: Provides LLM with all details needed to construct proper operation
 *
 * Level 3: execute-sap-operation - Execute CRUD operation with authenticated user context
 * Uses: Metadata from Level 2 to perform actual data operations
 *
 * This reduces AI assistant context from 200+ tools to 3, solving token overflow
 * and dramatically improving tool selection for AI assistants like Claude and Microsoft Copilot.
 */
export declare class HierarchicalSAPToolRegistry {
    private mcpServer;
    private sapClient;
    private logger;
    private discoveredServices;
    private serviceCategories;
    private userToken?;
    constructor(mcpServer: McpServer, sapClient: SAPClient, logger: Logger, discoveredServices: ODataService[]);
    /**
     * Set the user's JWT token for authenticated operations
     */
    setUserToken(token?: string): void;
    /**
     * Register the 3-level progressive discovery tools instead of 200+ individual CRUD tools
     */
    registerDiscoveryTools(): Promise<void>;
    /**
     * Categorize services for better discovery using intelligent pattern matching
     */
    private categorizeServices;
    /**
     * Level 1: Lightweight discovery - returns minimal service/entity list
     * Optimized for LLM token efficiency with only essential fields
     *
     * Returns:
     * - If query matches: Relevant services/entities with minimal fields
     * - If no matches: ALL services with entities (minimal fields)
     * - Fields returned: serviceId, serviceName, entityName, entityCount, categories
     */
    private discoverServicesAndEntitiesMinimal;
    /**
     * Level 2: Get full entity metadata for a specific service and entity
     * Returns complete schema with all properties, types, keys, and capabilities
     */
    private getEntityMetadataFull;
    /**
     * Perform minimal search across services and entities
     * Returns only essential fields: serviceId, serviceName, entityName
     * Optimized for LLM token efficiency
     */
    private performMinimalSearch;
    /**
     * Helper method to check if text matches query (supports multi-word queries)
     * Returns true if:
     * - Single word: text contains the word
     * - Multiple words separated: text contains ALL words
     */
    private matchesQuery;
    /**
     * Helper method to perform search across services and entities for a given category
     * Extracts common search logic to avoid duplication in fallback scenario
     * Supports multi-word queries with intelligent matching
     */
    private performCategorySearch;
    /**
     * Intelligent search across services, entities, and properties
     * Always returns full schemas for maximum efficiency (avoids second requests)
     * Multi-word query support with intelligent 3-level fallback:
     * 1. Try combined words with requested category
     * 2. If no results: try separated words with requested category
     * 3. If still no results with specific category: try with 'all' categories
     * 4. If still no results: try separated words with 'all' categories
     */
    private searchServicesAndEntities;
    /**
     * Legacy search services method (kept for backward compatibility)
     */
    private searchServices;
    /**
     * Discover entities within a service with full schemas
     * Always returns complete property details for maximum efficiency
     *
     * NOTE: This method is kept for potential future use but is NOT exposed via the tool interface.
     * The query-based search already returns full schemas, making this redundant.
     */
    private discoverServiceEntities;
    /**
     * Get detailed entity schema information
     *
     * NOTE: This method is kept for potential future use but is NOT exposed via the tool interface.
     * The query-based search already returns full schemas, making this redundant.
     */
    private getEntitySchema;
    /**
     * Execute CRUD operations on entities with comprehensive error handling
     */
    private executeEntityOperation;
    /**
     * Build key value for entity operations (handles single and composite keys)
     */
    private buildKeyValue;
    /**
     * Register service metadata resources (unchanged from original)
     */
    registerServiceMetadataResources(): void;
    /**
     * Generate comprehensive system instructions for AI assistants
     */
    private getSystemInstructions;
}
//# sourceMappingURL=hierarchical-tool-registry.d.ts.map