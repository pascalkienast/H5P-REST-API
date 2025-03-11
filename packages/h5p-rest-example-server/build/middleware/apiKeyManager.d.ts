import { ApiKeyConfig } from './apiKeyAuth';
/**
 * Options for loading API keys
 */
export interface ApiKeyManagerOptions {
    /**
     * Path to a JSON file containing API keys configuration
     */
    configFile?: string;
    /**
     * Prefix for environment variables containing API keys
     * Format: {PREFIX}_{KEY_ID} (e.g., H5P_API_KEY_123)
     */
    envPrefix?: string;
    /**
     * Default user information for API keys loaded from environment variables
     */
    defaultUserInfo?: {
        name: string;
        permissions?: string[];
    };
    /**
     * Name of the header that contains the API key
     * @default 'x-api-key'
     */
    headerName?: string;
    /**
     * Whether to allow access without an API key
     * @default false
     */
    allowNoAuth?: boolean;
}
/**
 * Manages API keys for authentication
 */
export declare class ApiKeyManager {
    private config;
    /**
     * Creates a new API key manager
     * @param options Options for loading API keys
     */
    constructor(options?: ApiKeyManagerOptions);
    /**
     * Loads API keys from a JSON file
     * @param filePath Path to the JSON file
     */
    private loadFromFile;
    /**
     * Loads API keys from environment variables
     * @param prefix Prefix for environment variables
     * @param defaultUserInfo Default user information for keys from environment
     */
    private loadFromEnv;
    /**
     * Gets the current API key configuration
     */
    getConfig(): ApiKeyConfig;
}
