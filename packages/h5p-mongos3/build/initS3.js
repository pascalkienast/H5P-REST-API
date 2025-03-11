"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
/**
 * Creates an S3 client.
 * @param options (optional) These options will be passed to the S3 client. You
 * can override options through these environment variables:
 * AWS_ACCESS_KEY_ID: string
 * AWS_SECRET_ACCESS_KEY: string
 * AWS_S3_ENDPOINT: string
 * AWS_REGION: string
 * @returns the S3 client
 */
exports.default = (options) => {
    const optionsWithOverrides = options ? { ...options } : {};
    if (!optionsWithOverrides.credentials) {
        let accessKeyId;
        if (process.env.AWS_ACCESS_KEY_ID) {
            accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        }
        else if (options?.credentials?.accessKeyId) {
            accessKeyId = options.credentials.accessKeyId;
        }
        else {
            throw new Error('Access key for S3 storage missing. Either set the environment variable AWS_ACCESS_KEY_ID or pass the accessKeyId property through the option object.');
        }
        let secretAccessKey;
        if (process.env.AWS_SECRET_ACCESS_KEY) {
            secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
        }
        else if (options?.credentials?.secretAccessKey) {
            secretAccessKey = options.credentials.secretAccessKey;
        }
        else {
            throw new Error('Secret access key for S3 storage missing. Either set the environment variable AWS_SECRET_ACCESS_KEY or pass the secretAccessKey property through the option object.');
        }
        optionsWithOverrides.credentials = {
            accessKeyId,
            secretAccessKey
        };
    }
    // add overrides to configuration values that are set through environment
    // variables
    if (process.env.AWS_S3_ENDPOINT) {
        optionsWithOverrides.endpoint = process.env.AWS_S3_ENDPOINT;
    }
    if (process.env.AWS_REGION) {
        optionsWithOverrides.region = process.env.AWS_REGION;
    }
    if (!optionsWithOverrides.endpoint && !optionsWithOverrides.region) {
        throw new Error('No S3 endpoint or AWS region was specified. You must either set the environment variables AWS_S3_ENDPOINT or AWS_REGION or set the properties endpoint or region in the option object.');
    }
    return new client_s3_1.S3(optionsWithOverrides);
};
//# sourceMappingURL=initS3.js.map