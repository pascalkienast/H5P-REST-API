# H5P Examples Server

This repository contains a feature-rich H5P server implementation that allows you to create, edit, and share interactive HTML5 content.

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

## API Access

The server also provides API access for advanced users. For detailed API documentation, see [API_DOC.md](API_DOC.md).

## Advanced Configuration

For production use, consider:

1. Configuring authentication
2. Setting up proper CORS restrictions
3. Using a production-grade database

For details about the REST API version (less user-friendly but programmable), see the [REST API documentation](packages/h5p-rest-example-server/README.md).

## License

This project is licensed under the MIT License - see the LICENSE file for details. 