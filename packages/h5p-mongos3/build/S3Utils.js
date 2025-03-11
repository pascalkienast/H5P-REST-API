"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFilename = validateFilename;
exports.sanitizeFilename = sanitizeFilename;
exports.deleteObjects = deleteObjects;
const client_s3_1 = require("@aws-sdk/client-s3");
const crypto_1 = __importDefault(require("crypto"));
const h5p_server_1 = require("@lumieducation/h5p-server");
const { generalizedSanitizeFilename } = h5p_server_1.utils;
const log = new h5p_server_1.Logger('S3Utils');
/**
 * Checks if the filename can be used in S3 storage. Throws errors if the
 * filename is not valid
 * @param filename the filename to check
 * @returns no return value; throws errors if the filename is not valid
 */
function validateFilename(filename, invalidCharactersRegExp) {
    if (/\.\.\//.test(filename)) {
        log.error(`Relative paths in filenames are not allowed: ${filename} is illegal`);
        throw new h5p_server_1.H5pError('illegal-filename', { filename }, 400);
    }
    if (filename.startsWith('/')) {
        log.error(`Absolute paths in filenames are not allowed: ${filename} is illegal`);
        throw new h5p_server_1.H5pError('illegal-filename', { filename }, 400);
    }
    // See https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html
    // for a list of problematic characters. We filter all of them out
    // expect for ranges of non-printable ASCII characters:
    // &$@=;:+ ,?\\{^}%`]'">[~<#
    if ((invalidCharactersRegExp ?? /[^A-Za-z0-9\-._!()@/]/g).test(filename)) {
        log.error(`Found illegal character in filename: ${filename}`);
        throw new h5p_server_1.H5pError('illegal-filename', { filename }, 400);
    }
}
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
function sanitizeFilename(filename, maxFileLength, invalidCharactersRegExp) {
    return generalizedSanitizeFilename(filename, invalidCharactersRegExp ?? /[^A-Za-z0-9\-._!()@/]/g, maxFileLength);
}
/**
 * Deletes a list of objects from the S3 bucket. We can't use the normal
 * S3.deleteObjects function as it doesn't generate the MD5 hash needed by S3.
 * @param keys a list of keys to delete
 * @param bucket
 * @param s3
 * @param keyResolver
 */
async function deleteObjects(keys, bucket, s3) {
    // S3 batch deletes only work with 1000 files at a time, so we
    // might have to do this in several requests.
    const errors = [];
    while (keys.length > 0) {
        const nextFiles = keys.splice(0, 1000);
        if (nextFiles.length > 0) {
            log.debug(`Batch deleting ${nextFiles.length} file(s) in S3 storage.`);
            const deleteParams = {
                Bucket: bucket,
                Delete: {
                    Objects: nextFiles.map((key) => ({
                        Key: key
                    }))
                }
            };
            log.debug('Delete params:', JSON.stringify(deleteParams));
            const deletePayload = JSON.stringify(deleteParams.Delete);
            const md5Hash = crypto_1.default
                .createHash('md5')
                .update(deletePayload)
                .digest('base64');
            const command = new client_s3_1.DeleteObjectsCommand(deleteParams);
            command.middlewareStack.add((next) => async (args) => {
                args.request.headers['Content-MD5'] = md5Hash;
                return next(args);
            }, {
                step: 'build'
            });
            try {
                const response = await s3.send(command);
                log.debug('Deleted files in S3 storage.', response);
            }
            catch (error) {
                log.error(`There was an error while deleting files in S3 storage. The delete operation will continue.\nError:`, error);
                errors.push(error);
            }
        }
    }
    if (errors.length > 0) {
        throw new Error(`Errors while deleting files in S3 storage: ${errors.map((e) => e.message).join(', ')}`);
    }
}
//# sourceMappingURL=S3Utils.js.map