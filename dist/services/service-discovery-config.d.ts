import { Config } from '../utils/config.js';
import { Logger } from '../utils/logger.js';
/**
 * Utility service for managing and testing OData service discovery configuration
 */
export declare class ServiceDiscoveryConfigService {
    private config;
    private logger;
    constructor(config: Config, logger: Logger);
    /**
     * Test service patterns against a list of service names
     */
    testPatterns(serviceNames: string[]): {
        allowed: string[];
        excluded: string[];
        config: Record<string, unknown>;
    };
    /**
     * Validate configuration patterns
     */
    validateConfiguration(): {
        valid: boolean;
        errors: string[];
        warnings: string[];
    };
    /**
     * Get configuration summary for display
     */
    getConfigurationSummary(): Record<string, unknown>;
    /**
     * Generate human-readable description of current configuration
     */
    private generateConfigurationDescription;
    /**
     * Update configuration at runtime
     */
    updateConfiguration(newConfig: {
        allowAllServices?: boolean;
        servicePatterns?: string[];
        exclusionPatterns?: string[];
        maxServices?: number;
    }): void;
}
//# sourceMappingURL=service-discovery-config.d.ts.map