import xsenv from '@sap/xsenv';

export class Config {
    private config: Map<string, unknown> = new Map();
    constructor() {
        this.config.set('sap.destinationName', process.env.SAP_DESTINATION_NAME || 'SAP_SYSTEM');
        this.config.set('sap.discoveryDestinationName', process.env.SAP_DISCOVERY_DESTINATION_NAME);
        this.config.set('sap.executionDestinationName', process.env.SAP_EXECUTION_DESTINATION_NAME);
        this.config.set('odata.allowAllServices', process.env.ODATA_ALLOW_ALL === 'true');
        this.config.set('odata.servicePatterns', (process.env.ODATA_SERVICE_PATTERNS || '*').split(','));
        this.config.set('odata.maxServices', parseInt(process.env.ODATA_MAX_SERVICES || '50'));
        try { xsenv.loadEnv(); } catch (e) { /* ignore in non-BTP env */ }
    }
    get<T>(key: string, defaultValue?: T): T { return (this.config.get(key) ?? defaultValue) as T; }
    isServiceAllowed(serviceId: string): boolean { return true; } // Simplified for brevity
    getMaxServices(): number { return this.get('odata.maxServices', 50); }
    getServiceFilterConfig() { return this.config; } // Simplified
}