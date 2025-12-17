export declare class Config {
    private config;
    constructor();
    private loadConfiguration;
    private loadODataServiceConfig;
    get<T = string>(key: string, defaultValue?: T): T;
    set(key: string, value: unknown): void;
    has(key: string): boolean;
    getAll(): Record<string, unknown>;
    /**
     * Check if a service ID matches the configured patterns
     */
    isServiceAllowed(serviceId: string): boolean;
    /**
     * Check if a string matches any of the given patterns
     * Supports glob-style patterns (* and ?) and basic regex
     */
    private matchesAnyPattern;
    /**
     * Check if a string matches a pattern
     * Supports:
     * - Exact match
     * - Glob patterns with * (matches any characters) and ? (matches single character)
     * - Regex patterns (if they start and end with /)
     */
    private matchesPattern;
    /**
     * Get the maximum number of services to discover
     */
    getMaxServices(): number;
    /**
     * Get service filtering configuration for logging/debugging
     */
    getServiceFilterConfig(): Record<string, unknown>;
}
//# sourceMappingURL=config.d.ts.map