import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
export class HierarchicalSAPToolRegistry {
    mcpServer;
    sapClient;
    logger;
    discoveredServices;
    serviceCategories = new Map();
    userToken;
    constructor(mcpServer, sapClient, logger, discoveredServices) {
        this.mcpServer = mcpServer;
        this.sapClient = sapClient;
        this.logger = logger;
        this.discoveredServices = discoveredServices;
        this.categorizeServices();
    }
    setUserToken(token) {
        this.userToken = token;
        this.sapClient.setUserToken(token);
        this.logger.debug(`User token ${token ? 'set' : 'cleared'} for tool registry`);
    }
    async registerDiscoveryTools() {
        this.logger.info(`Registering 3-level intelligent discovery tools for ${this.discoveredServices.length} services`);
        this.mcpServer.registerTool("discover-sap-data", {
            title: "Level 1: Discover SAP Services and Entities",
            description: "Search for SAP services and entities. Returns MINIMAL data optimized for LLM decision making.",
            inputSchema: {
                query: z.string().optional().describe("Search term to find services or entities"),
                category: z.string().optional().describe("Service category filter: business-partner, sales, finance, procurement, hr, logistics, all"),
                limit: z.number().min(1).max(50).optional().describe("Maximum number of results. Default: 20")
            }
        }, async (args) => {
            return this.discoverServicesAndEntitiesMinimal(args);
        });
        this.mcpServer.registerTool("get-entity-metadata", {
            title: "Level 2: Get Entity Metadata",
            description: "Get complete schema details for a specific entity with all properties, types, and capabilities.",
            inputSchema: {
                serviceId: z.string().describe("Service ID from discover-sap-data results"),
                entityName: z.string().describe("Entity name from discover-sap-data results")
            }
        }, async (args) => {
            return this.getEntityMetadataFull(args);
        });
        this.mcpServer.registerTool("execute-sap-operation", {
            title: "Level 3: Execute SAP Operation",
            description: "Perform CRUD operations (read, read-single, create, update, delete) on SAP entities using authenticated user context.",
            inputSchema: {
                serviceId: z.string().describe("The SAP service ID from discover-sap-data"),
                entityName: z.string().describe("The entity name from discover-sap-data"),
                operation: z.string().describe("Operation: read, read-single, create, update, delete"),
                parameters: z.record(z.any()).optional().describe("Operation parameters: entity keys for read-single/update/delete, entity data for create/update"),
                filterString: z.string().optional().describe("OData $filter query. Example: \"Status eq 'Active' and Amount gt 1000\""),
                selectString: z.string().optional().describe("OData $select comma-separated properties. Example: \"Name,Status,CreatedDate\""),
                expandString: z.string().optional().describe("OData $expand navigation properties. Example: \"Customer,Items\""),
                orderbyString: z.string().optional().describe("OData $orderby. Example: \"Name desc, CreatedDate asc\""),
                topNumber: z.number().optional().describe("OData $top - number of records to return"),
                skipNumber: z.number().optional().describe("OData $skip - number of records to skip for pagination"),
                useUserToken: z.boolean().optional().describe("Use authenticated user token for operation. Default: true")
            }
        }, async (args) => {
            return this.executeEntityOperation(args);
        });
        this.logger.info("Successfully registered 3-level intelligent discovery tools");
    }
    categorizeServices() {
        for (const service of this.discoveredServices) {
            const categories = [];
            const id = service.id.toLowerCase();
            const title = service.title.toLowerCase();
            const desc = service.description.toLowerCase();
            if (id.includes('business_partner') || id.includes('bp_') || id.includes('customer') || id.includes('supplier') ||
                title.includes('business partner') || title.includes('customer') || title.includes('supplier')) {
                categories.push('business-partner');
            }
            if (id.includes('sales') || id.includes('order') || id.includes('quotation') || id.includes('opportunity') ||
                title.includes('sales') || title.includes('order') || desc.includes('sales')) {
                categories.push('sales');
            }
            if (id.includes('finance') || id.includes('accounting') || id.includes('payment') || id.includes('invoice') ||
                id.includes('gl_') || id.includes('ar_') || id.includes('ap_') || title.includes('finance') ||
                title.includes('accounting') || title.includes('payment')) {
                categories.push('finance');
            }
            if (id.includes('purchase') || id.includes('procurement') || id.includes('vendor') || id.includes('po_') ||
                title.includes('procurement') || title.includes('purchase') || title.includes('vendor')) {
                categories.push('procurement');
            }
            if (id.includes('employee') || id.includes('hr_') || id.includes('personnel') || id.includes('payroll') ||
                title.includes('employee') || title.includes('human') || title.includes('personnel')) {
                categories.push('hr');
            }
            if (id.includes('logistics') || id.includes('warehouse') || id.includes('inventory') || id.includes('material') ||
                id.includes('wm_') || id.includes('mm_') || title.includes('logistics') || title.includes('material')) {
                categories.push('logistics');
            }
            if (categories.length === 0) {
                categories.push('all');
            }
            this.serviceCategories.set(service.id, categories);
        }
        this.logger.debug(`Categorized ${this.discoveredServices.length} services`);
    }
    async discoverServicesAndEntitiesMinimal(args) {
        try {
            const query = args.query?.toLowerCase() || "";
            const requestedCategory = args.category?.toLowerCase() || "all";
            const limit = args.limit || 20;
            const validCategories = ["business-partner", "sales", "finance", "procurement", "hr", "logistics", "all"];
            const category = validCategories.includes(requestedCategory) ? requestedCategory : "all";
            let matches = [];
            let returnedAllServices = false;
            matches = this.performMinimalSearch(query, category);
            if (matches.length === 0 && query) {
                this.logger.debug(`No results found for query '${query}', returning all available services`);
                matches = this.performMinimalSearch("", category);
                returnedAllServices = true;
            }
            if (!returnedAllServices && query) {
                matches.sort((a, b) => b.score - a.score);
            }
            else {
                matches.sort((a, b) => {
                    if (a.type === 'service' && b.type === 'service') {
                        return a.service.serviceName.localeCompare(b.service.serviceName);
                    }
                    return 0;
                });
            }
            const totalFound = matches.length;
            const limitedMatches = matches.slice(0, limit);
            const result = {
                query: query || "all",
                category: category,
                returnedAllServices: returnedAllServices,
                totalFound: totalFound,
                showing: limitedMatches.length,
                matches: limitedMatches
            };
            let responseText = "";
            if (returnedAllServices) {
                responseText += `[LEVEL 1 - NO MATCHES] No results found for "${query}". Returning ALL available services.\n\n`;
            }
            else if (query) {
                responseText += `[LEVEL 1 - SEARCH RESULTS] Found ${totalFound} matches for "${query}"\n\n`;
            }
            else {
                responseText += `[LEVEL 1 - ALL SERVICES] Showing all available services\n\n`;
            }
            responseText += `NEXT STEP: Select a service and entity, then call get-entity-metadata\n`;
            responseText += `  with serviceId and entityName to get full schema details.\n\n`;
            responseText += `Results (${limitedMatches.length} of ${totalFound}):\n\n`;
            responseText += JSON.stringify(result, null, 2);
            return {
                content: [{
                        type: "text",
                        text: responseText
                    }]
            };
        }
        catch (error) {
            this.logger.error('Error in Level 1 discovery:', error);
            return {
                content: [{
                        type: "text",
                        text: `ERROR: ${error instanceof Error ? error.message : String(error)}`
                    }],
                isError: true
            };
        }
    }
    async getEntityMetadataFull(args) {
        try {
            const serviceId = args.serviceId;
            const entityName = args.entityName;
            if (!serviceId || !entityName) {
                return {
                    content: [{
                            type: "text",
                            text: `ERROR: Both serviceId and entityName are required.`
                        }],
                    isError: true
                };
            }
            const service = this.discoveredServices.find(s => s.id === serviceId);
            if (!service) {
                return {
                    content: [{
                            type: "text",
                            text: `ERROR: Service not found: ${serviceId}`
                        }],
                    isError: true
                };
            }
            const entityType = service.metadata?.entityTypes?.find(e => e.name === entityName);
            if (!entityType) {
                const availableEntities = service.metadata?.entityTypes?.map(e => e.name).join(', ') || 'none';
                return {
                    content: [{
                            type: "text",
                            text: `ERROR: Entity '${entityName}' not found in service '${serviceId}'\n\nAvailable entities: ${availableEntities}`
                        }],
                    isError: true
                };
            }
            const metadata = {
                service: {
                    serviceId: service.id,
                    serviceName: service.title,
                    description: service.description,
                    odataVersion: service.odataVersion,
                    url: service.url
                },
                entity: {
                    name: entityType.name,
                    entitySet: entityType.entitySet,
                    namespace: entityType.namespace,
                    keyProperties: entityType.keys,
                    propertyCount: entityType.properties.length
                },
                capabilities: {
                    readable: true,
                    creatable: entityType.creatable,
                    updatable: entityType.updatable,
                    deletable: entityType.deletable
                },
                properties: entityType.properties.map(prop => ({
                    name: prop.name,
                    type: prop.type,
                    nullable: prop.nullable,
                    maxLength: prop.maxLength,
                    isKey: entityType.keys.includes(prop.name)
                }))
            };
            let responseText = `[LEVEL 2 - ENTITY METADATA] Complete schema for ${entityName}\n\n`;
            responseText += `NEXT STEP: Use execute-sap-operation with:\n`;
            responseText += `  - serviceId: "${serviceId}"\n`;
            responseText += `  - entityName: "${entityName}"\n`;
            responseText += `  - operation: read | read-single | create | update | delete\n\n`;
            responseText += `Key Properties: [${entityType.keys.join(', ')}]\n`;
            responseText += `Capabilities: creatable=${entityType.creatable}, updatable=${entityType.updatable}, deletable=${entityType.deletable}\n\n`;
            responseText += `Full Metadata:\n\n`;
            responseText += JSON.stringify(metadata, null, 2);
            return {
                content: [{
                        type: "text",
                        text: responseText
                    }]
            };
        }
        catch (error) {
            this.logger.error('Error in Level 2 metadata retrieval:', error);
            return {
                content: [{
                        type: "text",
                        text: `ERROR: ${error instanceof Error ? error.message : String(error)}`
                    }],
                isError: true
            };
        }
    }
    performMinimalSearch(query, category) {
        const matches = [];
        for (const service of this.discoveredServices) {
            if (category !== "all") {
                const serviceCategories = this.serviceCategories.get(service.id) || [];
                if (!serviceCategories.includes(category)) {
                    continue;
                }
            }
            const serviceIdLower = service.id.toLowerCase();
            const serviceTitleLower = service.title.toLowerCase();
            let serviceScore = 0;
            if (query) {
                if (serviceIdLower.includes(query))
                    serviceScore = 0.9;
                else if (serviceTitleLower.includes(query))
                    serviceScore = 0.85;
            }
            if (serviceScore > 0 || !query) {
                const entities = service.metadata?.entityTypes?.map(entity => ({
                    entityName: entity.name
                })) || [];
                matches.push({
                    type: "service",
                    score: serviceScore || 0.5,
                    service: {
                        serviceId: service.id,
                        serviceName: service.title,
                        entityCount: entities.length,
                        categories: this.serviceCategories.get(service.id) || []
                    },
                    entities: entities
                });
            }
            if (service.metadata?.entityTypes && query) {
                for (const entity of service.metadata.entityTypes) {
                    const entityNameLower = entity.name.toLowerCase();
                    if (entityNameLower.includes(query)) {
                        matches.push({
                            type: "entity",
                            score: 0.95,
                            service: {
                                serviceId: service.id,
                                serviceName: service.title,
                                entityCount: service.metadata.entityTypes.length,
                                categories: this.serviceCategories.get(service.id) || []
                            },
                            entity: {
                                entityName: entity.name
                            }
                        });
                    }
                }
            }
        }
        return matches;
    }
    async executeEntityOperation(args) {
        try {
            const serviceId = args.serviceId;
            const entityName = args.entityName;
            const operation = args.operation?.toLowerCase();
            const parameters = args.parameters || {};
            const validOperations = ["read", "read-single", "create", "update", "delete"];
            if (!validOperations.includes(operation)) {
                throw new Error(`Invalid operation: ${operation}. Valid: ${validOperations.join(', ')}`);
            }
            const service = this.discoveredServices.find(s => s.id === serviceId);
            if (!service) {
                return {
                    content: [{
                            type: "text",
                            text: `ERROR: Service not found: ${serviceId}`
                        }],
                    isError: true
                };
            }
            const entityType = service.metadata?.entityTypes?.find(e => e.name === entityName);
            if (!entityType) {
                return {
                    content: [{
                            type: "text",
                            text: `ERROR: Entity '${entityName}' not found in service '${serviceId}'`
                        }],
                    isError: true
                };
            }
            this.sapClient.setUserToken(args.useUserToken !== false ? this.userToken : undefined);
            const queryOptions = {};
            if (args.filterString)
                queryOptions.$filter = args.filterString;
            if (args.selectString)
                queryOptions.$select = args.selectString;
            if (args.expandString)
                queryOptions.$expand = args.expandString;
            if (args.orderbyString)
                queryOptions.$orderby = args.orderbyString;
            if (args.topNumber)
                queryOptions.$top = args.topNumber;
            if (args.skipNumber)
                queryOptions.$skip = args.skipNumber;
            let response;
            let operationDescription = "";
            switch (operation) {
                case 'read': {
                    operationDescription = `Reading ${entityName} records`;
                    if (args.filterString)
                        operationDescription += ` with filter: ${args.filterString}`;
                    if (args.topNumber)
                        operationDescription += ` (top ${args.topNumber})`;
                    response = await this.sapClient.readEntitySet(service.url, entityType.entitySet, queryOptions, false);
                    break;
                }
                case 'read-single': {
                    const keyValue = this.buildKeyValue(entityType, parameters);
                    operationDescription = `Reading single ${entityName} with key: ${keyValue}`;
                    response = await this.sapClient.readEntity(service.url, entityType.entitySet, keyValue, false);
                    break;
                }
                case 'create': {
                    if (!entityType.creatable) {
                        throw new Error(`Entity '${entityName}' does not support create operations`);
                    }
                    operationDescription = `Creating new ${entityName}`;
                    const validData = this.validateAndCleanData(entityType, parameters, 'create');
                    response = await this.sapClient.createEntity(service.url, entityType.entitySet, validData);
                    break;
                }
                case 'update': {
                    if (!entityType.updatable) {
                        throw new Error(`Entity '${entityName}' does not support update operations`);
                    }
                    const updateKeyValue = this.buildKeyValue(entityType, parameters);
                    operationDescription = `Updating ${entityName} with key: ${updateKeyValue}`;
                    const updateData = { ...parameters };
                    entityType.keys.forEach(key => delete updateData[key]);
                    const validData = this.validateAndCleanData(entityType, updateData, 'update');
                    response = await this.sapClient.updateEntity(service.url, entityType.entitySet, updateKeyValue, validData);
                    break;
                }
                case 'delete': {
                    if (!entityType.deletable) {
                        throw new Error(`Entity '${entityName}' does not support delete operations`);
                    }
                    const deleteKeyValue = this.buildKeyValue(entityType, parameters);
                    operationDescription = `Deleting ${entityName} with key: ${deleteKeyValue}`;
                    response = await this.sapClient.deleteEntity(service.url, entityType.entitySet, deleteKeyValue);
                    break;
                }
                default:
                    throw new Error(`Unsupported operation: ${operation}`);
            }
            let responseText = `SUCCESS: ${operationDescription}\n\n`;
            responseText += `Result:\n`;
            responseText += JSON.stringify(response.data, null, 2);
            return {
                content: [{
                        type: "text",
                        text: responseText
                    }]
            };
        }
        catch (error) {
            this.logger.error('Error executing operation:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                content: [{
                        type: "text",
                        text: `ERROR: ${errorMessage}\n\nTroubleshooting:\n1. Verify entity supports this operation\n2. Check all required key fields are provided\n3. Validate data types match entity schema`
                    }],
                isError: true
            };
        }
    }
    buildKeyValue(entityType, parameters) {
        const keyProperties = entityType.properties.filter(p => entityType.keys.includes(p.name));
        const missingKeys = keyProperties.filter(p => !(p.name in parameters));
        if (missingKeys.length > 0) {
            throw new Error(`Missing required key properties: ${missingKeys.map(p => p.name).join(', ')}`);
        }
        if (keyProperties.length === 1) {
            const keyProp = keyProperties[0];
            const value = parameters[keyProp.name];
            return this.formatKeyValue(keyProp, value);
        }
        const keyParts = keyProperties.map(prop => {
            const value = parameters[prop.name];
            const formatted = this.formatKeyValue(prop, value);
            return `${prop.name}=${formatted}`;
        });
        return keyParts.join(',');
    }
    formatKeyValue(keyProperty, value) {
        if (value === null || value === undefined) {
            throw new Error(`Key property ${keyProperty.name} cannot be null`);
        }
        const strValue = String(value);
        const type = keyProperty.type?.toLowerCase() || '';
        if (type.includes('guid') || type.includes('uuid')) {
            return `guid'${strValue}'`;
        }
        if (type.includes('int') || type.includes('decimal') || type.includes('double') || type.includes('float')) {
            return strValue;
        }
        if (type.includes('datetime') || type.includes('date')) {
            return `datetime'${strValue}'`;
        }
        return `'${strValue.replace(/'/g, "''")}'`;
    }
    validateAndCleanData(entityType, data, operation) {
        const cleaned = {};
        const reserved = ['__metadata', '__deferred', '__key', '__uri'];
        for (const [key, value] of Object.entries(data)) {
            if (reserved.includes(key))
                continue;
            if (value === undefined)
                continue;
            const prop = entityType.properties.find(p => p.name === key);
            if (!prop) {
                this.logger.warn(`Unknown property '${key}' for entity '${entityType.name}', skipping`);
                continue;
            }
            if (operation === 'create' && entityType.keys.includes(key)) {
                this.logger.debug(`Skipping key property '${key}' in create operation`);
                continue;
            }
            cleaned[key] = value;
        }
        return cleaned;
    }
    registerServiceMetadataResources() {
        this.mcpServer.registerResource("sap-service-metadata", new ResourceTemplate("sap://service/{serviceId}/metadata", { list: undefined }), {
            title: "SAP Service Metadata",
            description: "Metadata information for SAP OData services"
        }, async (uri, variables) => {
            const serviceId = typeof variables.serviceId === "string" ? variables.serviceId : "";
            const service = this.discoveredServices.find(s => s.id === serviceId);
            if (!service) {
                throw new Error(`Service not found: ${serviceId}`);
            }
            return {
                contents: [{
                        uri: uri.href,
                        text: JSON.stringify({
                            service: {
                                id: service.id,
                                title: service.title,
                                description: service.description,
                                url: service.url,
                                version: service.version
                            },
                            entities: service.metadata?.entityTypes?.map(entity => ({
                                name: entity.name,
                                entitySet: entity.entitySet,
                                properties: entity.properties,
                                keys: entity.keys,
                                operations: {
                                    creatable: entity.creatable,
                                    updatable: entity.updatable,
                                    deletable: entity.deletable
                                }
                            })) || []
                        }, null, 2),
                        mimeType: "application/json"
                    }]
            };
        });
        this.mcpServer.registerResource("system-instructions", "sap://system/instructions", {
            title: "SAP MCP Server Instructions for Claude AI",
            description: "Comprehensive instructions for helping users interact with SAP OData services",
            mimeType: "text/markdown"
        }, async (uri) => ({
            contents: [{
                    uri: uri.href,
                    text: this.getSystemInstructions(),
                    mimeType: "text/markdown"
                }]
        }));
        this.mcpServer.registerResource("authentication-status", "sap://auth/status", {
            title: "Authentication Status and Guidance",
            description: "Current authentication status and user guidance for OAuth flow",
            mimeType: "application/json"
        }, async (uri) => {
            const authStatus = {
                authentication: {
                    required: true,
                    configured: true,
                    current_status: this.userToken ? 'authenticated' : 'not_authenticated',
                    token_present: !!this.userToken
                },
                user_context: this.userToken ? {
                    has_token: true,
                    message: 'User is authenticated and operations will use their SAP identity',
                    dual_auth_model: {
                        discovery: 'Uses technical user for service metadata discovery',
                        execution: 'Uses your JWT token for all data operations'
                    }
                } : {
                    has_token: false,
                    message: 'User must authenticate before accessing SAP data',
                    action_required: 'OAuth authentication flow must be completed'
                },
                claude_ai_instructions: this.userToken ? {
                    status: 'READY',
                    message: 'User is authenticated. You can now help them access SAP data.',
                    workflow: [
                        'Level 1: Call discover-sap-data to find services/entities (returns minimal data)',
                        'Level 2: Call get-entity-metadata for selected entity (returns full schema)',
                        'Level 3: Call execute-sap-operation to perform CRUD operations (uses schema from Level 2)'
                    ],
                    architecture: '3-level progressive discovery optimized for token efficiency',
                    security_context: 'Operations execute under authenticated user identity'
                } : {
                    status: 'AUTHENTICATION_REQUIRED',
                    message: 'CRITICAL: User must authenticate before you can help with SAP operations',
                    required_actions: [
                        'Guide user through OAuth authentication flow',
                        'Explain authentication is mandatory for SAP access',
                        'Provide clear step-by-step authentication instructions',
                        'Do NOT attempt SAP operations without authentication'
                    ],
                    oauth_flow_guidance: {
                        step1: 'Direct user to /oauth/authorize endpoint',
                        step2: 'User logs in with SAP BTP credentials',
                        step3: 'User copies access token from callback',
                        step4: 'User provides token to MCP client',
                        step5: 'Token is included in Authorization header for all requests'
                    }
                },
                endpoints: {
                    authorize: '/oauth/authorize',
                    callback: '/oauth/callback',
                    refresh: '/oauth/refresh',
                    userinfo: '/oauth/userinfo',
                    discovery: '/.well-known/oauth-authorization-server'
                },
                security_model: {
                    type: 'OAuth 2.0 with SAP XSUAA',
                    token_lifetime: '1 hour',
                    refresh_token_lifetime: '24 hours',
                    scope_based_authorization: true,
                    audit_trail: 'All operations logged under user identity'
                }
            };
            return {
                contents: [{
                        uri: uri.href,
                        text: JSON.stringify(authStatus, null, 2),
                        mimeType: "application/json"
                    }]
            };
        });
        this.mcpServer.registerResource("sap-services", "sap://services", {
            title: "Available SAP Services",
            description: "List of all discovered SAP OData services",
            mimeType: "application/json"
        }, async (uri) => ({
            contents: [{
                    uri: uri.href,
                    text: JSON.stringify({
                        totalServices: this.discoveredServices.length,
                        categories: Array.from(new Set(Array.from(this.serviceCategories.values()).flat())),
                        services: this.discoveredServices.map(service => ({
                            id: service.id,
                            title: service.title,
                            description: service.description,
                            entityCount: service.metadata?.entityTypes?.length || 0,
                            categories: this.serviceCategories.get(service.id) || []
                        }))
                    }, null, 2)
                }]
        }));
    }
    getSystemInstructions() {
        return `# SAP OData MCP Server - System Instructions

## Authentication Requirements

This server requires OAuth 2.0 authentication for all SAP data operations.

### Before Helping Users
1. Check authentication-status resource (sap://auth/status)
2. If NOT authenticated, STOP and guide user through OAuth flow
3. If authenticated, proceed with discovery and operations

### Dual Authentication Model
- **Discovery**: Uses technical user (reliable metadata access)
- **Execution**: Uses user's JWT token (proper authorization and audit trail)

## Available Tools

### LEVEL 1: discover-sap-data
- Purpose: Search and find services/entities with minimal data
- Returns: serviceId, serviceName, entityName, entityCount (optimized for LLM)
- When no matches: Returns ALL services with entity lists
- Use: When exploring what data is available

### LEVEL 2: get-entity-metadata
- Purpose: Get complete entity schema with all details
- Returns: Properties, types, keys, nullable flags, capabilities
- Use: After Level 1 to get full details before operations

### LEVEL 3: execute-sap-operation
- Purpose: Perform CRUD operations (read, read-single, create, update, delete)
- Requires: User authentication (JWT token)
- Use: Execute actual operations with proper parameters

## Recommended Workflow

✅ CORRECT 3-Level Flow:
1. discover-sap-data → Find services/entities
2. get-entity-metadata → Get full schema details
3. execute-sap-operation → Execute CRUD operations

## Operations Guide

### READ
- Retrieves multiple records
- Parameters: filterString, selectString, expandString, topNumber, skipNumber
- Example: Read customers with status='Active', limit 10

### READ-SINGLE
- Retrieves single record by key
- Parameters: Entity key values in parameters
- Example: Read customer with ID='123'

### CREATE
- Creates new record
- Parameters: Entity data fields (all non-key properties)
- Validation: Entity must have creatable=true
- Returns: Created entity with key

### UPDATE
- Updates existing record
- Parameters: Key fields + fields to update
- Validation: Entity must have updatable=true
- Note: Key fields are excluded from update payload

### DELETE
- Deletes record by key
- Parameters: Entity key values
- Validation: Entity must have deletable=true
- Warning: No recovery possible

## Key Handling

### Single Key Entities
- Key is formatted based on type (GUID, String, Int, Date)
- Example: Customer with ID=123 → '123' or guid'123'

### Composite Key Entities
- Multiple keys joined with commas
- Example: OrderID='O1',LineNo=1 → "OrderID='O1',LineNo=1"

### Type Formatting
- GUID: guid'value'
- String: 'value'
- Number: plain number
- Date: datetime'value'

## Error Handling

### Common Issues

1. **Missing Key**: Verify all key properties provided in parameters
2. **Type Mismatch**: Check property types in entity schema
3. **Operation Not Supported**: Verify entity capabilities (creatable, updatable, deletable)
4. **Unknown Property**: Property name must match schema exactly (case-sensitive)
5. **Selection Not Supported**: Some APIs don't support $select, try without selectString

## Best Practices

1. Always call get-entity-metadata before operations to understand schema
2. Check entity capabilities before attempting operations
3. Validate data types match schema
4. Use filters to limit result sets
5. Handle pagination with topNumber and skipNumber for large datasets
6. Test with read operations before attempting create/update/delete
7. Include proper error handling in client code
8. Log all operations for audit trail

## Security Notes

- All operations execute under authenticated user's SAP credentials
- Token is required for all data operations (execution level)
- Discovery operations use technical user token
- Operations are audit-logged under user identity
- Never share user tokens or include in logs
- Tokens expire (typically 1 hour) - implement refresh logic

## Troubleshooting

### Service Not Found
- Verify serviceId matches discover-sap-data results
- Use 'id' field, not 'title' field
- Call discover-sap-data to list available services

### Entity Not Found
- Verify entityName matches discovered entities
- Check service has been updated with latest entities
- Use get-entity-metadata to validate entity exists

### Operation Failed
- Check error message for specific details
- Verify entity supports operation (creatable/updatable/deletable)
- Validate all required key fields provided
- Check data types match schema
- For $select errors, retry without selectString parameter`;
    }
}
//# sourceMappingURL=hierarchical-tool-registry.js.map