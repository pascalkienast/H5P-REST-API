import { Readable } from 'stream';
import { ObjectCannedACL, S3 } from '@aws-sdk/client-s3';
import { ReadStream } from 'fs';
import { ITemporaryFileStorage, IUser, ITemporaryFile, IH5PConfig, IFileStats } from '@lumieducation/h5p-server';
/**
 * This class stores temporary files in a S3-compatible storage system.
 *
 * IMPORTANT:
 * The expiration (and automatic deletion) of files must be handled on bucket
 * level. See https://aws.amazon.com/de/blogs/aws/amazon-s3-object-expiration/
 * for details.
 *
 * You can call the method setBucketLifecycleConfiguration(...) to set up a
 * lifecycle configuration for the expiration time set in the config or you can
 * set up the policy in a more customized way manually.
 */
export default class S3TemporaryFileStorage implements ITemporaryFileStorage {
    private s3;
    private options;
    constructor(s3: S3, options: {
        /**
         * These characters will be removed from files that are saved to S3.
         * There is a very strict default list that basically only leaves
         * alphanumeric filenames intact. Should you need more relaxed
         * settings you can specify them here.
         */
        invalidCharactersRegexp?: RegExp;
        /**
         * Indicates how long keys in S3 can be. Defaults to 1024. (S3
         * supports 1024 characters, other systems such as Minio might only
         * support 255 on Windows).
         */
        maxKeyLength?: number;
        /**
         * The ACL to use for uploaded content files. Defaults to private.
         * See the S3 documentation for possible values.
         */
        s3Acl?: ObjectCannedACL;
        /**
         * The bucket to upload to and download from. (required)
         */
        s3Bucket: string;
    });
    /**
     * Indicates how long keys can be.
     */
    private maxKeyLength;
    /**
     * Deletes the file from temporary storage.
     * Throws errors of something goes wrong.
     * @param filename the file to delete
     * @param userId the user ID of the user who wants to delete the file
     */
    deleteFile(filename: string, _ownerId: string): Promise<void>;
    /**
     * Checks if a file exists in temporary storage.
     * @param filename the file to check
     * @param user the user who wants to access the file
     */
    fileExists(filename: string, _user: IUser): Promise<boolean>;
    /**
     * Returns a information about a temporary file.
     * Throws an exception if the file does not exist.
     * @param filename the relative path inside the library
     * @param user the user who wants to access the file
     * @returns the file stats
     */
    getFileStats(filename: string, _user: IUser): Promise<IFileStats>;
    /**
     * Returns a readable for a file.
     *
     * Note: Make sure to handle the 'error' event of the Readable! This method
     * does not check if the file exists in storage to avoid the extra request.
     * However, this means that there will be an error when piping the Readable
     * to the response if the file doesn't exist!
     * @param filename
     * @param user
     * @param rangeStart (optional) the position in bytes at which the stream should start
     * @param rangeEnd (optional) the position in bytes at which the stream should end
     */
    getFileStream(filename: string, user: IUser, rangeStart?: number, rangeEnd?: number): Promise<Readable>;
    /**
     * Theoretically lists all files either in temporary storage in general
     * or files which the user has stored in it.
     *
     * In the S3 implementation the method is not implemented, as S3 supports
     * file expiration on the bucket level. This feature should be used instead
     * of manually scanning for expired files.
     */
    listFiles(user?: IUser): Promise<ITemporaryFile[]>;
    /**
     * Removes invalid characters from filenames and enforces other filename
     * rules required by the storage implementation (e.g. filename length
     * restrictions).
     * @param filename the filename to sanitize; this can be a relative path
     * (e.g. "images/image1.png")
     * @returns the clean filename
     */
    sanitizeFilename(filename: string): string;
    /**
     * DSaves a file to temporary storage.
     * @param filename
     * @param dataStream
     * @param user
     * @param expirationTime
     */
    saveFile(filename: string, dataStream: ReadStream, user: IUser, expirationTime: Date): Promise<ITemporaryFile>;
    /**
     * Makes sure the lifecycle configuration of the bucket is set in a way
     * that files automatically expire after the time period set in the the
     * configuration's 'temporaryFileLifetime' property.
     *
     * Note: S3's expiration policy only work with full days. The value in the
     * configuration (which can be set in milliseconds) is rounded to the
     * nearest day and will always be at least one day.
     *
     * This method will override all existing lifecycle configurations. If you
     * need several custom lifecycle configurations, you must create them
     * manually and NOT use this method.
     * @param config
     */
    setBucketLifecycleConfiguration(config: IH5PConfig): Promise<void>;
}
