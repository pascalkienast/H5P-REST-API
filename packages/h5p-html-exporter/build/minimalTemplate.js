"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (integration, scriptsBundle, stylesBundle, contentId) => `
<!DOCTYPE html>
<html class="h5p-iframe">
    <head>
        <meta charset="utf-8">                    
        <script>H5PIntegration = ${JSON.stringify({
    ...integration,
    baseUrl: '.',
    url: '.',
    ajax: { setFinished: '', contentUserData: '' },
    saveFreq: false,
    libraryUrl: ''
})};
        ${scriptsBundle}</script>
        <style>${stylesBundle}</style>
    </head>
    <body>
        <div class="h5p-content lag" data-content-id="${contentId}"></div>                
    </body>
</html>`;
//# sourceMappingURL=minimalTemplate.js.map