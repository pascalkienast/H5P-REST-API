"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Manages API keys for authentication
 */
class ApiKeyManager {
    config;
    /**
     * Creates a new API key manager
     * @param options Options for loading API keys
     */
    constructor(options = {}) {
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
    loadFromFile(filePath) {
        try {
            const absolutePath = path_1.default.resolve(filePath);
            if (fs_1.default.existsSync(absolutePath)) {
                const fileContent = fs_1.default.readFileSync(absolutePath, 'utf8');
                const fileConfig = JSON.parse(fileContent);
                // Merge with existing configuration
                this.config.keys = {
                    ...this.config.keys,
                    ...fileConfig.keys
                };
                console.log(`Loaded API keys from file: ${filePath}`);
            }
            else {
                console.warn(`API key configuration file not found: ${filePath}`);
            }
        }
        catch (error) {
            console.error(`Error loading API keys from file: ${filePath}`, error);
        }
    }
    /**
     * Loads API keys from environment variables
     * @param prefix Prefix for environment variables
     * @param defaultUserInfo Default user information for keys from environment
     */
    loadFromEnv(prefix, defaultUserInfo) {
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
    getConfig() {
        return this.config;
    }
}
exports.ApiKeyManager = ApiKeyManager;
//# sourceMappingURL=apiKeyManager.js.map