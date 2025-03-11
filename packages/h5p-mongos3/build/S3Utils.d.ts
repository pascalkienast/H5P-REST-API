import { S3 } from '@aws-sdk/client-s3';
/**
 * Checks if the filename can be used in S3 storage. Throws errors if the
 * filename is not valid
 * @param filename the filename to check
 * @returns no return value; throws errors if the filename is not valid
 */
export declare function validateFilename(filename: string, invalidCharactersRegExp?: RegExp): void;
/**
 * Sanitizes a filename or path by shortening it to the specified maximum length
 * and removing the invalid characters in the RegExp. If you don't specify a
 * RegExp a very strict invalid character list will be used that only leaves
 * alphanumeric filenames untouched.
 * @param filename the filename or path (with UNIX slash separator) to sanitize
 * @param maxFileLength the filename will be shortened to this length
 * @param invalidCharactersRegExp these characters will be removed from the
 * filename
 * @returns the cleaned filename
 */
export declare function sanitizeFilename(filename: string, maxFileLength: number, invalidCharactersRegExp?: RegExp): string;
/**
 * Deletes a list of objects from the S3 bucket. We can't use the normal
 * S3.deleteObjects function as it doesn't generate the MD5 hash needed by S3.
 * @param keys a list of keys to delete
 * @param bucket
 * @param s3
 * @param keyResolver
 */
export declare function deleteObjects(keys: string[], bucket: string, s3: S3): Promise<void>;
