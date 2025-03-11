import fs from 'fs';
import path from 'path';
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
export class ApiKeyManager {
    private config: ApiKeyConfig;

    /**
     * Creates a new API key manager
     * @param options Options for loading API keys
     */
    constructor(options: ApiKeyManagerOptions = {}) {
        this.config = {
            keys: {},
            headerName: options.headerName || 'x-api-key',
            allowNoAuth: options.allowNoAuth || false
        };

        // Load API keys from configuration file if provided
        if (options.configFile) {
            this.loadFromFile(options.configFile);
        }

        // Load API keys from environment variables if prefix is provided
        if (options.envPrefix) {
            this.loadFromEnv(options.envPrefix, options.defaultUserInfo);
        }
    }

    /**
     * Loads API keys from a JSON file
     * @param filePath Path to the JSON file
     */
    private loadFromFile(filePath: string): void {
        try {
            const absolutePath = path.resolve(filePath);
            if (fs.existsSync(absolutePath)) {
                const fileContent = fs.readFileSync(absolutePath, 'utf8');
                const fileConfig = JSON.parse(fileContent) as ApiKeyConfig;
                
                // Merge with existing configuration
                this.config.keys = {
                    ...this.config.keys,
                    ...fileConfig.keys
                };
                
                console.log(`Loaded API keys from file: ${filePath}`);
            } else {
                console.warn(`API key configuration file not found: ${filePath}`);
            }
        } catch (error) {
            console.error(`Error loading API keys from file: ${filePath}`, error);
        }
    }

    /**
     * Loads API keys from environment variables
     * @param prefix Prefix for environment variables
     * @param defaultUserInfo Default user information for keys from environment
     */
    private loadFromEnv(prefix: string, defaultUserInfo?: { name: string; permissions?: string[] }): void {
        // Look for environment variables with the specified prefix
        const envKeys = Object.keys(process.env).filter(key => key.startsWith(`${prefix}_`));
        
        for (const envKey of envKeys) {
            // Extract the user ID from the environment variable name
            const userId = envKey.substring(prefix.length + 1);
            const apiKey = process.env[envKey];
            
            if (apiKey) {
                this.config.keys[apiKey] = {
                    userId,
                    name: defaultUserInfo?.name || `User ${userId}`,
                    permissions: defaultUserInfo?.permissions
                };
            }
        }
        
        console.log(`Loaded ${envKeys.length} API keys from environment variables`);
    }

    /**
     * Gets the current API key configuration
     */
    public getConfig(): ApiKeyConfig {
        return this.config;
    }
} 