"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const h5p_server_1 = require("@lumieducation/h5p-server");
const debug_1 = __importDefault(require("debug"));
const log = (0, debug_1.default)('h5p:SharedStateServer:checkPermissionsAndInjectContentContext');
/**
 * Checks the permissions and injects information about the content object into
 * the context.
 */
exports.default = (getPermissionForUser, getLibraryMetadata, getContentMetadata, getContentParameters) => async (context, next) => {
    const contentId = context.id;
    const agent = context.agent.custom;
    const user = agent.user;
    // Allow all operations by the server
    if (agent.fromServer) {
        return next();
    }
    if (!user && !agent.fromServer) {
        return next(new Error('No user data in submit request'));
    }
    const permission = await getPermissionForUser(user, contentId);
    if (!permission) {
        log('User %s tried to access content without proper permission.', user.id);
        return next('You do not have permission to access this content.');
    }
    agent.permission = permission;
    log('User %s (%s) is accessing %s with access level %s', user.id, user.name, contentId, permission);
    if (contentId) {
        const contentMetadata = await getContentMetadata(contentId, user);
        const libraryMetadata = await getLibraryMetadata(contentMetadata.preloadedDependencies.find((d) => d.machineName === contentMetadata.mainLibrary));
        if (libraryMetadata.requiredExtensions?.sharedState !== 1) {
            log('Library %s uses unsupported shared state extension: The library requires v%s but this application only supports v1.', h5p_server_1.LibraryName.toUberName(libraryMetadata), libraryMetadata.requiredExtensions?.sharedState);
            // Unknown extension version ... Aborting.
            return next(new Error(`Library ${h5p_server_1.LibraryName.toUberName(libraryMetadata)} uses unsupported shared state extension: The library requires v${libraryMetadata.requiredExtensions?.sharedState} but this application only supports v1.`));
        }
        const params = await getContentParameters(contentId, user);
        agent.params = params;
        agent.ubername = h5p_server_1.LibraryName.toUberName(libraryMetadata);
        agent.libraryMetadata = libraryMetadata;
    }
    next();
};
//# sourceMappingURL=checkPermissionsAndInjectContentContext.js.map