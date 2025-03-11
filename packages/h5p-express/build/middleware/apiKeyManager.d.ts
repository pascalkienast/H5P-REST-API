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
     * Adds a new API key
     * @param apiKey The API key
     * @param userInfo Information about the user
     */
    addKey(apiKey: string, userInfo: {
        userId: string;
        name: string;
        permissions?: string[];
    }): void;
    /**
     * Removes an API key
     * @param apiKey The API key to remove
     */
    removeKey(apiKey: string): void;
    /**
     * Gets the current API key configuration
     */
    getConfig(): ApiKeyConfig;
    /**
     * Sets the header name for the API key
     * @param headerName Name of the header
     */
    setHeaderName(headerName: string): void;
    /**
     * Sets whether to allow access without an API key
     * @param allow Whether to allow access without an API key
     */
    setAllowNoAuth(allow: boolean): void;
}
