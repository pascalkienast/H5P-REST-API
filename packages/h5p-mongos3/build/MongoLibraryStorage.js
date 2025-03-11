"use strict";
/* eslint-disable no-underscore-dangle */
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
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const path = __importStar(require("path"));
const h5p_server_1 = require("@lumieducation/h5p-server");
const stream_buffers_1 = require("stream-buffers");
const log = new h5p_server_1.Logger('MongoLibraryStorage');
class MongoLibraryStorage {
    mongodb;
    options;
    /**
     * @param mongodb a MongoDB collection (read- and writable)
     * @param options options
     */
    constructor(mongodb, options) {
        this.mongodb = mongodb;
        this.options = options;
        log.info('initialize');
    }
    /**
     * Adds a library file to a library. The library metadata must have been installed with addLibrary(...) first.
     * Throws an error if something unexpected happens. In this case the method calling addFile(...) will clean
     * up the partly installed library.
     * @param library The library that is being installed
     * @param filename Filename of the file to add, relative to the library root
     * @param readable The Readable containing the file content
     * @returns true if successful
     */
    async addFile(library, filename, readable) {
        this.validateFilename(filename);
        const buffer = await this.readableToBuffer(readable);
        let result;
        try {
            result = await this.mongodb.updateOne({
                ubername: h5p_server_1.LibraryName.toUberName(library)
            }, {
                $push: {
                    files: {
                        data: new mongodb_1.Binary(buffer),
                        filename,
                        lastModified: new Date(Date.now()).getTime(),
                        size: buffer.byteLength
                    }
                }
            });
        }
        catch (error) {
            log.error(`Error while adding file "${filename}" to MongoDB: ${error.message}`);
            throw new h5p_server_1.H5pError('mongo-library-storage:add-file-error', { ubername: h5p_server_1.LibraryName.toUberName(library), filename }, 500);
        }
        if (result.matchedCount !== 1) {
            throw new h5p_server_1.H5pError('mongo-library-storage:library-not-found', {
                ubername: h5p_server_1.LibraryName.toUberName(library)
            }, 404);
        }
        return true;
    }
    /**
     * Adds the metadata of the library to the repository and assigns a new id
     * to the installed library. This id is used later when the library must be
     * referenced somewhere. Throws errors if something goes wrong.
     * @param libraryMetadata The library metadata object (= content of
     * library.json)
     * @param restricted True if the library can only be used be users allowed
     * to install restricted libraries.
     * @returns The newly created library object to use when adding library
     * files with addFile(...)
     */
    async addLibrary(libraryData, restricted) {
        const ubername = h5p_server_1.LibraryName.toUberName(libraryData);
        let result;
        try {
            if (await this.mongodb.findOne({
                ubername
            })) {
                throw new h5p_server_1.H5pError('mongo-library-storage:install-library-already-installed', { ubername });
            }
        }
        catch (error) {
            log.error('Error adding library to MongoDB: Library', ubername, 'already installed.');
            if (error instanceof h5p_server_1.H5pError) {
                throw error;
            }
            log.error(`Error adding library to MongoDB: ${error.message}`);
            throw new h5p_server_1.H5pError('mongo-library-storage:error-adding-metadata', {
                details: error.message
            });
        }
        try {
            result = await this.mongodb.insertOne({
                ubername,
                metadata: libraryData,
                additionalMetadata: { restricted },
                files: []
            });
        }
        catch (error) {
            log.error(`Error adding library to MongoDB: ${error.message}`);
            throw new h5p_server_1.H5pError('mongo-library-storage:error-adding-metadata', {
                details: error.message
            });
        }
        if (!result.acknowledged) {
            log.error(`Error adding library to MongoDB: Insert failed.`);
            throw new Error('mongo-library-storage:error-adding-metadata');
        }
        return h5p_server_1.InstalledLibrary.fromMetadata({ ...libraryData, restricted });
    }
    /**
     * Removes all files of a library. Doesn't delete the library metadata. (Used when updating libraries.)
     * @param library the library whose files should be deleted
     */
    async clearFiles(library) {
        let result;
        try {
            result = await this.mongodb.updateOne({
                ubername: h5p_server_1.LibraryName.toUberName(library)
            }, {
                $set: {
                    files: []
                }
            });
        }
        catch (error) {
            log.error(`There was an error while clearing the files: ${error.message}`);
            throw new h5p_server_1.H5pError('mongo-library-storage:deleting-files-error');
        }
        if (result.matchedCount !== 1) {
            log.error(`Clearing files of library ${h5p_server_1.LibraryName.toUberName(library)} failed, as it isn't installed.`);
            throw new h5p_server_1.H5pError('mongo-library-storage:library-not-found', {
                ubername: h5p_server_1.LibraryName.toUberName(library)
            }, 404);
        }
    }
    /**
     * Creates indexes to speed up read access. Can be safely used even if
     * indexes already exist.
     */
    async createIndexes() {
        await this.mongodb.createIndexes([
            {
                key: {
                    ubername: 1
                }
            },
            {
                key: {
                    ubername: 1,
                    'files.filename': 1
                }
            },
            {
                key: {
                    'metadata.machineName': 1
                }
            },
            {
                key: {
                    'metadata.addTo': 1
                }
            }
        ]);
    }
    /**
     * Removes the library and all its files from the repository.
     * Throws errors if something went wrong.
     * @param library The library to remove.
     */
    async deleteLibrary(library) {
        let result;
        try {
            result = await this.mongodb.deleteOne({
                ubername: h5p_server_1.LibraryName.toUberName(library)
            });
        }
        catch (error) {
            throw new h5p_server_1.H5pError('mongo-library-storage:error-deleting', {
                ubername: h5p_server_1.LibraryName.toUberName(library),
                message: error.message
            });
        }
        if (result.deletedCount === 0) {
            throw new h5p_server_1.H5pError('mongo-library-storage:library-not-found', { ubername: h5p_server_1.LibraryName.toUberName(library) }, 404);
        }
    }
    /**
     * Check if the library contains a file.
     * @param library The library to check
     * @param filename
     * @returns true if file exists in library, false otherwise
     */
    async fileExists(library, filename) {
        this.validateFilename(filename);
        try {
            const found = await this.mongodb.findOne({
                ubername: h5p_server_1.LibraryName.toUberName(library),
                'files.filename': filename
            }, { projection: { ubername: 1 } });
            return !!found;
        }
        catch (error) {
            log.error(`Error checking if file ${filename} exists in library ${h5p_server_1.LibraryName.toUberName(library)}: ${error.message}`);
            throw new h5p_server_1.H5pError('mongo-library-storage:file-exists-error', {
                ubername: h5p_server_1.LibraryName.toUberName(library),
                filename
            });
        }
    }
    /**
     * Counts how often libraries are listed in the dependencies of other
     * libraries and returns a list of the number.
     *
     * Note: Implementations should not count circular dependencies that are
     * caused by editorDependencies. Example: H5P.InteractiveVideo has
     * H5PEditor.InteractiveVideo in its editor dependencies.
     * H5PEditor.Interactive video has H5P.InteractiveVideo in its preloaded
     * dependencies. In this case H5P.InteractiveVideo should get a dependency
     * count of 0 and H5PEditor.InteractiveVideo should have 1. That way it is
     * still possible to delete the library from storage.
     *
     * @returns an object with ubernames as key.
     * Example:
     * {
     *   'H5P.Example': 10
     * }
     * This means that H5P.Example is used by 10 other libraries.
     */
    async getAllDependentsCount() {
        let libraryDeps;
        try {
            libraryDeps = await this.mongodb
                .find({}, {
                projection: {
                    ubername: 1,
                    'metadata.machineName': 1,
                    'metadata.majorVersion': 1,
                    'metadata.minorVersion': 1,
                    'metadata.preloadedDependencies': 1,
                    'metadata.editorDependencies': 1,
                    'metadata.dynamicDependencies': 1
                }
            })
                .map((d) => ({ ...d.metadata, ubername: d.ubername }))
                .toArray();
        }
        catch (error) {
            throw new h5p_server_1.H5pError('mongo-library-storage:error-getting-dependents');
        }
        // the dependency map allows faster access to libraries by ubername
        const librariesDepsMap = libraryDeps.reduce((prev, curr) => {
            prev[curr.ubername] = curr;
            return prev;
        }, {});
        // Remove circular dependencies caused by editor dependencies in
        // content types like H5P.InteractiveVideo.
        for (const lib of libraryDeps) {
            for (const dependency of lib.editorDependencies ?? []) {
                const ubername = h5p_server_1.LibraryName.toUberName(dependency);
                const index = librariesDepsMap[ubername].preloadedDependencies?.findIndex((ln) => h5p_server_1.LibraryName.equal(ln, lib));
                if (index >= 0) {
                    librariesDepsMap[ubername].preloadedDependencies.splice(index, 1);
                }
            }
        }
        // Count dependencies
        const dependencies = {};
        for (const lib of libraryDeps) {
            for (const dependency of (lib.preloadedDependencies ?? [])
                .concat(lib.editorDependencies ?? [])
                .concat(lib.dynamicDependencies ?? [])) {
                const ubername = h5p_server_1.LibraryName.toUberName(dependency);
                dependencies[ubername] = (dependencies[ubername] ?? 0) + 1;
            }
        }
        return dependencies;
    }
    /**
     * Returns the number of libraries that depend on this (single) library.
     * @param library the library to check
     * @returns the number of libraries that depend on this library.
     */
    async getDependentsCount(library) {
        try {
            return await this.mongodb.countDocuments({
                'metadata.preloadedDependencies': library
            });
        }
        catch (error) {
            throw new h5p_server_1.H5pError('mongo-library-storage:error-getting-dependents', {
                ubername: h5p_server_1.LibraryName.toUberName(library),
                message: error.message
            });
        }
    }
    async getFileAsJson(library, file) {
        const str = await this.getFileAsString(library, file);
        return JSON.parse(str);
    }
    async getFileAsString(library, file) {
        const stream = await this.getFileStream(library, file);
        return (0, h5p_server_1.streamToString)(stream);
    }
    /**
     * Returns a information about a library file.
     * Throws an exception if the file does not exist.
     * @param library library
     * @param filename the relative path inside the library
     * @returns the file stats
     */
    async getFileStats(library, file) {
        this.validateFilename(file);
        // The metadata is not saved as a file
        if (file === 'library.json') {
            const metadata = JSON.stringify(await this.getMetadata(library));
            return { size: metadata.length, birthtime: new Date() };
        }
        let fileStats;
        try {
            fileStats = await this.mongodb.findOne({
                ubername: h5p_server_1.LibraryName.toUberName(library),
                'files.filename': file
            }, {
                projection: {
                    ubername: 1,
                    files: {
                        $elemMatch: { filename: file }
                    }
                }
            });
        }
        catch (error) {
            log.error(`Error when getting stats from MongoDB: ${error.message}`);
            throw new h5p_server_1.H5pError('mongo-library-storage:error-getting-stats', { ubername: h5p_server_1.LibraryName.toUberName(library), filename: file }, 500);
        }
        if (!fileStats) {
            throw new h5p_server_1.H5pError('library-file-missing', { ubername: h5p_server_1.LibraryName.toUberName(library), filename: file }, 404);
        }
        return {
            size: fileStats.files[0].size,
            birthtime: new Date(fileStats.files[0].lastModified)
        };
    }
    /**
     * Returns a readable stream of a library file's contents.
     * Throws an exception if the file does not exist.
     * @param library library
     * @param filename the relative path inside the library
     * @returns a readable stream of the file's contents
     */
    async getFileStream(library, file) {
        this.validateFilename(file);
        let fileData;
        try {
            fileData = await this.mongodb.findOne({
                ubername: h5p_server_1.LibraryName.toUberName(library),
                'files.filename': file
            }, {
                projection: {
                    ubername: 1,
                    files: { $elemMatch: { filename: file } }
                }
            });
        }
        catch (error) {
            log.error(`Error when getting file data from MongoDB: ${error.message}`);
            throw new h5p_server_1.H5pError('mongo-library-storage:error-getting-file-data', { ubername: h5p_server_1.LibraryName.toUberName(library), filename: file }, 500);
        }
        if (!fileData) {
            // The library.json file is in the MongoDB document as binary JSON,
            // so we get it from there
            if (file === 'library.json') {
                const metadata = JSON.stringify(await this.getMetadata(library));
                const readable = new stream_buffers_1.ReadableStreamBuffer();
                readable.put(metadata, 'utf-8');
                readable.stop();
                return readable;
            }
            throw new h5p_server_1.H5pError('library-file-missing', {
                ubername: h5p_server_1.LibraryName.toUberName(library),
                filename: file
            }, 404);
        }
        else {
            const readable = new stream_buffers_1.ReadableStreamBuffer();
            readable.put(fileData.files[0].data.buffer);
            readable.stop();
            return readable;
        }
    }
    /**
     * Returns all installed libraries or the installed libraries that have the
     * machine name.
     * @param machineName (optional) only return libraries that have this
     * machine name
     * @returns the libraries installed
     */
    async getInstalledLibraryNames(machineName) {
        try {
            const result = this.mongodb.find(machineName
                ? {
                    'metadata.machineName': machineName
                }
                : {}, {
                projection: {
                    ubername: 1
                }
            });
            const list = await result.toArray();
            return list
                .map((e) => {
                try {
                    return h5p_server_1.LibraryName.fromUberName(e.ubername);
                }
                catch {
                    log.error(`invalid ubername pattern in library storage id: ${e.ubername}. Ignoring...`);
                    return undefined;
                }
            })
                .filter((e) => e);
        }
        catch (error) {
            throw new h5p_server_1.H5pError('mongo-library-storage:error-getting-libraries', { details: error.message });
        }
    }
    /**
     * Gets a list of installed language files for the library.
     * @param library The library to get the languages for
     * @returns The list of JSON files in the language folder (without the extension .json)
     */
    async getLanguages(library) {
        let files = [];
        let result;
        try {
            result = await this.mongodb
                .aggregate([
                {
                    $match: {
                        ubername: h5p_server_1.LibraryName.toUberName(library)
                    }
                },
                {
                    $project: {
                        files: {
                            $filter: {
                                input: '$files',
                                cond: {
                                    $regexMatch: {
                                        input: '$$this.filename',
                                        regex: /^language\//
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        ubername: 1,
                        files: {
                            filename: 1
                        }
                    }
                }
            ])
                .toArray();
        }
        catch (error) {
            log.error(`There was an error while getting list of files from MongoDB: ${error.message}`);
            throw new h5p_server_1.H5pError('mongo-library-storage:error-getting-languages');
        }
        if (result.length === 0) {
            throw new h5p_server_1.H5pError('mongo-library-storage:library-not-found', { ubername: h5p_server_1.LibraryName.toUberName(library) }, 404);
        }
        else if (result.length > 1) {
            throw new h5p_server_1.H5pError('mongo-library-storage:multiple-libraries', { ubername: h5p_server_1.LibraryName.toUberName(library) }, 500);
        }
        files = result[0].files.map((f) => f.filename);
        log.debug(`Found ${files.length} file(s) in MongoDB.`);
        return files
            .filter((file) => path.extname(file) === '.json')
            .map((file) => path.basename(file, '.json'));
    }
    /**
     * Gets the information about an installed library
     * @param library the library
     * @returns the metadata and information about the locally installed library
     */
    async getLibrary(library) {
        if (!library) {
            throw new Error('You must pass in a library name to getLibrary.');
        }
        let result;
        try {
            result = await this.mongodb.findOne({ ubername: h5p_server_1.LibraryName.toUberName(library) }, {
                projection: {
                    metadata: 1,
                    additionalMetadata: 1
                }
            });
        }
        catch (error) {
            throw new h5p_server_1.H5pError('mongo-library-storage:error-getting-library-metadata', { ubername: h5p_server_1.LibraryName.toUberName(library) });
        }
        if (!result) {
            throw new h5p_server_1.H5pError('mongo-library-storage:library-not-found', { ubername: h5p_server_1.LibraryName.toUberName(library) }, 404);
        }
        if (!result.metadata || !result.additionalMetadata) {
            throw new h5p_server_1.H5pError('mongo-library-storage:error-getting-library-metadata', { ubername: h5p_server_1.LibraryName.toUberName(library) });
        }
        return h5p_server_1.InstalledLibrary.fromMetadata({
            ...result.metadata,
            ...result.additionalMetadata
        });
    }
    /**
     * Checks if a library is installed.
     * @param library the library to check
     * @returns true if the library is installed
     */
    async isInstalled(library) {
        const found = await this.mongodb.findOne({ ubername: h5p_server_1.LibraryName.toUberName(library) }, { projection: { ubername: 1 } });
        return !!found;
    }
    /**
     * Returns a list of library addons that are installed in the system.
     * Addons are libraries that have the property 'addTo' in their metadata.
     * ILibraryStorage implementation CAN but NEED NOT implement the method.
     * If it is not implemented, addons won't be available in the system.
     */
    async listAddons() {
        try {
            return (await this.mongodb
                .find({
                'metadata.addTo': { $exists: true }
            }, {
                projection: {
                    metadata: 1
                }
            })
                .toArray()).map((m) => m.metadata);
        }
        catch (error) {
            throw new h5p_server_1.H5pError('mongo-library-storage:error-getting-addons', {
                message: error.message
            });
        }
    }
    /**
     * Gets a list of all library files that exist for this library.
     * @param library
     * @returns all files that exist for the library
     */
    async listFiles(library) {
        let files = [];
        let result;
        try {
            result = await this.mongodb.findOne({
                ubername: h5p_server_1.LibraryName.toUberName(library)
            }, {
                projection: {
                    ubername: 1,
                    files: {
                        filename: 1
                    }
                }
            });
        }
        catch (error) {
            log.error(`Error listing all files of library ${h5p_server_1.LibraryName.toUberName(library)}: ${error.message}`);
            throw new h5p_server_1.H5pError('mongo-library-storage:error-listing-files', { ubername: h5p_server_1.LibraryName.toUberName(library) }, 500);
        }
        if (!result) {
            throw new h5p_server_1.H5pError('mongo-library-storage:library-not-found', { ubername: h5p_server_1.LibraryName.toUberName(library) }, 404);
        }
        files = result.files.map((f) => f.filename).concat(['library.json']);
        log.debug(`Found ${files.length} file(s) in MongoDB.`);
        return files;
    }
    /**
     * Updates the additional metadata properties that is added to the
     * stored libraries. This metadata can be used to customize behavior like
     * restricting libraries to specific users.
     *
     * Implementations should avoid updating the metadata if the additional
     * metadata if nothing has changed.
     * @param library the library for which the metadata should be updated
     * @param additionalMetadata the metadata to update
     * @returns true if the additionalMetadata object contained real changes
     * and if they were successfully saved; false if there were not changes.
     * Throws an error if saving was not possible.
     */
    async updateAdditionalMetadata(library, additionalMetadata) {
        if (!library) {
            throw new Error('You must specify a library name when calling updateAdditionalMetadata.');
        }
        let result;
        try {
            result = await this.mongodb.updateOne({ ubername: h5p_server_1.LibraryName.toUberName(library) }, { $set: { additionalMetadata } });
        }
        catch (error) {
            throw new h5p_server_1.H5pError('mongo-library-storage:update-additional-metadata-error', {
                ubername: h5p_server_1.LibraryName.toUberName(library),
                message: error.message
            });
        }
        if (result.matchedCount !== 1) {
            throw new h5p_server_1.H5pError('mongo-library-storage:library-not-found', { ubername: h5p_server_1.LibraryName.toUberName(library) }, 404);
        }
        return result.modifiedCount === 1;
    }
    /**
     * Updates the library metadata. This is necessary when updating to a new
     * patch version. After this clearFiles(...) is called by the LibraryManager
     * to remove all old files. The next step is to add the patched files with
     * addFile(...).
     * @param libraryMetadata the new library metadata
     * @returns The updated library object
     */
    async updateLibrary(libraryMetadata) {
        const ubername = h5p_server_1.LibraryName.toUberName(libraryMetadata);
        let result;
        try {
            result = await this.mongodb.updateOne({ ubername }, { $set: { metadata: libraryMetadata } });
        }
        catch (error) {
            throw new h5p_server_1.H5pError('mongo-library-storage:update-error', {
                ubername,
                message: error.message
            });
        }
        if (result.matchedCount === 0) {
            throw new h5p_server_1.H5pError('mongo-library-storage:library-not-found', { ubername }, 404);
        }
        if (result.modifiedCount !== 1) {
            log.warn(`Library ${ubername} not updated as metadata has remained the same.`);
        }
        let additionalMetadata;
        try {
            additionalMetadata = (await this.mongodb.findOne({ ubername }, { projection: { additionalMetadata: 1 } })).additionalMetadata;
        }
        catch (error) {
            log.warn(`Could not get additional metadata for library ${ubername}`);
        }
        return h5p_server_1.InstalledLibrary.fromMetadata({
            ...libraryMetadata,
            ...(additionalMetadata ?? {})
        });
    }
    /**
     * Migrates the DB schema from one version to another. You need to call
     * this, when you first deploy the new version.
     * @param from the old major version of @lumieducation/h5p-mongos3
     * @param to the new major version of @lumieducation/h5p-mongos3
     */
    async migrate(from, to) {
        if (from === 9 && to === 10) {
            await this.mongodb.updateMany({}, [
                {
                    $set: {
                        ubername: '$_id'
                    }
                }
            ]);
            await this.createIndexes();
        }
    }
    /**
     * Gets the the metadata of a library. In contrast to getLibrary this is
     * only the metadata.
     * @param library the library
     * @returns the metadata about the locally installed library
     */
    async getMetadata(library) {
        if (!library) {
            throw new Error('You must pass in a library name to getLibrary.');
        }
        let result;
        try {
            result = await this.mongodb.findOne({ ubername: h5p_server_1.LibraryName.toUberName(library) }, {
                projection: {
                    metadata: 1
                }
            });
        }
        catch (error) {
            log.error(error);
            throw new h5p_server_1.H5pError('mongo-library-storage:error-getting-library-metadata', { ubername: h5p_server_1.LibraryName.toUberName(library) });
        }
        if (!result) {
            throw new h5p_server_1.H5pError('mongo-library-storage:library-not-found', { ubername: h5p_server_1.LibraryName.toUberName(library) }, 404);
        }
        if (!result.metadata) {
            throw new h5p_server_1.H5pError('mongo-library-storage:error-getting-library-metadata', { ubername: h5p_server_1.LibraryName.toUberName(library) });
        }
        return result.metadata;
    }
    async readableToBuffer(readable) {
        return new Promise((resolve) => {
            const chunks = [];
            readable.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            readable.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }
    validateFilename(filename) { }
}
exports.default = MongoLibraryStorage;
//# sourceMappingURL=MongoLibraryStorage.js.map