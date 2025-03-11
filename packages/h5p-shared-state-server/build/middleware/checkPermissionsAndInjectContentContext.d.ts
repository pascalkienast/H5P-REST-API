import ShareDB from 'sharedb';
import { GetLibraryMetadataFunction, GetPermissionForUserFunction, GetContentMetadataFunction, GetContentParametersFunction } from '../types';
/**
 * Checks the permissions and injects information about the content object into
 * the context.
 */
declare const _default: (getPermissionForUser: GetPermissionForUserFunction, getLibraryMetadata: GetLibraryMetadataFunction, getContentMetadata: GetContentMetadataFunction, getContentParameters: GetContentParametersFunction) => (context: ShareDB.middleware.SubmitContext, next: (err?: any) => void) => Promise<void>;
export default _default;
