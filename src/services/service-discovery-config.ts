import { Config } from '../utils/config.js';
import { Logger } from '../utils/logger.js';
export class ServiceDiscoveryConfigService {
    constructor(private config: Config, private logger: Logger) {}
    testPatterns(names: string[]) { return { allowed: names, excluded: [], config: {} }; }
    getConfigurationSummary() { return {}; }
    updateConfiguration(config: any) {}
}