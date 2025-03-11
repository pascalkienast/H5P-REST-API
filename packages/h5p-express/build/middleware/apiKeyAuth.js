"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyAuth = void 0;
/**
 * Creates a middleware that checks for a valid API key in the request headers
 * @param config Configuration for the API key authentication
 * @returns Express middleware function
 */
const apiKeyAuth = (config) => {
    const headerName = config.headerName || 'x-api-key';
    const allowNoAuth = config.allowNoAuth || false;
    return (req, res, next) => {
        // Get the API key from the request headers
        const apiKey = req.headers[headerName.toLowerCase()];
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
        req.user = userInfo;
        // Continue to the next middleware or route handler
        next();
    };
};
exports.apiKeyAuth = apiKeyAuth;
//# sourceMappingURL=apiKeyAuth.js.map