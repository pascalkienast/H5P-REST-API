"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createH5PEditor;
const cache_manager_1 = require("cache-manager");
const cache_manager_redis_store_1 = __importDefault(require("cache-manager-redis-store"));
const H5P = __importStar(require("@lumieducation/h5p-server"));
const dbImplementations = __importStar(require("@lumieducation/h5p-mongos3"));
const h5p_svg_sanitizer_1 = __importDefault(require("@lumieducation/h5p-svg-sanitizer"));
const h5p_clamav_scanner_1 = __importDefault(require("@lumieducation/h5p-clamav-scanner"));
/**
 * Create a H5PEditor object.
 * Which storage classes are used depends on the configuration values set in
 * the environment variables. If you set no environment variables, the local
 * filesystem storage classes will be used.
 *
 * CONTENTSTORAGE=mongos3 Uses MongoDB/S3 backend for content storage
 * CONTENT_MONGO_COLLECTION Specifies the collection name for content storage
 * CONTENT_AWS_S3_BUCKET Specifies the bucket name for content storage
 * TEMPORARYSTORAGE=s3 Uses S3 backend for temporary file storage
 * TEMPORARY_AWS_S3_BUCKET Specifies the bucket name for temporary file storage
 *
 * Further environment variables to set up MongoDB and S3 can be found in
 * docs/mongo-s3-content-storage.md and docs/s3-temporary-file-storage.md!
 * @param config the configuration object
 * @param localLibraryPath a path in the local filesystem in which the H5P libraries (content types) are stored
 * @param localContentPath a path in the local filesystem in which H5P content will be stored (only necessary if you want to use the local filesystem content storage class)
 * @param localTemporaryPath a path in the local filesystem in which temporary files will be stored (only necessary if you want to use the local filesystem temporary file storage class).
 * @param translationCallback a function that is called to retrieve translations of keys in a certain language; the keys use the i18next format (e.g. namespace:key).
 * @returns a H5PEditor object
 */
async function createH5PEditor(config, urlGenerator, permissionSystem, localLibraryPath, localContentPath, localTemporaryPath, localContentUserDataPath, translationCallback, hooks) {
    let cache;
    if (process.env.CACHE === 'in-memory') {
        cache = (0, cache_manager_1.caching)({
            store: 'memory',
            ttl: 60 * 60 * 24,
            max: 2 ** 10
        });
    }
    else if (process.env.CACHE === 'redis') {
        cache = (0, cache_manager_1.caching)({
            store: cache_manager_redis_store_1.default,
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            auth_pass: process.env.REDIS_AUTH_PASS,
            db: process.env.REDIS_DB,
            ttl: 60 * 60 * 24
        });
    }
    else {
        // using no cache
    }
    const contentUserDataStorage = new H5P.fsImplementations.FileContentUserDataStorage(localContentUserDataPath);
    // Depending on the environment variables we use different implementations
    // of the storage interfaces.
    const h5pEditor = new H5P.H5PEditor(new H5P.cacheImplementations.CachedKeyValueStorage('kvcache', cache), // this is a general-purpose cache
    config, process.env.CACHE
        ? new H5P.cacheImplementations.CachedLibraryStorage(new H5P.fsImplementations.FileLibraryStorage(localLibraryPath), cache)
        : new H5P.fsImplementations.FileLibraryStorage(localLibraryPath), process.env.CONTENTSTORAGE !== 'mongos3'
        ? new H5P.fsImplementations.FileContentStorage(localContentPath)
        : new dbImplementations.MongoS3ContentStorage(dbImplementations.initS3({ forcePathStyle: true }), (await dbImplementations.initMongo()).collection(process.env.CONTENT_MONGO_COLLECTION), {
            s3Bucket: process.env.CONTENT_AWS_S3_BUCKET,
            maxKeyLength: process.env.AWS_S3_MAX_FILE_LENGTH
                ? Number.parseInt(process.env.AWS_S3_MAX_FILE_LENGTH, 10)
                : undefined
        }), process.env.TEMPORARYSTORAGE === 's3'
        ? new dbImplementations.S3TemporaryFileStorage(dbImplementations.initS3({ forcePathStyle: true }), {
            s3Bucket: process.env.TEMPORARY_AWS_S3_BUCKET,
            maxKeyLength: process.env.AWS_S3_MAX_FILE_LENGTH
                ? Number.parseInt(process.env.AWS_S3_MAX_FILE_LENGTH, 10)
                : undefined
        })
        : new H5P.fsImplementations.DirectoryTemporaryFileStorage(localTemporaryPath), translationCallback, urlGenerator, {
        enableHubLocalization: true,
        enableLibraryNameLocalization: true,
        hooks,
        permissionSystem,
        // We've allowed SVGs in config.json, so we need to sanitize SVGs
        fileSanitizers: [new h5p_svg_sanitizer_1.default()],
        // You might not want to use ClamAV or opt out of using a virus
        // scanner.
        malwareScanners: process.env.CLAMSCAN_ENABLED === 'true'
            ? [await h5p_clamav_scanner_1.default.create()]
            : []
    }, contentUserDataStorage);
    // Set bucket lifecycle configuration for S3 temporary storage to make
    // sure temporary files expire.
    if (h5pEditor.temporaryStorage instanceof
        dbImplementations.S3TemporaryFileStorage) {
        await h5pEditor.temporaryStorage.setBucketLifecycleConfiguration(h5pEditor.config);
    }
    return h5pEditor;
}
//# sourceMappingURL=createH5PEditor.js.map