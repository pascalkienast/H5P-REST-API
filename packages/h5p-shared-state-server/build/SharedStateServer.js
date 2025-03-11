"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sharedb_1 = __importDefault(require("sharedb"));
const ws_1 = __importDefault(require("ws"));
const websocket_json_stream_1 = __importDefault(require("@teamwork/websocket-json-stream"));
const util_1 = require("util");
const debug_1 = __importDefault(require("debug"));
const ValidatorRepository_1 = __importDefault(require("./ValidatorRepository"));
const injectUser_1 = __importDefault(require("./middleware/injectUser"));
const checkPermissionsAndInjectContentContext_1 = __importDefault(require("./middleware/checkPermissionsAndInjectContentContext"));
const validateOpSchema_1 = __importDefault(require("./middleware/validateOpSchema"));
const performOpLogicChecks_1 = __importDefault(require("./middleware/performOpLogicChecks"));
const validateCommitSchema_1 = __importDefault(require("./middleware/validateCommitSchema"));
const performCommitLogicChecks_1 = __importDefault(require("./middleware/performCommitLogicChecks"));
const log = (0, debug_1.default)('h5p:SharedStateServer:SharedStateServer');
/**
 * Main entry point into the share-state functionality.
 *
 * This class opens a Websocket on the server to which clients can connect to
 * and send ops via ShareDB to modify the shared state. The shared state
 * validates the changes against the library schema, propagates them to the
 * other connected clients and persists the state.
 */
class SharedStateServer {
    getLibraryMetadata;
    requestToUserCallback;
    getPermissionForUser;
    getContentMetadata;
    getContentParameters;
    options;
    /**
     *
     * @param httpServer a http server that can be used to open the websocket
     * @param getLibraryMetadata return the library metadata (= library.json)
     * for a library
     * @param getLibraryFileAsJson  return an arbitrary JSON file for a specific
     * library; throw an error if the file doesn't exist or if it's not JSON
     * @param requestToUserCallback converts the request that is used to
     * initiate the websocket connection to the user object for the user who is
     * making the request; this is used to authenticate a user who connects to
     * the websocket
     * @param getPermissionForUser returns the permission a user has to a
     * specific content object
     * @param getContentMetadata returns the metadata (h5p.json) for a piece of
     * content
     * @param getContentParameters returns the parameters (content.json) for a
     * piece of content
     */
    constructor(httpServer, getLibraryMetadata, getLibraryFileAsJson, requestToUserCallback, getPermissionForUser, getContentMetadata, getContentParameters, options) {
        this.getLibraryMetadata = getLibraryMetadata;
        this.requestToUserCallback = requestToUserCallback;
        this.getPermissionForUser = getPermissionForUser;
        this.getContentMetadata = getContentMetadata;
        this.getContentParameters = getContentParameters;
        this.options = options;
        // The URL building method assumes there is no trailing slash in the
        // baseUrl, so we make sure the baseUrl doesn't include one.
        if (this.options?.baseUrl && this.options.baseUrl.endsWith('/')) {
            this.options.baseUrl = this.options.baseUrl.substring(0, this.options.baseUrl.length - 1);
        }
        this.validatorRepository = new ValidatorRepository_1.default(getLibraryFileAsJson);
        this.setupShareDBMiddleware();
        // Connect any incoming WebSocket connection to ShareDB
        const wss = new ws_1.default.Server({
            server: httpServer,
            path: this.getWsUrl()
        });
        wss.on('connection', async (ws, request) => {
            log('Websocket connected');
            // We authenticate with a callback
            const user = await this.requestToUserCallback(request);
            request.user = user;
            const stream = new websocket_json_stream_1.default(ws);
            this.backend.listen(stream, request);
            ws.on('close', () => {
                log('Websocket disconnected');
            });
        });
    }
    backend;
    /**
     * We cache validators in a repository to avoid constructing them over and
     * over. (They are used for every request)
     */
    validatorRepository;
    /**
     * Call this method when a content object is deleted or changed in the host
     * system. This will delete the state from the system (and also notify users
     * who are currently connected)
     * @param contentId
     */
    deleteState = async (contentId) => {
        log('Deleting shared user state for contentId %s', contentId);
        const connection = this.backend.connect();
        const doc = connection.get('h5p', contentId);
        // The ShareDB API is not promisified and relies on on this usage, so we
        // have to bind the Promises
        await (0, util_1.promisify)(doc.fetch).bind(doc)();
        try {
            await (0, util_1.promisify)(doc.del).bind(doc)({});
        }
        catch (error) {
            console.error(error);
        }
        // TODO: delete state in DB storage once implemented
    };
    /**
     * Adds all the required middleware to a new ShareDB object
     */
    setupShareDBMiddleware() {
        this.backend = new sharedb_1.default();
        this.backend.use('connect', injectUser_1.default);
        // "Submit" is the earliest point at which we can check individual
        // messages by the client.
        this.backend.use('submit', (0, checkPermissionsAndInjectContentContext_1.default)(this.getPermissionForUser, this.getLibraryMetadata, this.getContentMetadata, this.getContentParameters));
        this.backend.use('submit', (0, validateOpSchema_1.default)(this.validatorRepository));
        // We use 'apply' for the op logic checks as we have access to the old
        // snapshot then, which we wouldn't have in 'submit'. Some OP checks
        // require the old snapshot.
        this.backend.use('apply', (0, performOpLogicChecks_1.default)(this.validatorRepository));
        // "Commit" means the changes of the ops were applied to the old
        // snapshot and there is a new one that we can check.
        this.backend.use('commit', (0, validateCommitSchema_1.default)(this.validatorRepository));
        this.backend.use('commit', (0, performCommitLogicChecks_1.default)(this.validatorRepository));
    }
    /**
     * @returns the URL at which the websocket should be opened.
     */
    getWsUrl() {
        if (this.options?.baseUrl) {
            return `${this.options.baseUrl}/shared-state`;
        }
        return '/shared-state';
    }
}
exports.default = SharedStateServer;
//# sourceMappingURL=SharedStateServer.js.map