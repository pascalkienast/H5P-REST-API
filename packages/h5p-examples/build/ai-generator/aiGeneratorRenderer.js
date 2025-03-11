"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = renderAiGeneratorPage;
function renderAiGeneratorPage(editor) {
    return async (req, res) => {
        const contentIds = await editor.contentManager.listContent();
        const contentObjects = await Promise.all(contentIds.map(async (id) => ({
            content: await editor.contentManager.getContentMetadata(id, req.user),
            id
        })));
        res.send(`
        <!doctype html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>H5P AI Content Generator</title>
            <script src="/require.js"></script>
            <link rel="stylesheet" href="/bootstrap.min.css">
            <link rel="stylesheet" href="/fontawesome-free/css/all.min.css">
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f8f9fa;
                    color: #333;
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background-color: #fff;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    padding: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    margin-bottom: 10px;
                    color: #4a154b;
                }
                .generator-card {
                    background-color: #fff;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    padding: 30px;
                    margin-bottom: 30px;
                }
                .content-card {
                    background-color: #fff;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    padding: 20px;
                    margin-bottom: 20px;
                }
                #preview-container {
                    border-radius: 10px;
                    overflow: hidden;
                    min-height: 400px;
                    display: none;
                    margin-top: 30px;
                }
                #preview-iframe {
                    width: 100%;
                    height: 600px;
                    border: none;
                }
                .btn-primary {
                    background-color: #4a154b;
                    border-color: #4a154b;
                }
                .btn-primary:hover {
                    background-color: #3a1239;
                    border-color: #3a1239;
                }
                #loading {
                    display: none;
                    text-align: center;
                    margin: 20px 0;
                }
                .spinner-border {
                    width: 3rem;
                    height: 3rem;
                }
                .content-list {
                    margin-top: 30px;
                }
                .content-item {
                    border-radius: 8px;
                    transition: all 0.3s ease;
                }
                .content-item:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                }
                .content-title {
                    font-size: 1.2rem;
                    font-weight: 600;
                    margin-bottom: 5px;
                }
                .content-meta {
                    font-size: 0.85rem;
                    color: #666;
                }
                .btn-action {
                    padding: 0.4rem 0.75rem;
                    font-size: 0.9rem;
                }
                @media (max-width: 768px) {
                    .btn-action {
                        margin-top: 5px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1><i class="fas fa-magic me-2"></i>H5P AI Content Generator</h1>
                    <p class="lead">Generate interactive H5P content using AI based on your ideas</p>
                </div>
                
                <div class="generator-card">
                    <h2 class="mb-4">Generate New Content</h2>
                    <form id="generator-form">
                        <div class="mb-3">
                            <label for="prompt" class="form-label">Describe your H5P content idea:</label>
                            <textarea 
                                class="form-control" 
                                id="prompt" 
                                rows="3" 
                                placeholder="e.g., Create a quiz about German history for elementary school students"
                                required
                            ></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-wand-magic-sparkles me-2"></i>Generate Content
                        </button>
                    </form>
                    
                    <div id="loading">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-3">Generating your H5P content. This may take a minute...</p>
                    </div>
                    
                    <div id="preview-container">
                        <h3 class="mb-3">Content Preview</h3>
                        <iframe id="preview-iframe" title="H5P Content Preview"></iframe>
                        <div class="mt-3">
                            <a id="download-link" class="btn btn-primary" href="#" target="_blank">
                                <i class="fas fa-download me-2"></i>Download H5P File
                            </a>
                        </div>
                    </div>
                </div>
                
                <div class="content-card content-list">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2><i class="fas fa-file me-2"></i>Your Content Library</h2>
                        <a class="btn btn-outline-primary" href="${editor.config.baseUrl}/new">
                            <i class="fas fa-plus-circle me-2"></i>Create Content Manually
                        </a>
                    </div>
                    
                    <div class="list-group">
                    ${contentObjects
            .map((content) => `<div class="list-group-item content-item mb-2">
                                    <div class="d-flex flex-column flex-md-row w-100 justify-content-between">
                                        <div class="mb-2 mb-md-0">
                                            <a href="${editor.config.baseUrl}${editor.config.playUrl}/${content.id}" class="content-title">
                                                ${content.content.title}
                                            </a>
                                            <div class="content-meta d-flex flex-wrap">
                                                <div class="me-3">
                                                    <i class="fas fa-book-open me-1"></i>
                                                    ${content.content.mainLibrary}
                                                </div>
                                                <div>
                                                    <i class="fas fa-fingerprint me-1"></i>
                                                    ${content.id}
                                                </div>
                                            </div>
                                        </div>
                                        <div class="d-flex flex-wrap">
                                            <a class="btn btn-sm btn-outline-secondary btn-action me-2" href="${editor.config.baseUrl}/edit/${content.id}">
                                                <i class="fas fa-pencil-alt me-1"></i>
                                                Edit
                                            </a>
                                            <a class="btn btn-sm btn-outline-info btn-action me-2" href="${editor.config.baseUrl}${editor.config.downloadUrl}/${content.id}">
                                                <i class="fas fa-file-download me-1"></i>
                                                Download
                                            </a>
                                            <a class="btn btn-sm btn-outline-danger btn-action" href="${editor.config.baseUrl}/delete/${content.id}">
                                                <i class="fas fa-trash-alt me-1"></i>
                                                Delete
                                            </a>
                                        </div>
                                    </div>
                                </div>`)
            .join('')}
                    </div>
                </div>
            </div>

            <script>
                document.addEventListener('DOMContentLoaded', function() {
                    const generatorForm = document.getElementById('generator-form');
                    const promptInput = document.getElementById('prompt');
                    const loadingDiv = document.getElementById('loading');
                    const previewContainer = document.getElementById('preview-container');
                    const previewIframe = document.getElementById('preview-iframe');
                    const downloadLink = document.getElementById('download-link');
                    
                    generatorForm.addEventListener('submit', async function(event) {
                        event.preventDefault();
                        
                        const prompt = promptInput.value.trim();
                        if (!prompt) return;
                        
                        // Show loading, hide preview
                        loadingDiv.style.display = 'block';
                        previewContainer.style.display = 'none';
                        
                        try {
                            const response = await fetch('/h5p/ai-generate', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ prompt })
                            });
                            
                            if (!response.ok) {
                                throw new Error('Failed to generate content');
                            }
                            
                            const data = await response.json();
                            console.log('Generated content:', data);
                            
                            // Update the preview iframe and download link
                            previewIframe.src = \`${editor.config.baseUrl}${editor.config.playUrl}/\${data.contentId}\`;
                            downloadLink.href = \`${editor.config.baseUrl}${editor.config.downloadUrl}/\${data.contentId}\`;
                            
                            // Hide loading, show preview
                            loadingDiv.style.display = 'none';
                            previewContainer.style.display = 'block';
                            
                        } catch (error) {
                            console.error('Error generating content:', error);
                            alert('Failed to generate content. Please try again.');
                            loadingDiv.style.display = 'none';
                        }
                    });
                });
            </script>
        </body>
        </html>
        `);
    };
}
//# sourceMappingURL=aiGeneratorRenderer.js.map