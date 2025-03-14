"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = render;
function render(editor) {
    return async (req, res) => {
        const contentIds = await editor.contentManager.listContent();
        const contentObjects = await Promise.all(contentIds.map(async (id) => ({
            content: await editor.contentManager.getContentMetadata(id, req.user),
            id
        })));
        // Check if available content section should be shown
        const showAvailableContent = process.env.SHOW_AVAILABLE_CONTENT === 'true';
        res.send(`
        <!doctype html>
        <html>
        <head>
            <meta charset="utf-8">
            <script src="/require.js"></script>
            <link rel="stylesheet" href="/bootstrap.min.css">
            <link rel="stylesheet" href="/fontawesome-free/css/all.min.css">
            <title>H5P API Server</title>
        </head>
        <body>
            <div class="container">
                <h1>H5P REST API Server</h1>
                <div class="alert alert-info">
                    <p>This server provides a REST API for H5P content. Access the API endpoints with the prefix <code>/h5p/</code></p>
                    <p>For API documentation and usage instructions, please refer to the <a href="https://github.com/pascalkienast/H5P-AI-Generator">GitHub repository</a> and the README.md file.</p>
                    <p>Authentication: API endpoints can be accessed using API keys in the request header: <code>x-api-key: YOUR_API_KEY</code></p>
                </div>
                
                ${showAvailableContent ? `
                <h2>
                    <span class="fa fa-file"></span> Available Content
                </h2>
                <a class="btn btn-primary my-2" href="${editor.config.baseUrl}/new"><span class="fa fa-plus-circle m-2"></span>Create new content</a>
                <div class="list-group">
                ${contentObjects
            .map((content) => `<div class="list-group-item">
                                <div class="d-flex w-10">
                                    <div class="me-auto p-2 align-self-center">
                                        <a href="${editor.config.baseUrl}${editor.config.playUrl}/${content.id}">
                                            <h5>${content.content.title}</h5>
                                        </a>
                                        <div class="small d-flex">                                            
                                            <div class="me-2">
                                                <span class="fa fa-book-open"></span>
                                                ${content.content.mainLibrary}
                                            </div>
                                            <div class="me-2">
                                                <span class="fa fa-fingerprint"></span>
                                                ${content.id}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="p-2">                                        
                                        <a class="btn btn-secondary" href="${editor.config.baseUrl}/edit/${content.id}">
                                            <span class="fa fa-pencil-alt m-1"></span>
                                            edit
                                        </a>
                                    </div>
                                    <div class="p-2">
                                        <a class="btn btn-info" href="${editor.config.baseUrl}${editor.config.downloadUrl}/${content.id}">
                                            <span class="fa fa-file-download m-1"></span>
                                            download
                                        </a>
                                    </div>
                                    <div class="p-2">
                                        <a class="btn btn-info" href="${editor.config.baseUrl}/html/${content.id}">
                                            <span class="fa fa-file-download m-1"></span>
                                            download HTML
                                        </a>
                                    </div>
                                    <div class="p-2">
                                        <a class="btn btn-danger" href="${editor.config.baseUrl}/delete/${content.id}">
                                            <span class="fa fa-trash-alt m-1"></span>
                                            delete
                                        </a>
                                    </div>
                                </div>                                
                            </div>`)
            .join('')}
                </div>
                ` : `
                <h2>Content Management</h2>
                <p>The content listing is hidden by default. To access content management features:</p>
                <ul>
                    <li>Create new content: <a href="${editor.config.baseUrl}/new">Create new content</a></li>
                    <li>Edit content: Access <code>${editor.config.baseUrl}/edit/[contentId]</code> directly</li>
                    <li>Play content: Access <code>${editor.config.baseUrl}${editor.config.playUrl}/[contentId]</code> directly</li>
                </ul>
                <p>To enable the content listing, set the environment variable <code>SHOW_AVAILABLE_CONTENT=true</code></p>
                `}
                <hr/>
                <h3>API Endpoints</h3>
                <div class="list-group">
                    <div class="list-group-item">
                        <h5>GET /h5p/libraries</h5>
                        <p>Get a list of all available content types/libraries</p>
                    </div>
                    <div class="list-group-item">
                        <h5>POST /h5p/new</h5>
                        <p>Create new H5P content</p>
                    </div>
                    <div class="list-group-item">
                        <h5>GET /h5p/play/:contentId</h5>
                        <p>Play/display H5P content</p>
                    </div>
                    <div class="list-group-item">
                        <h5>GET /h5p/edit/:contentId</h5>
                        <p>Edit existing H5P content</p>
                    </div>
                </div>
                <hr/>
                <div id="content-type-cache-container" style="display: none;"></div>
                <div id="library-admin-container" style="display: none;"></div>
            </div>

            <script>
                requirejs.config({
                    baseUrl: "assets/js",
                    paths: {
                        react: '/react/umd/react.development',
                        "react-dom": '/react-dom/umd/react-dom.development'
                    }
                });
                requirejs([
                    "react",
                    "react-dom",
                    "./client/LibraryAdminComponent.js",
                    "./client/ContentTypeCacheComponent.js"], 
                    function (React, ReactDOM, LibraryAdmin, ContentTypeCache) {
                        const libraryAdminContainer = document.querySelector('#library-admin-container');
                        ReactDOM.render(React.createElement(LibraryAdmin.default, { endpointUrl: 'h5p/libraries' }), libraryAdminContainer);
                        const contentTypeCacheContainer = document.querySelector('#content-type-cache-container');
                        ReactDOM.render(React.createElement(ContentTypeCache.default, { endpointUrl: 'h5p/content-type-cache' }), contentTypeCacheContainer);
                    });                
            </script>
        </body>
        `);
    };
}
//# sourceMappingURL=startPageRenderer.js.map