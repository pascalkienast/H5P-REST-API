import { S3, S3ClientConfig } from '@aws-sdk/client-s3';
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
declare const _default: (options?: S3ClientConfig) => S3;
export default _default;
