import http from 'http';
import { GetContentMetadataFunction, GetContentParametersFunction, GetLibraryFileAsJsonFunction, GetLibraryMetadataFunction, GetPermissionForUserFunction, RequestToUserFunction } from './types';
/**
 * Main entry point into the share-state functionality.
 *
 * This class opens a Websocket on the server to which clients can connect to
 * and send ops via ShareDB to modify the shared state. The shared state
 * validates the changes against the library schema, propagates them to the
 * other connected clients and persists the state.
 */
export default class SharedStateServer {
    private getLibraryMetadata;
    private requestToUserCallback;
    private getPermissionForUser;
    private getContentMetadata;
    private getContentParameters;
    private options?;
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
    constructor(httpServer: http.Server, getLibraryMetadata: GetLibraryMetadataFunction, getLibraryFileAsJson: GetLibraryFileAsJsonFunction, requestToUserCallback: RequestToUserFunction, getPermissionForUser: GetPermissionForUserFunction, getContentMetadata: GetContentMetadataFunction, getContentParameters: GetContentParametersFunction, options?: {
        baseUrl?: string;
    });
    private backend;
    /**
     * We cache validators in a repository to avoid constructing them over and
     * over. (They are used for every request)
     */
    private validatorRepository;
    /**
     * Call this method when a content object is deleted or changed in the host
     * system. This will delete the state from the system (and also notify users
     * who are currently connected)
     * @param contentId
     */
    deleteState: (contentId: string) => Promise<void>;
    /**
     * Adds all the required middleware to a new ShareDB object
     */
    private setupShareDBMiddleware;
    /**
     * @returns the URL at which the websocket should be opened.
     */
    private getWsUrl;
}
