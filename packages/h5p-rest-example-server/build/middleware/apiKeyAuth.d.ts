import { Request, Response, NextFunction } from 'express';
/**
 * Interface for API key configuration
 */
export interface ApiKeyConfig {
    /**
     * Map of API keys to user information
     * The key is the API key, the value is an object with user information
     */
    keys: {
        [key: string]: {
            userId: string;
            name: string;
            permissions?: string[];
        };
    };
    /**
     * Name of the header that contains the API key
     * Defaults to 'x-api-key'
     */
    headerName?: string;
    /**
     * Whether to allow access without an API key (for backward compatibility)
     * Defaults to false
     */
    allowNoAuth?: boolean;
}
/**
 * Creates a middleware that checks for a valid API key in the request headers
 * @param config Configuration for the API key authentication
 * @returns Express middleware function
 */
export declare const apiKeyAuth: (config: ApiKeyConfig) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
