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
export const apiKeyAuth = (config: ApiKeyConfig) => {
    const headerName = config.headerName || 'x-api-key';
    const allowNoAuth = config.allowNoAuth || false;

    return (req: Request, res: Response, next: NextFunction) => {
        // Get the API key from the request headers
        const apiKey = req.headers[headerName.toLowerCase()] as string;

        // If no API key is provided
        if (!apiKey) {
            // Allow access if no auth is allowed (for backward compatibility or dev environments)
            if (allowNoAuth) {
                return next();
            }
            
            // Otherwise, return unauthorized
            return res.status(401).json({
                success: false,
                message: 'API key is required'
            });
        }

        // Check if the API key is valid
        const userInfo = config.keys[apiKey];
        if (!userInfo) {
            return res.status(403).json({
                success: false,
                message: 'Invalid API key'
            });
        }

        // Add user info to the request object for later use
        (req as any).user = userInfo;

        // Continue to the next middleware or route handler
        next();
    };
}; 