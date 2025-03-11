# H5P API Documentation

This document provides detailed information about the REST API endpoints used by the H5P application, documented through browser network request analysis. Each section represents a different type of action and includes the corresponding curl commands to replicate these actions.

## Table of Contents
- [Introduction](#introduction)
- [Authentication](#authentication)
- [Content Type Management](#content-type-management)
  - [Listing Available Content Types](#listing-available-content-types)
  - [Installing Content Types](#installing-content-types)
- [Content Management](#content-management)
  - [Creating Content](#creating-content)
  - [Editing Content](#editing-content)
  - [Getting Content](#getting-content)
  - [Deleting Content](#deleting-content)
- [File Operations](#file-operations)
- [User Management](#user-management)

## Introduction

This documentation is based on the [Lumi Education REST API documentation](https://docs.lumi.education/usage/rest). The API endpoints are captured from live interactions with the H5P application running at http://localhost:8080/hp5/new.

## Authentication

H5P API endpoints may require authentication tokens depending on the configuration. If authentication is required, most requests will include an Authorization header with a Bearer token.

```bash
curl -X POST "http://localhost:8080/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user@example.com",
    "password": "password123"
  }'
```

For authenticated requests:

```bash
curl -X GET "http://localhost:8080/h5p/content" \
  -H "Authorization: Bearer {token}" \
  -H "Accept: application/json"
```

## Content Type Management

### Listing Available Content Types

When the H5P Hub interface loads, it makes a request to retrieve the list of available content types. This information is displayed in the content type selection interface.

```bash
curl -X GET "http://localhost:8080/h5p/libraries?machineName=&majorVersion=&minorVersion=&patch=&runnable=1&page=0" \
  -H "Accept: application/json"
```

The response includes a list of available content types, their metadata, and install status.

### Installing Content Types

To install a content type like Multiple Choice, the following request is made:

```bash
curl -X POST "http://localhost:8080/h5p/libraries/install" \
  -H "Content-Type: application/json" \
  -d '{
    "machineName": "H5P.MultiChoice",
    "majorVersion": 1,
    "minorVersion": 16,
    "patchVersion": 3
  }'
```

*Note: The exact version numbers might vary based on what's available in the H5P Hub.*

The response typically includes details about the installation status and any dependencies that were also installed.

## Content Management

### Creating Content

When creating new H5P content, the following requests are typically made:

1. First, the editor configuration for the selected content type is retrieved:

```bash
curl -X GET "http://localhost:8080/h5p/content/new?libraryName=H5P.MultiChoice&majorVersion=1&minorVersion=16&patchVersion=3" \
  -H "Accept: application/json"
```

2. After configuring the content in the editor, a POST request is made to create the content:

```bash
curl -X POST "http://localhost:8080/h5p/content" \
  -H "Content-Type: application/json" \
  -d '{
    "library": "H5P.MultiChoice 1.16.3",
    "params": {
      "question": "What is the capital of Germany?",
      "answers": [
        {"text": "Berlin", "correct": true},
        {"text": "Hamburg", "correct": false},
        {"text": "Munich", "correct": false}
      ],
      "behaviour": {
        "enableRetry": true,
        "enableSolutionsButton": true
      }
    },
    "metadata": {
      "title": "Sample Multiple Choice Question"
    }
  }'
```

The response includes the newly created content ID, which can be used for further operations.

### Editing Content

To edit existing content, the following requests are made:

1. First, the content data is retrieved:

```bash
curl -X GET "http://localhost:8080/h5p/content/{contentId}/edit" \
  -H "Accept: application/json"
```

2. Then, the content is updated using a PATCH request:

```bash
curl -X PATCH "http://localhost:8080/h5p/content/{contentId}" \
  -H "Content-Type: application/json" \
  -d '{
    "library": "H5P.MultiChoice 1.16.3",
    "params": {
      "question": "What is the capital of Germany? (Updated)",
      "answers": [
        {"text": "Berlin", "correct": true},
        {"text": "Hamburg", "correct": false},
        {"text": "Munich", "correct": false},
        {"text": "Frankfurt", "correct": false}
      ],
      "behaviour": {
        "enableRetry": true,
        "enableSolutionsButton": true
      }
    },
    "metadata": {
      "title": "Updated Multiple Choice Question"
    }
  }'
```

### Getting Content

To retrieve existing content for display or embedding:

```bash
curl -X GET "http://localhost:8080/h5p/content/{contentId}" \
  -H "Accept: application/json"
```

To get a list of all H5P content:

```bash
curl -X GET "http://localhost:8080/h5p/content?page=0&limit=10" \
  -H "Accept: application/json"
```

### Deleting Content

To delete a piece of H5P content:

```bash
curl -X DELETE "http://localhost:8080/h5p/content/{contentId}" \
  -H "Accept: application/json"
```

## File Operations

When uploading media files (images, videos, audio) for use in H5P content, the following request is made:

```bash
curl -X POST "http://localhost:8080/h5p/files" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/image.jpg" \
  -F "contentId={contentId}" \
  -F "field=image"
```

To retrieve a file:

```bash
curl -X GET "http://localhost:8080/h5p/content/{contentId}/file/{filename}" \
  -H "Accept: application/json"
```

## User Management

For user management operations, the following endpoints might be used:

For login:

```bash
curl -X POST "http://localhost:8080/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user@example.com",
    "password": "password123"
  }'
```

For getting user information:

```bash
curl -X GET "http://localhost:8080/auth/user" \
  -H "Authorization: Bearer {token}" \
  -H "Accept: application/json"
```

For logout:

```bash
curl -X POST "http://localhost:8080/auth/logout" \
  -H "Authorization: Bearer {token}" \
  -H "Accept: application/json"
```