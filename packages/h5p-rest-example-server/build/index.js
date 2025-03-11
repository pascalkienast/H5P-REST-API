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
const tmp_promise_1 = require("tmp-promise");
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const i18next_1 = __importDefault(require("i18next"));
const i18next_fs_backend_1 = __importDefault(require("i18next-fs-backend"));
const i18next_http_middleware_1 = __importDefault(require("i18next-http-middleware"));
const path_1 = __importDefault(require("path"));
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const express_session_1 = __importDefault(require("express-session"));
const csurf_1 = __importDefault(require("@dr.pogodin/csurf"));
const cors_1 = __importDefault(require("cors"));
const h5p_express_1 = require("@lumieducation/h5p-express");
// Import local API key authentication middleware
const middleware_1 = require("./middleware");
const H5P = __importStar(require("@lumieducation/h5p-server"));
const routes_1 = __importDefault(require("./routes"));
const ExampleUser_1 = __importStar(require("./ExampleUser"));
const createH5PEditor_1 = __importDefault(require("./createH5PEditor"));
const utils_1 = require("./utils");
const ExamplePermissionSystem_1 = __importDefault(require("./ExamplePermissionSystem"));
let tmpDir;
const userTable = {
    teacher1: {
        username: 'teacher1',
        name: 'Teacher 1',
        email: 'teacher1@example.com',
        role: 'teacher'
    },
    teacher2: {
        username: 'teacher2',
        name: 'Teacher 2',
        email: 'teacher2@example.com',
        role: 'teacher'
    },
    student1: {
        username: 'student1',
        name: 'Student 1',
        email: 'student1@example.com',
        role: 'student'
    },
    student2: {
        username: 'student2',
        name: 'Student 2',
        email: 'student2@example.com',
        role: 'student'
    },
    admin: {
        username: 'admin',
        name: 'Administration',
        email: 'admin@example.com',
        role: 'admin'
    },
    anonymous: {
        username: 'anonymous',
        name: 'Anonymous',
        email: '',
        role: 'anonymous'
    }
};
const initPassport = () => {
    passport_1.default.use(new passport_local_1.Strategy((username, password, callback) => {
        // We don't check the password. In a real application you'll perform
        // DB access here.
        const user = userTable[username];
        if (!user) {
            callback('User not found in user table');
        }
        else {
            callback(null, user);
        }
    }));
    passport_1.default.serializeUser((user, done) => {
        done(null, user);
    });
    passport_1.default.deserializeUser((user, done) => {
        done(null, user);
    });
};
const addCsrfTokenToUser = (req, res, next) => {
    req.user.csrfToken = req.csrfToken;
    next();
};
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
    const config = await new H5P.H5PConfig(new H5P.fsImplementations.JsonStorage(path_1.default.resolve('config.json'))).load();
    const urlGenerator = new H5P.UrlGenerator(config, {
        queryParamGenerator: (user) => {
            if (user.csrfToken) {
                return {
                    name: '_csrf',
                    value: user.csrfToken()
                };
            }
            return {
                name: '',
                value: ''
            };
        },
        protectAjax: true,
        protectContentUserData: true,
        protectSetFinished: true
    });
    const permissionSystem = new ExamplePermissionSystem_1.default();
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
    const h5pEditor = await (0, createH5PEditor_1.default)(config, urlGenerator, permissionSystem, path_1.default.resolve('h5p/libraries'), // the path on the local disc where
    // libraries should be stored)
    path_1.default.resolve('h5p/content'), // the path on the local disc where content
    // is stored. Only used / necessary if you use the local filesystem
    // content storage class.
    path_1.default.resolve('h5p/temporary-storage'), // the path on the local disc
    // where temporary files (uploads) should be stored. Only used /
    // necessary if you use the local filesystem temporary storage class.
    path_1.default.resolve('h5p/user-data'), (key, language) => translationFunction(key, { lng: language }));
    h5pEditor.setRenderer((model) => model);
    // The H5PPlayer object is used to display H5P content.
    const h5pPlayer = new H5P.H5PPlayer(h5pEditor.libraryStorage, h5pEditor.contentStorage, config, undefined, urlGenerator, undefined, { permissionSystem }, h5pEditor.contentUserDataStorage);
    h5pPlayer.setRenderer((model) => model);
    // We now set up the Express server in the usual fashion.
    const server = (0, express_1.default)();
    // Configure CORS for external API access
    const corsOptions = {
        origin: process.env.NODE_ENV === 'production'
            ? process.env.ALLOWED_ORIGINS?.split(',') || [] // In production, specify allowed origins
            : '*', // In development, allow all origins
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Accept', 'x-api-key'],
        credentials: true // Allow cookies for session-based auth if needed
    };
    server.use((0, cors_1.default)(corsOptions));
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
    // Initialize session with cookie storage
    server.use((0, express_session_1.default)({ secret: 'mysecret', resave: false, saveUninitialized: false }));
    // Initialize passport for login
    initPassport();
    server.use(passport_1.default.initialize());
    server.use(passport_1.default.session());
    // Initialize API key authentication
    // Create a new API key manager that loads keys from the file
    const apiKeyManager = new middleware_1.ApiKeyManager({
        configFile: path_1.default.resolve('api-keys.json'),
        // You can also load API keys from environment variables with this prefix
        envPrefix: 'H5P_API_KEY',
        // In development, you can allow requests without API keys
        allowNoAuth: process.env.NODE_ENV === 'development'
    });
    // Create a middleware function to process API key authentication
    const apiKeyMiddleware = (0, middleware_1.apiKeyAuth)(apiKeyManager.getConfig());
    // Initialize CSRF protection. If we add it as middleware, it checks if a
    // token was passed into a state altering route. We pass this token to the
    // client in two ways:
    //   - Return it as a property of the return data on login (used for the CUD
    //     routes in the content service)
    //   - Add the token to the URLs in the H5PIntegration object as a query
    //     parameter. This is done by passing in a custom UrlGenerator that gets
    //     the csrfToken from the user object. We put the token into the user
    //     object in the addCsrfTokenToUser middleware.
    const csrfProtection = (0, csurf_1.default)();
    // It is important that you inject a user object into the request object!
    // The Express adapter below (H5P.adapters.express) expects the user
    // object to be present in requests.
    server.use((req, res, next) => {
        // Check for API key user in the request
        if (req.user && !req.user.username) {
            // If the user is from an API key, create an ExampleUser from it
            req.user = (0, ExampleUser_1.createUserFromApiKey)(req.user);
        }
        // Maps the user received from passport to the one expected by
        // h5p-express and h5p-server
        else if (req.user) {
            req.user = new ExampleUser_1.default(req.user.username, req.user.name, req.user.email, req.user.role);
        }
        else {
            req.user = new ExampleUser_1.default('anonymous', 'Anonymous', '', 'anonymous');
        }
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
    server.use(h5pEditor.config.baseUrl, csrfProtection, apiKeyMiddleware, (0, h5p_express_1.h5pAjaxExpressRouter)(h5pEditor, path_1.default.resolve('h5p/core'), // the path on the local disc where the
    // files of the JavaScript client of the player are stored
    path_1.default.resolve('h5p/editor'), // the path on the local disc where the
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
    server.use(h5pEditor.config.baseUrl, csrfProtection, 
    // We need to add the token to the user by adding the addCsrfTokenToUser
    // middleware, so that the UrlGenerator can read it when we generate the
    // integration object with the URLs that contain the token.
    addCsrfTokenToUser, apiKeyMiddleware, (0, routes_1.default)(h5pEditor, h5pPlayer, 'auto' // You can change the language of the editor here by setting
    // the language code you need here. 'auto' means the route will try
    // to use the language detected by the i18next language detector.
    ));
    // The LibraryAdministrationExpress routes are REST endpoints that offer
    // library management functionality.
    server.use(`${h5pEditor.config.baseUrl}/libraries`, csrfProtection, (0, h5p_express_1.libraryAdministrationExpressRouter)(h5pEditor));
    // The ContentTypeCacheExpress routes are REST endpoints that allow updating
    // the content type cache manually.
    server.use(`${h5pEditor.config.baseUrl}/content-type-cache`, csrfProtection, (0, h5p_express_1.contentTypeCacheExpressRouter)(h5pEditor.contentTypeCache));
    // Simple login endpoint that returns HTTP 200 on auth and sets the user in
    // the session
    server.post('/login', passport_1.default.authenticate('local', {
        failWithError: true
    }), (0, csurf_1.default)({
        // We need csurf to get the token for the current session, but we
        // don't want to protect the current route, as the login can't have
        // a CSRF token.
        ignoreMethods: ['POST']
    }), function (req, res) {
        res.status(200).json({
            username: req.user.username,
            email: req.user.email,
            name: req.user.name,
            csrfToken: req.csrfToken()
        });
    });
    server.post('/logout', csrfProtection, (req, res) => {
        req.logout((err) => {
            if (!err) {
                res.status(200).send();
            }
            else {
                res.status(500).send(err.message);
            }
        });
    });
    const port = process.env.PORT || '8080';
    // For developer convenience we display a list of IPs, the server is running
    // on. You can then simply click on it in the terminal.
    (0, utils_1.displayIps)(port);
    server.listen(port);
};
// We can't use await outside a an async function, so we use the start()
// function as a workaround.
start();
//# sourceMappingURL=index.js.map