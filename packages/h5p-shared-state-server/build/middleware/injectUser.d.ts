import ShareDB from 'sharedb';
/**
 * Injects the user information from the request into the sharedb context
 */
declare const _default: (context: ShareDB.middleware.ConnectContext, next: (err?: any) => void) => Promise<void>;
export default _default;
