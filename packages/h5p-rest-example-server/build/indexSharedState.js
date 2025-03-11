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
const passport_local_1 = require("passport-local");
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const http_1 = __importDefault(require("http"));
const i18next_1 = __importDefault(require("i18next"));
const i18next_fs_backend_1 = __importDefault(require("i18next-fs-backend"));
const i18next_http_middleware_1 = __importDefault(require("i18next-http-middleware"));
const passport_1 = __importDefault(require("passport"));
const path_1 = __importDefault(require("path"));
const express_session_1 = __importDefault(require("express-session"));
const util_1 = require("util");
const cors_1 = __importDefault(require("cors"));
const h5p_express_1 = require("@lumieducation/h5p-express");
const H5P = __importStar(require("@lumieducation/h5p-server"));
const h5p_shared_state_server_1 = __importDefault(require("@lumieducation/h5p-shared-state-server"));
const routes_1 = __importDefault(require("./routes"));
const ExampleUser_1 = __importDefault(require("./ExampleUser"));
const createH5PEditor_1 = __importDefault(require("./createH5PEditor"));
const utils_1 = require("./utils");
const ExamplePermissionSystem_1 = __importDefault(require("./ExamplePermissionSystem"));
let tmpDir;
let sharedStateServer;
const users = {
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
        const user = users[username];
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
/**
 * Maps the user received from passport to the one expected by
 * h5p-express and h5p-server
 **/
const expressUserToH5PUser = (user) => {
    if (user) {
        return new ExampleUser_1.default(user.username, user.name, user.email, user.role);
    }
    else {
        return new ExampleUser_1.default('anonymous', 'Anonymous', '', 'anonymous');
    }
};
const start = async () => {
    const useTempUploads = process.env.TEMP_UPLOADS !== 'false';
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
    const h5pEditor = await (0, createH5PEditor_1.default)(config, undefined, permissionSystem, path_1.default.resolve('h5p/libraries'), // the path on the local disc where
    // libraries should be stored)
    path_1.default.resolve('h5p/content'), // the path on the local disc where content
    // is stored. Only used / necessary if you use the local filesystem
    // content storage class.
    path_1.default.resolve('h5p/temporary-storage'), // the path on the local disc
    // where temporary files (uploads) should be stored. Only used /
    // necessary if you use the local filesystem temporary storage class.
    path_1.default.resolve('h5p/user-data'), (key, language) => translationFunction(key, { lng: language }), {
        contentWasDeleted: (contentId) => {
            return sharedStateServer.deleteState(contentId);
        },
        contentWasUpdated: (contentId) => {
            return sharedStateServer.deleteState(contentId);
        }
    });
    h5pEditor.setRenderer((model) => model);
    // The H5PPlayer object is used to display H5P content.
    const h5pPlayer = new H5P.H5PPlayer(h5pEditor.libraryStorage, h5pEditor.contentStorage, config, undefined, undefined, undefined, { permissionSystem });
    h5pPlayer.setRenderer((model) => model);
    // We now set up the Express server in the usual fashion.
    const app = (0, express_1.default)();
    app.use(body_parser_1.default.json({ limit: '500mb' }));
    app.use(body_parser_1.default.urlencoded({
        extended: true
    }));
    // Configure file uploads
    app.use((0, express_fileupload_1.default)({
        limits: { fileSize: h5pEditor.config.maxTotalSize },
        useTempFiles: useTempUploads,
        tempFileDir: useTempUploads ? tmpDir?.path : undefined
    }));
    // delete temporary files left over from uploads
    if (useTempUploads) {
        app.use((req, res, next) => {
            res.on('finish', async () => (0, utils_1.clearTempFiles)(req));
            next();
        });
    }
    // Initialize session with cookie storage
    const sessionParser = (0, express_session_1.default)({
        secret: 'mysecret',
        resave: false,
        saveUninitialized: false
    });
    app.use(sessionParser);
    const sessionParserPromise = (0, util_1.promisify)(sessionParser);
    // Initialize passport for login
    initPassport();
    const passportInitialize = passport_1.default.initialize();
    app.use(passportInitialize);
    const passportInitializePromise = (0, util_1.promisify)(passportInitialize);
    const passportSession = passport_1.default.session();
    app.use(passportSession);
    const passportSessionPromise = (0, util_1.promisify)(passportSession);
    // It is important that you inject a user object into the request object!
    // The Express adapter below (H5P.adapters.express) expects the user
    // object to be present in requests.
    app.use((req, res, next) => {
        req.user = expressUserToH5PUser(req.user);
        next();
    });
    // The i18nextExpressMiddleware injects the function t(...) into the req
    // object. This function must be there for the Express adapter
    // (H5P.adapters.express) to function properly.
    app.use(i18next_http_middleware_1.default.handle(i18next_1.default));
    // The Express adapter handles GET and POST requests to various H5P
    // endpoints. You can add an options object as a last parameter to configure
    // which endpoints you want to use. In this case we don't pass an options
    // object, which means we get all of them.
    app.use(h5pEditor.config.baseUrl, (0, h5p_express_1.h5pAjaxExpressRouter)(h5pEditor, path_1.default.resolve('h5p/core'), // the path on the local disc where the
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
    app.use(h5pEditor.config.baseUrl, (0, routes_1.default)(h5pEditor, h5pPlayer, 'auto' // You can change the language of the editor here by setting
    // the language code you need here. 'auto' means the route will try
    // to use the language detected by the i18next language detector.
    ));
    // The LibraryAdministrationExpress routes are REST endpoints that offer
    // library management functionality.
    app.use(`${h5pEditor.config.baseUrl}/libraries`, (0, h5p_express_1.libraryAdministrationExpressRouter)(h5pEditor));
    // The ContentTypeCacheExpress routes are REST endpoints that allow updating
    // the content type cache manually.
    app.use(`${h5pEditor.config.baseUrl}/content-type-cache`, (0, h5p_express_1.contentTypeCacheExpressRouter)(h5pEditor.contentTypeCache));
    // Simple login endpoint that returns HTTP 200 on auth and sets the user in
    // the session
    app.post('/login', passport_1.default.authenticate('local', {
        failWithError: true
    }), function (req, res) {
        res.status(200).json({
            username: req.user.username,
            email: req.user.email,
            name: req.user.name
        });
    });
    app.post('/logout', (req, res) => {
        req.logout((err) => {
            if (!err) {
                res.status(200).send();
            }
            else {
                res.status(500).send(err.message);
            }
        });
    });
    /**
     * The route returns information about the user. It is used by the client to
     * find out who the user is and what privilege level he/she has.
     */
    app.get('/auth-data/:contentId', (0, cors_1.default)({ credentials: true, origin: 'http://localhost:3000' }), (req, res) => {
        if (!req.user) {
            res.status(200).json({ level: 'anonymous' });
        }
        else {
            let level;
            if (users[req.user?.id]?.role === 'teacher' ||
                users[req.user?.id]?.role === 'admin') {
                level = 'privileged';
            }
            else {
                level = 'user';
            }
            res.status(200).json({
                level,
                userId: req.user.id?.toString()
            });
        }
    });
    const port = process.env.PORT || '8080';
    // For developer convenience we display a list of IPs, the server is running
    // on. You can then simply click on it in the terminal.
    (0, utils_1.displayIps)(port);
    // We need to create our own http server to pass it to the shared state
    // package.
    const server = http_1.default.createServer(app);
    // Add shared state websocket and ShareDB to the server
    sharedStateServer = new h5p_shared_state_server_1.default(server, h5pEditor.libraryManager.libraryStorage.getLibrary.bind(h5pEditor.libraryManager.libraryStorage), h5pEditor.libraryManager.libraryStorage.getFileAsJson.bind(h5pEditor.libraryManager.libraryStorage), async (req) => {
        // We get the raw request that was upgraded to the websocket from
        // SharedStateServer and have to get the user for it from the
        // session. As the request hasn't passed through the express
        // middleware, we have to call the required middleware ourselves.
        await sessionParserPromise(req, {});
        await passportInitializePromise(req, {});
        await passportSessionPromise(req, {});
        return expressUserToH5PUser(req.user);
    }, async (user, _contentId) => {
        const userInTable = users[user.id];
        if (!userInTable) {
            return undefined;
        }
        return userInTable.role === 'teacher' || userInTable === 'admin'
            ? 'privileged'
            : 'user';
    }, h5pEditor.contentManager.getContentMetadata.bind(h5pEditor.contentManager), h5pEditor.contentManager.getContentParameters.bind(h5pEditor.contentManager));
    server.listen(port);
};
// We can't use await outside a an async function, so we use the start()
// function as a workaround.
start();
//# sourceMappingURL=indexSharedState.js.map