"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_storage_1 = require("@aws-sdk/lib-storage");
const h5p_server_1 = require("@lumieducation/h5p-server");
const S3Utils_1 = require("./S3Utils");
const log = new h5p_server_1.Logger('S3TemporaryFileStorage');
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
class S3TemporaryFileStorage {
    s3;
    options;
    constructor(s3, options) {
        this.s3 = s3;
        this.options = options;
        log.info('initialize');
        this.maxKeyLength =
            options?.maxKeyLength !== undefined
                ? options.maxKeyLength - 22
                : 1002;
        // By default we shorten to 1002 as S3 supports a maximum of 1024
        // characters and we need to account for contentIds (12), unique ids
        // appended to the name (8) and separators (2).
    }
    /**
     * Indicates how long keys can be.
     */
    maxKeyLength;
    /**
     * Deletes the file from temporary storage.
     * Throws errors of something goes wrong.
     * @param filename the file to delete
     * @param userId the user ID of the user who wants to delete the file
     */
    async deleteFile(filename, _ownerId) {
        log.debug(`Deleting file "${filename}" from temporary storage.`);
        (0, S3Utils_1.validateFilename)(filename);
        if (!filename) {
            log.error(`Filename empty!`);
            throw new h5p_server_1.H5pError('s3-temporary-storage:file-not-found', {}, 404);
        }
        try {
            await this.s3.deleteObject({
                Bucket: this.options?.s3Bucket,
                Key: filename
            });
        }
        catch (error) {
            log.error(`Error while deleting a file from S3 storage: ${error.message}`);
            throw new h5p_server_1.H5pError('s3-temporary-storage:deleting-file-error', { filename }, 500);
        }
    }
    /**
     * Checks if a file exists in temporary storage.
     * @param filename the file to check
     * @param user the user who wants to access the file
     */
    async fileExists(filename, _user) {
        log.debug(`Checking if file ${filename} exists in temporary storage.`);
        (0, S3Utils_1.validateFilename)(filename);
        if (!filename) {
            log.error(`Filename empty!`);
            return false;
        }
        // TODO: Reconsider if we should really not check access rights.
        // (They are currently not checked as the fileExists method is called
        // to create unique filenames but the interface requires it to silently
        // return 'false' if there is a access rights validation. This will lead
        // to problems when determining unique filenames.)
        try {
            await this.s3.headObject({
                Bucket: this.options?.s3Bucket,
                Key: filename
            });
        }
        catch (error) {
            log.debug(`File "${filename}" does not exist in temporary storage.`);
            return false;
        }
        log.debug(`File "${filename}" does exist in temporary storage.`);
        return true;
    }
    /**
     * Returns a information about a temporary file.
     * Throws an exception if the file does not exist.
     * @param filename the relative path inside the library
     * @param user the user who wants to access the file
     * @returns the file stats
     */
    async getFileStats(filename, _user) {
        (0, S3Utils_1.validateFilename)(filename);
        try {
            const head = await this.s3.headObject({
                Bucket: this.options.s3Bucket,
                Key: filename
            });
            return { size: head.ContentLength, birthtime: head.LastModified };
        }
        catch (error) {
            throw new h5p_server_1.H5pError('file-not-found', {}, 404);
        }
    }
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
    async getFileStream(filename, user, rangeStart, rangeEnd) {
        log.debug(`Getting stream for temporary file "${filename}".`);
        (0, S3Utils_1.validateFilename)(filename);
        if (!filename) {
            log.error(`Filename empty!`);
            throw new h5p_server_1.H5pError('s3-temporary-storage:file-not-found', {}, 404);
        }
        return (await this.s3.getObject({
            Bucket: this.options?.s3Bucket,
            Key: filename,
            Range: rangeStart && rangeEnd
                ? `bytes=${rangeStart}-${rangeEnd}`
                : undefined
        })).Body;
    }
    /**
     * Theoretically lists all files either in temporary storage in general
     * or files which the user has stored in it.
     *
     * In the S3 implementation the method is not implemented, as S3 supports
     * file expiration on the bucket level. This feature should be used instead
     * of manually scanning for expired files.
     */
    async listFiles(user) {
        // As S3 files expire automatically, we don't need to return any file here.
        return [];
    }
    /**
     * Removes invalid characters from filenames and enforces other filename
     * rules required by the storage implementation (e.g. filename length
     * restrictions).
     * @param filename the filename to sanitize; this can be a relative path
     * (e.g. "images/image1.png")
     * @returns the clean filename
     */
    sanitizeFilename(filename) {
        return (0, S3Utils_1.sanitizeFilename)(filename, this.maxKeyLength, this.options?.invalidCharactersRegexp);
    }
    /**
     * DSaves a file to temporary storage.
     * @param filename
     * @param dataStream
     * @param user
     * @param expirationTime
     */
    async saveFile(filename, dataStream, user, expirationTime) {
        log.debug(`Saving temporary file "${filename}."`);
        (0, S3Utils_1.validateFilename)(filename);
        if (!filename) {
            log.error(`Filename empty!`);
            throw new h5p_server_1.H5pError('illegal-filename', {}, 400);
        }
        try {
            await new lib_storage_1.Upload({
                client: this.s3,
                params: {
                    ACL: this.options?.s3Acl ?? 'private',
                    Body: dataStream,
                    Bucket: this.options?.s3Bucket,
                    Key: filename,
                    Metadata: {
                        creator: user.id
                    }
                }
            }).done();
            return {
                filename,
                ownedByUserId: user.id,
                expiresAt: expirationTime
            };
        }
        catch (error) {
            log.error(`Error while uploading file "${filename}" to S3 storage: ${error.message}`);
            throw new h5p_server_1.H5pError(`s3-temporary-storage:s3-upload-error`, { filename }, 500);
        }
    }
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
    async setBucketLifecycleConfiguration(config) {
        log.debug(`Setting up object expiration for bucket ${this.options.s3Bucket}.`);
        const roundToNearestDay = (milliseconds) => Math.max(1, Math.round(milliseconds / (1000 * 60 * 24)));
        let expirationNeedsToBeSet = false;
        try {
            const lifecycleConfiguration = await this.s3.getBucketLifecycleConfiguration({
                Bucket: this.options.s3Bucket
            });
            if (!lifecycleConfiguration.Rules.some((rule) => rule.Filter?.Prefix === '' &&
                rule.Expiration.Days ===
                    roundToNearestDay(config.temporaryFileLifetime) &&
                rule.Status === 'Enabled')) {
                log.debug(`Old lifecycle configuration differs from the one set in the configuration.`);
                expirationNeedsToBeSet = true;
            }
            else {
                log.debug(`Old lifecycle configuration matches configuration file.`);
            }
        }
        catch {
            log.debug(`No old lifecycle configuration exists.`);
            expirationNeedsToBeSet = true;
        }
        if (expirationNeedsToBeSet) {
            log.debug(`Creating new lifecycle configuration for bucket.`);
            try {
                await this.s3.putBucketLifecycleConfiguration({
                    Bucket: this.options.s3Bucket,
                    LifecycleConfiguration: {
                        Rules: [
                            {
                                Filter: { Prefix: '' },
                                Status: 'Enabled',
                                Expiration: {
                                    Days: roundToNearestDay(config.temporaryFileLifetime)
                                }
                            }
                        ]
                    }
                });
            }
            catch (error) {
                log.error(`Could not set new lifecycle configuration: ${error.message}`);
            }
        }
    }
}
exports.default = S3TemporaryFileStorage;
//# sourceMappingURL=S3TemporaryFileStorage.js.map