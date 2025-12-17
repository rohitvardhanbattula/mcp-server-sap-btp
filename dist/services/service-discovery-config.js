/**
 * Utility service for managing and testing OData service discovery configuration
 */
export class ServiceDiscoveryConfigService {
    config;
    logger;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
    }
    /**
     * Test service patterns against a list of service names
     */
    testPatterns(serviceNames) {
        const allowed = [];
        const excluded = [];
        serviceNames.forEach(serviceName => {
            if (this.config.isServiceAllowed(serviceName)) {
                allowed.push(serviceName);
            }
            else {
                excluded.push(serviceName);
            }
        });
        return {
            allowed,
            excluded,
            config: this.config.getServiceFilterConfig()
        };
    }
    /**
     * Validate configuration patterns
     */
    validateConfiguration() {
        const errors = [];
        const warnings = [];
        const allowAll = this.config.get('odata.allowAllServices', false);
        const patterns = this.config.get('odata.servicePatterns', []);
        const exclusions = this.config.get('odata.exclusionPatterns', []);
        const maxServices = this.config.get('odata.maxServices', 50);
        // Validate max services
        if (maxServices <= 0) {
            errors.push('Maximum services must be greater than 0');
        }
        if (maxServices > 200) {
            warnings.push('Maximum services is very high (>200), this may impact performance');
        }
        // Validate patterns if not allowing all
        if (!allowAll) {
            if (!patterns || patterns.length === 0) {
                warnings.push('No service patterns defined - all services will be included (except exclusions)');
            }
            // Test pattern syntax
            [...patterns, ...exclusions].forEach((pattern) => {
                if (typeof pattern !== 'string') {
                    errors.push(`Invalid pattern type: ${typeof pattern} - expected string`);
                    return;
                }
                // Test regex patterns
                if (pattern.startsWith('/') && pattern.endsWith('/')) {
                    try {
                        new RegExp(pattern.slice(1, -1), 'i');
                    }
                    catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        errors.push(`Invalid regex pattern: ${pattern} - ${errorMessage}`);
                    }
                }
            });
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Get configuration summary for display
     */
    getConfigurationSummary() {
        const config = this.config.getServiceFilterConfig();
        const validation = this.validateConfiguration();
        return {
            ...config,
            validation,
            description: this.generateConfigurationDescription()
        };
    }
    /**
     * Generate human-readable description of current configuration
     */
    generateConfigurationDescription() {
        const allowAll = this.config.get('odata.allowAllServices', false);
        if (allowAll) {
            return 'All OData services are allowed';
        }
        const patterns = this.config.get('odata.servicePatterns', []);
        const exclusions = this.config.get('odata.exclusionPatterns', []);
        const maxServices = this.config.get('odata.maxServices', 50);
        let description = '';
        if (patterns.length === 0) {
            description = 'All services are included';
        }
        else {
            description = `Services matching patterns: ${patterns.join(', ')}`;
        }
        if (exclusions.length > 0) {
            description += ` (excluding: ${exclusions.join(', ')})`;
        }
        description += `. Maximum ${maxServices} services.`;
        return description;
    }
    /**
     * Update configuration at runtime
     */
    updateConfiguration(newConfig) {
        if (newConfig.allowAllServices !== undefined) {
            this.config.set('odata.allowAllServices', newConfig.allowAllServices);
        }
        if (newConfig.servicePatterns !== undefined) {
            this.config.set('odata.servicePatterns', newConfig.servicePatterns);
        }
        if (newConfig.exclusionPatterns !== undefined) {
            this.config.set('odata.exclusionPatterns', newConfig.exclusionPatterns);
        }
        if (newConfig.maxServices !== undefined) {
            this.config.set('odata.maxServices', newConfig.maxServices);
        }
        this.logger.info('OData service discovery configuration updated', this.getConfigurationSummary());
    }
}
//# sourceMappingURL=service-discovery-config.js.map