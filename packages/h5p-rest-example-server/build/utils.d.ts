import { Request } from 'express';
/**
 * Displays links to the server at all available IP addresses.
 * @param port The port at which the server can be accessed.
 */
export declare function displayIps(port: string): void;
/**
 * This method will delete all temporary uploaded files from the request
 */
export declare function clearTempFiles(req: Request & {
    files: any;
}): Promise<void>;
