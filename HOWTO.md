# H5P REST API Server - How to Use

This guide explains how to set up and use the H5P REST API server.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Git

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/lumieducation/h5p-nodejs-library.git
cd h5p-nodejs-library
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

### 4. Configure API Keys (Optional)

For secure API access, the server supports API key authentication. By default, it comes with a preconfigured API key for development purposes.

Default API key: `API_KEY_1`

You can configure additional API keys by:

- Environment variables:
  - Set `H5P_REST_API_KEY_1=your_custom_api_key` in your environment
  - Set `H5P_REST_API_USER_1=your_username` for this key

- Config file:
  Create a JSON file at `config/api-keys.json` with the following structure:
  ```json
  {
    "apiKeys": {
      "YOUR_API_KEY": {
        "user": {
          "id": "user1",
          "name": "Admin User"
        }
      }
    }
  }
  ```

### 5. Start the Server

There are two options for running H5P servers:

#### Option A: Start the REST Example Server

This server focuses specifically on the REST API functionality:

```bash
npm run start:rest:server
```

#### Option B: Start the H5P Examples Server

This server provides a more feature-rich UI and includes all examples:

```bash
npm start
```

The server will be available at: `http://localhost:8080`

## Using the API

### Authentication

To access the API, include your API key in the request headers:

```
x-api-key: API_KEY_1
```

### Available Endpoints

- `GET /h5p/libraries`: List all available H5P content libraries
- `POST /h5p/new`: Create new H5P content
- `GET /h5p/play/:contentId`: Play H5P content
- `GET /h5p/edit/:contentId`: Edit H5P content

## Examples

### List Libraries

```bash
curl -X GET "http://localhost:8080/h5p/libraries" -H "Accept: application/json" -H "x-api-key: API_KEY_1"
```

### Create Content

```bash
curl -X POST "http://localhost:8080/h5p/new" -H "Content-Type: application/json" -H "x-api-key: API_KEY_1" -d '{"library":"H5P.InteractiveVideo 1.27.9","params":{"interactiveVideo":{"video":{"startScreenOptions":{"title":"","hideStartTitle":false},"textTracks":{"videoTrack":[]},"files":[]},"assets":{}}}}'
```

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

3. Verify the port is free:
   ```bash
   lsof -i :8080
   ```
   This should return nothing if the port is now available.

4. Try starting the server again.

### REST API Server vs Examples Server

There are two server options available:

1. **REST Example Server** (`npm run start:rest:server`):
   - Focused on the REST API
   - Includes API key authentication
   - May have CSRF token requirements for POST requests

2. **H5P Examples Server** (`npm start`):
   - More feature-rich UI
   - Easier to use for content creation
   - Includes visual editor for H5P content
   - Better for testing and development

If you're encountering issues with the REST example server, try using the H5P examples server instead for development purposes.

### CSRF Token Issues

When making POST requests directly to the API, you might encounter CSRF token errors:

```
ForbiddenError: invalid csrf token
```

To work around this when testing:

1. First, get a session and CSRF token by logging in:
   ```bash
   curl -X POST "http://localhost:8080/login" -H "Content-Type: application/json" -d '{"username":"teacher1","password":"h5p"}' -c cookies.txt
   ```

2. Use the session cookie and CSRF token in subsequent requests:
   ```bash
   curl -b cookies.txt -X POST "http://localhost:8080/h5p/new" -H "Content-Type: application/json" -H "x-csrf-token: YOUR_TOKEN" -H "x-api-key: API_KEY_1" -d '{"library":"H5P.MultiChoice 1.16.14","params":{"metadata":{"title":"Test API Question","license":"U"},"params":{"question":"What is H5P?","answers":[{"text":"An interactive content framework","correct":true},{"text":"A programming language","correct":false},{"text":"A database system","correct":false}],"behaviour":{"enableRetry":true,"enableSolutionsButton":true,"singlePoint":true}}}}'
   ```

### Using the Web UI

For easier content creation, use the web UI:

1. Open a browser and navigate to `http://localhost:8080/h5p/new`
2. Select a content type (like MultiChoice, Interactive Video, etc.)
3. Create your content using the visual editor
4. Save the content
5. View your content at `http://localhost:8080/h5p/play/{contentId}`

### Checking Existing Content

To see what content is already in the system:

```bash
curl "http://localhost:8080/" -s | grep "h5p/play"
```

## Advanced Configuration

For production use, consider:

1. Disabling API access without authentication:
   ```typescript
   // Configure ApiKeyManager with allowNoAuth set to false
   const apiKeyManager = new ApiKeyManager({
     allowNoAuth: false
   });
   ```

2. Setting up proper CORS restrictions:
   ```typescript
   // Update CORS settings in index.ts
   app.use(cors({
     origin: ['https://yourdomain.com'],
     credentials: true
   }));
   ``` 