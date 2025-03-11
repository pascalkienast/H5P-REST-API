# H5P Examples Server

This repository contains a feature-rich H5P server implementation that allows you to create, edit, and share interactive HTML5 content.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Git

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/pascalkienast/H5P-AI-Generator.git
cd H5P-AI-Generator
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Packages

```bash
npm run bootstrap
npm run build:packages
```

### 4. Start the H5P Examples Server

The H5P Examples Server provides a complete UI with content editor and player:

```bash
npm start
```

The server will be available at: `http://localhost:8080`

## Features

- Create and edit H5P content using the visual editor
- Play existing H5P content
- Upload H5P packages
- Download H5P content as .h5p files
- Full integration with H5P Hub
- Mobile-friendly interface

## Using the H5P Examples Server

### Creating Content

1. Navigate to `http://localhost:8080/h5p/new`
2. Select a content type (such as MultiChoice, Interactive Video, etc.)
3. Create your content using the visual editor
4. Save the content
5. View your content at `http://localhost:8080/h5p/play/{contentId}`

### Managing Content

You can view, edit, and delete your H5P content through the web interface.

By default, the list of available content is hidden on the start page for security and clarity. 

To enable the content listing on the start page, set the environment variable:

```bash
# Show available content on the start page
export SHOW_AVAILABLE_CONTENT=true
npm start
```

This will display all content items with edit, download, and delete buttons on the main page.

Even when content listing is disabled, you can still:
- Create new content at `/h5p/new`
- Edit content directly at `/h5p/edit/{contentId}`
- Play content at `/h5p/play/{contentId}`
- Download content at `/h5p/download/{contentId}`

## Troubleshooting

### Port Already in Use

If you see this error when starting the server:

```
Error: listen EADDRINUSE: address already in use :::8080
```

This means port 8080 is already being used by another process. Follow these steps:

1. Find the process using port 8080:
   ```bash
   lsof -i :8080
   ```

2. Kill the process:
   ```bash
   kill -9 <PID>
   ```
   Replace `<PID>` with the process ID from the previous command.

3. Try starting the server again.

### Checking Existing Content

To see what content is already in the system:

```bash
curl "http://localhost:8080/" -s | grep "h5p/play"
```

## Environment Variables

The server behavior can be customized using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `SHOW_AVAILABLE_CONTENT` | Display the list of available content on the start page | `false` |
| `PORT` | Port for the server to listen on | `8080` |
| `H5P_BASE_URL` | Base URL for the H5P server | `/h5p` |
| `CONTENT_ROOT_DIR` | Directory for storing H5P content | `./h5p/content` |
| `TEMPORARY_ROOT_DIR` | Directory for temporary files | `./h5p/temporary-files` |
| `LIBRARY_ROOT_DIR` | Directory for H5P libraries | `./h5p/libraries` |

### Setting Environment Variables

You can set environment variables in several ways:

1. **Using a .env file** (recommended):
   - Create a `.env` file in the `packages/h5p-examples/` directory (not in the root directory)
   - Add your environment variables, one per line:
     ```
     SHOW_AVAILABLE_CONTENT=true
     PORT=3000
     ```

2. **Setting variables inline when running commands**:
   ```bash
   SHOW_AVAILABLE_CONTENT=true npm start
   ```

3. **Setting variables in your shell session**:
   ```bash
   export SHOW_AVAILABLE_CONTENT=true
   npm start
   ```

## API Access

The server provides a comprehensive REST API for working with H5P content programmatically. This section covers the basics of API authentication and usage.

### API Authentication

All API endpoints can be accessed using API key authentication. To authenticate, include your API key in the request headers:

```bash
# Example API request with authentication
curl -X GET "http://localhost:8080/h5p/libraries" \
  -H "Accept: application/json" \
  -H "x-api-key: YOUR_API_KEY"
```

### API Key Management

#### Predefined API Keys

The server includes several predefined API keys with different permission levels:

| API Key | User ID | Permissions | Role |
|---------|---------|------------|------|
| API_KEY_1 | api_user_1 | read, write | teacher |
| API_KEY_2 | api_user_2 | read | student |
| API_KEY_ADMIN | api_admin | read, write, admin | admin |

#### Adding Custom API Keys

You can add your own API keys in two ways:

1. **Adding to the api-keys.json file**:

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

2. **Using environment variables**:

```bash
H5P_API_KEY_YOUR_USER_ID=YOUR_NEW_API_KEY
```

### Basic API Endpoints

Here are some commonly used API endpoints:

#### Content Types/Libraries

```bash
# List all available content types
curl -X GET "http://localhost:8080/h5p/libraries" \
  -H "Accept: application/json" \
  -H "x-api-key: YOUR_API_KEY"

# Get details for a specific content type
curl -X GET "http://localhost:8080/h5p/libraries/H5P.InteractiveVideo-1.27" \
  -H "Accept: application/json" \
  -H "x-api-key: YOUR_API_KEY"

# Install a content type
curl -X POST "http://localhost:8080/h5p/libraries/install" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "machineName": "H5P.InteractiveVideo",
    "majorVersion": 1,
    "minorVersion": 27,
    "patchVersion": 9
  }'
```

#### Content Management

```bash
# Create new H5P content
curl -X POST "http://localhost:8080/h5p/new" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "library": "H5P.MultiChoice 1.16",
    "params": {
      "metadata": {
        "title": "API Test Question",
        "license": "U"
      },
      "params": {
        "question": "What does H5P stand for?",
        "answers": [
          {"text": "HTML5 Package", "correct": true},
          {"text": "Hyper Programming", "correct": false}
        ]
      }
    }
  }'

# Get content parameters
curl -X GET "http://localhost:8080/h5p/params/{contentId}" \
  -H "Accept: application/json" \
  -H "x-api-key: YOUR_API_KEY"

# View/play content
curl -X GET "http://localhost:8080/h5p/play/{contentId}" \
  -H "x-api-key: YOUR_API_KEY"

# Download content as H5P package
curl -X GET "http://localhost:8080/h5p/download/{contentId}" \
  -H "x-api-key: YOUR_API_KEY" \
  --output content.h5p
```

### JavaScript Client Example

```javascript
// Function to fetch content using API key
async function fetchH5PContent(contentId) {
  const response = await fetch(`http://localhost:8080/h5p/play/${contentId}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'x-api-key': 'YOUR_API_KEY'
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
      'x-api-key': 'YOUR_API_KEY'
    },
    body: JSON.stringify({
      library: libraryName,
      params: params
    })
  });
  
  return response.json();
}
```

### Security Best Practices

1. **API Key Protection**: Keep your API keys secure and never expose them in client-side code.
2. **HTTPS**: Always use HTTPS in production to prevent API keys from being intercepted.
3. **Key Rotation**: Rotate API keys periodically for better security.
4. **Permission Levels**: Use the minimum permission level required for each API key.

### Production Configuration

For production environments, it's recommended to require API keys for all requests:

```bash
# Set NODE_ENV to production
export NODE_ENV=production

# Specify allowed origins for CORS if needed
export ALLOWED_ORIGINS="https://yourdomain.com,https://anotherdomain.com"
```

For complete API documentation, including all available endpoints and response formats, see [API_DOC.md](API_DOC.md).

For details about the REST API implementation and advanced configuration options, see [API Key Usage](packages/h5p-rest-example-server/API_KEY_USAGE.md).

## Advanced Configuration

For production use, consider:

1. Configuring authentication
2. Setting up proper CORS restrictions
3. Using a production-grade database

For details about the REST API version (less user-friendly but programmable), see the [REST API documentation](packages/h5p-rest-example-server/README.md).

## License

This project is licensed under the MIT License - see the LICENSE file for details. 