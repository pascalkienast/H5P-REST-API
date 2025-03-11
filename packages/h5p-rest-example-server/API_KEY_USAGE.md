# Using API Keys with the H5P REST API

This document explains how to authenticate with the H5P REST API using API keys for external applications.

## Authentication

All H5P REST API endpoints can be accessed using API key authentication. To authenticate, include your API key in the request headers:

```
x-api-key: YOUR_API_KEY
```

### Example API Request

```bash
# Get all available content types with API key authentication
curl -X GET "http://localhost:8080/h5p/libraries" \
  -H "Accept: application/json" \
  -H "x-api-key: API_KEY_1"
```

## API Key Management

### Predefined API Keys

The server includes several predefined API keys with different permission levels:

| API Key | User ID | Permissions | Role |
|---------|---------|------------|------|
| API_KEY_1 | api_user_1 | read, write | teacher |
| API_KEY_2 | api_user_2 | read | student |
| API_KEY_ADMIN | api_admin | read, write, admin | admin |

### Custom API Keys

You can add your own API keys by:

1. Adding them to the `api-keys.json` file:

```json
{
  "keys": {
    "YOUR_NEW_API_KEY": {
      "userId": "your_user_id",
      "name": "Your User Name",
      "permissions": ["read", "write"]
    }
  }
}
```

2. Using environment variables:

```
H5P_API_KEY_YOUR_USER_ID=YOUR_NEW_API_KEY
```

## Permission Levels

API keys can have different permission levels that map to user roles:

- **admin**: Full access to all endpoints
- **write**: Can create, edit, and view content (teacher role)
- **read**: Can only view content (student role)
- no permissions: Limited access (anonymous role)

## Configuration for Production

By default, the example server allows requests without API keys in development mode for backward compatibility. For production environments, you should require API keys for all requests:

1. Set the `NODE_ENV` environment variable to "production":

```bash
export NODE_ENV=production
```

2. If you need to specify allowed origins for CORS, set the `ALLOWED_ORIGINS` environment variable:

```bash
export ALLOWED_ORIGINS="https://yourdomain.com,https://anotherdomain.com"
```

3. You can also set these options directly in the API key manager configuration:

```javascript
const apiKeyManager = new ApiKeyManager({
    configFile: path.resolve('api-keys.json'),
    envPrefix: 'H5P_API_KEY',
    // Require API keys for all requests in production
    allowNoAuth: false
});
```

## CORS and External Access

To allow cross-origin requests from external applications, the server includes CORS middleware. The default configuration allows requests from any origin in development mode.

### Example Frontend Code

Here's an example of how to use the API with JavaScript:

```javascript
// Function to fetch content using API key
async function fetchH5PContent(contentId) {
  const response = await fetch(`http://localhost:8080/h5p/play/${contentId}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'x-api-key': 'API_KEY_1'
    }
  });
  
  return response.json();
}

// Function to create new content
async function createH5PContent(libraryName, params) {
  const response = await fetch('http://localhost:8080/h5p/new', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-api-key': 'API_KEY_1'
    },
    body: JSON.stringify({
      library: libraryName,
      params: params
    })
  });
  
  return response.json();
}
```

## Security Considerations

1. **API Key Protection**: Keep your API keys secure and never expose them in client-side code.
2. **HTTPS**: Always use HTTPS in production to prevent API keys from being intercepted.
3. **Key Rotation**: Rotate API keys periodically for better security.
4. **IP Restrictions**: Consider restricting API access by IP address for additional security.

## Troubleshooting

If you encounter authentication issues:

1. Ensure you're using the correct API key format in the header.
2. Check that the server has loaded your API keys correctly.
3. Verify that your API key has the necessary permissions for the operation.
4. Check the server logs for specific error messages.

For more information on the available endpoints, refer to the main REST API documentation. 