/**
 * Allows you to choose which routes you want in the Express Router
 */
export default class H5PAjaxExpressRouterOptions {
    handleErrors?: boolean;
    routeContentUserData?: boolean;
    routeCoreFiles?: boolean;
    routeEditorCoreFiles?: boolean;
    routeFinishedData?: boolean;
    routeGetAjax?: boolean;
    routeGetContentFile?: boolean;
    routeGetDownload?: boolean;
    routeGetLibraryFile?: boolean;
    routeGetParameters?: boolean;
    routeGetTemporaryContentFile?: boolean;
    routePostAjax?: boolean;
}
