# H5P REST API Server

This repository contains a feature-rich H5P server implementation that allows you to create, edit, and share interactive HTML5 content.

> **IMPORTANT**: This project is specifically focused on the application provided through the `packages/h5p-main` directory. All instructions and documentation in this README refer to working with this example server implementation.

## Prerequisites

- Node.js (v20 or higher) - check package.json for exact requirements
- npm (v7 or higher)
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

This installation process will:
- Install all required dependencies
- Build all packages in the correct order (including the h5p-main package)
- Download the necessary H5P core files
- Update the content type cache

### 3. Building the H5P Main Server

While the postinstall script should automatically build all packages, you can also build just the h5p-main package if needed:

```bash
# Build only the h5p-main package
npm run build:h5p-main

# Alternatively, navigate to the package directory and build
cd packages/h5p-main && npm run build
```

### 4. Start the H5P Main Server

The H5P Main Server provides a complete UI with content editor and player:

```bash
npm start
```

This will start the default example server at `http://localhost:8080`.

## Features

- Create and edit H5P content using the visual editor
- Play existing H5P content
- Upload H5P packages
- Download H5P content as .h5p files
- Full integration with H5P Hub
- Mobile-friendly interface

## Using the H5P Main Server

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
   - Create a `.env` file in the `packages/h5p-main/` directory (not in the root directory)
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
