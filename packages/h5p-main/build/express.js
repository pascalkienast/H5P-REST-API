"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const tmp_promise_1 = require("tmp-promise");
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const i18next_1 = __importDefault(require("i18next"));
const i18next_fs_backend_1 = __importDefault(require("i18next-fs-backend"));
const i18next_http_middleware_1 = __importDefault(require("i18next-http-middleware"));
const path_1 = __importDefault(require("path"));
const h5p_express_1 = require("@lumieducation/h5p-express");
const h5p_html_exporter_1 = __importDefault(require("@lumieducation/h5p-html-exporter"));
const H5P = __importStar(require("@lumieducation/h5p-server"));
const startPageRenderer_1 = __importDefault(require("./startPageRenderer"));
const expressRoutes_1 = __importDefault(require("./expressRoutes"));
const User_1 = __importDefault(require("./User"));
const createH5PEditor_1 = __importDefault(require("./createH5PEditor"));
const utils_1 = require("./utils");
let tmpDir;
const start = async () => {
    const useTempUploads = process.env.TEMP_UPLOADS != 'false';
    if (useTempUploads) {
        tmpDir = await (0, tmp_promise_1.dir)({ keep: false, unsafeCleanup: true });
    }
    // We use i18next to localize messages sent to the user. You can use any
    // localization library you like.
    const translationFunction = await i18next_1.default
        .use(i18next_fs_backend_1.default)
        .use(i18next_http_middleware_1.default.LanguageDetector) // This will add the
        // properties language and languages to the req object. See
        // https://github.com/i18next/i18next-http-middleware#adding-own-detection-functionality
        // how to detect language in your own fashion. You can also choose not
        // to add a detector if you only want to use one language.
        .init({
        backend: {
            loadPath: path_1.default.join(__dirname, '../../../node_modules/@lumieducation/h5p-server/build/assets/translations/{{ns}}/{{lng}}.json')
        },
        debug: process.env.DEBUG && process.env.DEBUG.includes('i18n'),
        defaultNS: 'server',
        fallbackLng: 'en',
        ns: [
            'client',
            'copyright-semantics',
            'hub',
            'library-metadata',
            'metadata-semantics',
            'mongo-s3-content-storage',
            's3-temporary-storage',
            'server',
            'storage-file-implementations'
        ],
        preload: ['en', 'de'] // If you don't use a language detector of
        // i18next, you must preload all languages you want to use!
    });
    // Load the configuration file from the local file system
    const config = await new H5P.H5PConfig(new H5P.fsImplementations.JsonStorage(path_1.default.join(__dirname, '../config.json'))).load();
    // The H5PEditor object is central to all operations of h5p-nodejs-library
    // if you want to user the editor component.
    //
    // To create the H5PEditor object, we call a helper function, which
    // uses implementations of the storage classes with a local filesystem
    // or a MongoDB/S3 backend, depending on the configuration values set
    // in the environment variables.
    // In your implementation, you will probably instantiate H5PEditor by
    // calling new H5P.H5PEditor(...) or by using the convenience function
    // H5P.fs(...).
    const h5pEditor = await (0, createH5PEditor_1.default)(config, path_1.default.join(__dirname, '../h5p/libraries'), // the path on the local disc where
    // libraries should be stored)
    path_1.default.join(__dirname, '../h5p/content'), // the path on the local disc where content
    // is stored. Only used / necessary if you use the local filesystem
    // content storage class.
    path_1.default.join(__dirname, '../h5p/temporary-storage'), // the path on the local disc
    // where temporary files (uploads) should be stored. Only used /
    // necessary if you use the local filesystem temporary storage class.,
    path_1.default.join(__dirname, '../h5p/user-data'), (key, language) => translationFunction(key, { lng: language }));
    // The H5PPlayer object is used to display H5P content.
    const h5pPlayer = new H5P.H5PPlayer(h5pEditor.libraryStorage, h5pEditor.contentStorage, config, undefined, undefined, (key, language) => translationFunction(key, { lng: language }), undefined, h5pEditor.contentUserDataStorage);
    // We now set up the Express server in the usual fashion.
    const server = (0, express_1.default)();
    server.use(body_parser_1.default.json({ limit: '500mb' }));
    server.use(body_parser_1.default.urlencoded({
        extended: true
    }));
    // Configure file uploads
    server.use((0, express_fileupload_1.default)({
        limits: { fileSize: h5pEditor.config.maxTotalSize },
        useTempFiles: useTempUploads,
        tempFileDir: useTempUploads ? tmpDir?.path : undefined
    }));
    // delete temporary files left over from uploads
    if (useTempUploads) {
        server.use((req, res, next) => {
            res.on('finish', async () => (0, utils_1.clearTempFiles)(req));
            next();
        });
    }
    // It is important that you inject a user object into the request object!
    // The Express adapter below (H5P.adapters.express) expects the user
    // object to be present in requests.
    // In your real implementation you would create the object using sessions,
    // JSON webtokens or some other means.
    server.use((req, res, next) => {
        req.user = new User_1.default();
        next();
    });
    // The i18nextExpressMiddleware injects the function t(...) into the req
    // object. This function must be there for the Express adapter
    // (H5P.adapters.express) to function properly.
    server.use(i18next_http_middleware_1.default.handle(i18next_1.default));
    // The Express adapter handles GET and POST requests to various H5P
    // endpoints. You can add an options object as a last parameter to configure
    // which endpoints you want to use. In this case we don't pass an options
    // object, which means we get all of them.
    server.use(h5pEditor.config.baseUrl, (0, h5p_express_1.h5pAjaxExpressRouter)(h5pEditor, path_1.default.resolve(path_1.default.join(__dirname, '../h5p/core')), // the path on the local disc where the
    // files of the JavaScript client of the player are stored
    path_1.default.resolve(path_1.default.join(__dirname, '../h5p/editor')), // the path on the local disc where the
    // files of the JavaScript client of the editor are stored
    undefined, 'auto' // You can change the language of the editor here by setting
    // the language code you need here. 'auto' means the route will try
    // to use the language detected by the i18next language detector.
    ));
    // The expressRoutes are routes that create pages for these actions:
    // - Creating new content
    // - Editing content
    // - Saving content
    // - Deleting content
    server.use(h5pEditor.config.baseUrl, (0, expressRoutes_1.default)(h5pEditor, h5pPlayer, 'auto' // You can change the language of the editor by setting
    // the language code you need here. 'auto' means the route will try
    // to use the language detected by the i18next language detector.
    ));
    // The LibraryAdministrationExpress routes are REST endpoints that offer
    // library management functionality.
    server.use(`${h5pEditor.config.baseUrl}/libraries`, (0, h5p_express_1.libraryAdministrationExpressRouter)(h5pEditor));
    // The ContentTypeCacheExpress routes are REST endpoints that allow updating
    // the content type cache manually.
    server.use(`${h5pEditor.config.baseUrl}/content-type-cache`, (0, h5p_express_1.contentTypeCacheExpressRouter)(h5pEditor.contentTypeCache));
    const htmlExporter = new h5p_html_exporter_1.default(h5pEditor.libraryStorage, h5pEditor.contentStorage, h5pEditor.config, path_1.default.join(__dirname, '../h5p/core'), path_1.default.join(__dirname, '../h5p/editor'));
    server.get('/h5p/html/:contentId', async (req, res) => {
        const html = await htmlExporter.createSingleBundle(req.params.contentId, req.user, {
            language: req.language ?? 'en',
            showLicenseButton: true
        });
        res.setHeader('Content-disposition', `attachment; filename=${req.params.contentId}.html`);
        res.status(200).send(html);
    });
    // The startPageRenderer displays a list of content objects and shows
    // buttons to display, edit, delete and download existing content.
    server.get('/', (0, startPageRenderer_1.default)(h5pEditor));
    server.use('/client', express_1.default.static(path_1.default.join(__dirname, 'client')));
    // Serve static files
    server.use('/', express_1.default.static(path_1.default.join(__dirname, '../public')));
    // Remove temporary directory on shutdown
    if (useTempUploads) {
        [
            'beforeExit',
            'uncaughtException',
            'unhandledRejection',
            'SIGQUIT',
            'SIGABRT',
            'SIGSEGV',
            'SIGTERM'
        ].forEach((evt) => process.on(evt, async () => {
            await tmpDir?.cleanup();
            tmpDir = null;
        }));
    }
    const port = process.env.PORT || '8080';
    // For developer convenience we display a list of IPs, the server is running
    // on. You can then simply click on it in the terminal.
    (0, utils_1.displayIps)(port);
    server.listen(port);
};
// We can't use await outside a an async function, so we use the start()
// function as a workaround.
start();
//# sourceMappingURL=express.js.map