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
const client_1 = require("@redis/client");
const debug_1 = __importDefault(require("debug"));
const H5P = __importStar(require("@lumieducation/h5p-server"));
const dbImplementations = __importStar(require("@lumieducation/h5p-mongos3"));
const h5p_redis_lock_1 = __importDefault(require("@lumieducation/h5p-redis-lock"));
const h5p_svg_sanitizer_1 = __importDefault(require("@lumieducation/h5p-svg-sanitizer"));
const h5p_clamav_scanner_1 = __importDefault(require("@lumieducation/h5p-clamav-scanner"));
let mongoDb;
async function getMongoDb() {
    if (!mongoDb) {
        mongoDb = await dbImplementations.initMongo();
    }
    return mongoDb;
}
/**
 * Create a H5PEditor object.
 * Which storage classes are used depends on the configuration values set in
 * the environment variables.re If you set no environment variables, the local
 * filesystem storage classes will be used.
 *
 * CONTENTSTORAGE=mongos3 Uses MongoDB/S3 backend for content storage
 * CONTENT_MONGO_COLLECTION Specifies the collection name for content storage
 * CONTENT_AWS_S3_BUCKET Specifies the bucket name for content storage
 * TEMPORARYSTORAGE=s3 Uses S3 backend for temporary file storage
 * TEMPORARY_AWS_S3_BUCKET Specifies the bucket name for temporary file storage
 *
 * Further environment variables to set up MongoDB and S3 can be found in
 * docs/packages/h5p-mongos3/mongo-s3-content-storage.md and docs/packages/h5p-mongos3/s3-temporary-file-storage.md!
 * @param config the configuration object
 * @param localLibraryPath a path in the local filesystem in which the H5P libraries (content types) are stored
 * @param localContentPath a path in the local filesystem in which H5P content will be stored (only necessary if you want to use the local filesystem content storage class)
 * @param localTemporaryPath a path in the local filesystem in which temporary files will be stored (only necessary if you want to use the local filesystem temporary file storage class).
 * @param translationCallback a function that is called to retrieve translations of keys in a certain language; the keys use the i18next format (e.g. namespace:key).
 * @returns a H5PEditor object
 */
async function createH5PEditor(config, localLibraryPath, localContentPath, localTemporaryPath, localContentUserDataPath, translationCallback) {
    let cache;
    if (process.env.CACHE === 'in-memory') {
        (0, debug_1.default)('h5p-example')(`Using in memory cache for caching library storage.`);
        cache = (0, cache_manager_1.caching)({
            store: 'memory',
            ttl: 60 * 60 * 24,
            max: 2 ** 10
        });
    }
    else if (process.env.CACHE === 'redis') {
        (0, debug_1.default)('h5p-example')(`Using Redis for caching library storage (${process.env.REDIS_HOST}:${process.env.REDIS_PORT}, db: ${process.env.REDIS_DB})`);
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
        (0, debug_1.default)('h5p-example')('Not using any cache for library storage');
        // using no cache
    }
    let lock;
    if (process.env.LOCK === 'redis') {
        (0, debug_1.default)('h5p-example')(`Using Redis as lock provider (host: ${process.env.LOCK_REDIS_HOST}:${process.env.LOCK_REDIS_PORT}, db: ${process.env.LOCK_REDIS_DB}).`);
        const client = (0, client_1.createClient)({
            socket: {
                port: Number.parseInt(process.env.LOCK_REDIS_PORT),
                host: process.env.LOCK_REDIS_HOST
            },
            database: Number.parseInt(process.env.LOCK_REDIS_DB)
        });
        try {
            await client.connect();
        }
        catch (error) {
            console.error('Could not connect to redis');
            console.error(error);
            throw error;
        }
        lock = new h5p_redis_lock_1.default(client);
    }
    else {
        (0, debug_1.default)('h5p-example')(`Using simple in-memory lock provider.`);
        lock = new H5P.SimpleLockProvider();
    }
    // Depending on the environment variables we use different implementations
    // of the storage interfaces.
    let libraryStorage;
    if (process.env.LIBRARYSTORAGE === 'mongo') {
        (0, debug_1.default)('h5p-example')('Using pure MongoDB for library storage.');
        const mongoLibraryStorage = new dbImplementations.MongoLibraryStorage((await getMongoDb()).collection(process.env.LIBRARY_MONGO_COLLECTION));
        await mongoLibraryStorage.createIndexes();
        libraryStorage = mongoLibraryStorage;
    }
    else if (process.env.LIBRARYSTORAGE === 'mongos3') {
        (0, debug_1.default)('h5p-example')('Using MongoDB / S3 for library storage');
        const mongoS3LibraryStorage = new dbImplementations.MongoS3LibraryStorage(dbImplementations.initS3({
            forcePathStyle: true
        }), (await getMongoDb()).collection(process.env.LIBRARY_MONGO_COLLECTION), {
            s3Bucket: process.env.LIBRARY_AWS_S3_BUCKET,
            maxKeyLength: process.env.AWS_S3_MAX_FILE_LENGTH
                ? Number.parseInt(process.env.AWS_S3_MAX_FILE_LENGTH, 10)
                : undefined
        });
        await mongoS3LibraryStorage.createIndexes();
        libraryStorage = mongoS3LibraryStorage;
    }
    else {
        libraryStorage = new H5P.fsImplementations.FileLibraryStorage(localLibraryPath);
    }
    let contentUserDataStorage;
    if (process.env.USERDATASTORAGE === 'mongo') {
        const mongoContentUserDataStorage = new dbImplementations.MongoContentUserDataStorage((await getMongoDb()).collection(process.env.USERDATA_MONGO_COLLECTION), (await getMongoDb()).collection(process.env.FINISHED_MONGO_COLLECTION));
        await mongoContentUserDataStorage.createIndexes();
        contentUserDataStorage = mongoContentUserDataStorage;
    }
    else if (!process.env.USERDATASTORAGE ||
        process.env.USERDATASTORAGE === 'file') {
        contentUserDataStorage =
            new H5P.fsImplementations.FileContentUserDataStorage(localContentUserDataPath);
    }
    const h5pEditor = new H5P.H5PEditor(new H5P.cacheImplementations.CachedKeyValueStorage('kvcache', cache), // this is a general-purpose cache
    config, process.env.CACHE
        ? new H5P.cacheImplementations.CachedLibraryStorage(libraryStorage, cache)
        : libraryStorage, process.env.CONTENTSTORAGE !== 'mongos3'
        ? new H5P.fsImplementations.FileContentStorage(localContentPath)
        : new dbImplementations.MongoS3ContentStorage(dbImplementations.initS3({
            forcePathStyle: true
        }), (await getMongoDb()).collection(process.env.CONTENT_MONGO_COLLECTION), {
            s3Bucket: process.env.CONTENT_AWS_S3_BUCKET,
            maxKeyLength: process.env.AWS_S3_MAX_FILE_LENGTH
                ? Number.parseInt(process.env.AWS_S3_MAX_FILE_LENGTH, 10)
                : undefined
        }), process.env.TEMPORARYSTORAGE === 's3'
        ? new dbImplementations.S3TemporaryFileStorage(dbImplementations.initS3({
            forcePathStyle: true
        }), {
            s3Bucket: process.env.TEMPORARY_AWS_S3_BUCKET,
            maxKeyLength: process.env.AWS_S3_MAX_FILE_LENGTH
                ? Number.parseInt(process.env.AWS_S3_MAX_FILE_LENGTH, 10)
                : undefined
        })
        : new H5P.fsImplementations.DirectoryTemporaryFileStorage(localTemporaryPath), translationCallback, undefined, {
        enableHubLocalization: true,
        enableLibraryNameLocalization: true,
        lockProvider: lock,
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