import MongoDB from 'mongodb';
import { ObjectCannedACL, S3 } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { IAdditionalLibraryMetadata, IFileStats, IInstalledLibrary, ILibraryMetadata, ILibraryName, ILibraryStorage } from '@lumieducation/h5p-server';
export default class MongoS3LibraryStorage implements ILibraryStorage {
    private s3;
    private mongodb;
    private options;
    /**
     * @param s3 the S3 content storage; Must be either set to a bucket or the
     * bucket must be specified in the options!
     * @param mongodb a MongoDB collection (read- and writable)
     * @param options options
     */
    constructor(s3: S3, mongodb: MongoDB.Collection<{
        ubername: string;
        metadata: ILibraryMetadata;
        additionalMetadata: Partial<IAdditionalLibraryMetadata>;
    }>, options: {
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
     * Adds a library file to a library. The library metadata must have been installed with addLibrary(...) first.
     * Throws an error if something unexpected happens. In this case the method calling addFile(...) will clean
     * up the partly installed library.
     * @param library The library that is being installed
     * @param filename Filename of the file to add, relative to the library root
     * @param stream The stream containing the file content
     * @returns true if successful
     */
    addFile(library: ILibraryName, filename: string, readStream: Readable): Promise<boolean>;
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
    addLibrary(libraryData: ILibraryMetadata, restricted: boolean): Promise<IInstalledLibrary>;
    /**
     * Removes all files of a library. Doesn't delete the library metadata. (Used when updating libraries.)
     * @param library the library whose files should be deleted
     */
    clearFiles(library: ILibraryName): Promise<void>;
    /**
     * Creates indexes to speed up read access. Can be safely used even if
     * indexes already exist.
     */
    createIndexes(): Promise<void>;
    /**
     * Removes the library and all its files from the repository.
     * Throws errors if something went wrong.
     * @param library The library to remove.
     */
    deleteLibrary(library: ILibraryName): Promise<void>;
    /**
     * Check if the library contains a file.
     * @param library The library to check
     * @param filename
     * @returns true if file exists in library, false otherwise
     */
    fileExists(library: ILibraryName, filename: string): Promise<boolean>;
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
    getAllDependentsCount(): Promise<{
        [ubername: string]: number;
    }>;
    /**
     * Returns the number of libraries that depend on this (single) library.
     * @param library the library to check
     * @returns the number of libraries that depend on this library.
     */
    getDependentsCount(library: ILibraryName): Promise<number>;
    getFileAsJson(library: ILibraryName, file: string): Promise<any>;
    getFileAsString(library: ILibraryName, file: string): Promise<string>;
    /**
     * Returns a information about a library file.
     * Throws an exception if the file does not exist.
     * @param library library
     * @param filename the relative path inside the library
     * @returns the file stats
     */
    getFileStats(library: ILibraryName, file: string): Promise<IFileStats>;
    /**
     * Returns a readable stream of a library file's contents.
     * Throws an exception if the file does not exist.
     * @param library library
     * @param filename the relative path inside the library
     * @returns a readable stream of the file's contents
     */
    getFileStream(library: ILibraryName, file: string): Promise<Readable>;
    /**
     * Returns all installed libraries or the installed libraries that have the
     * machine name.
     * @param machineName (optional) only return libraries that have this
     * machine name
     * @returns the libraries installed
     */
    getInstalledLibraryNames(machineName?: string): Promise<ILibraryName[]>;
    /**
     * Gets a list of installed language files for the library.
     * @param library The library to get the languages for
     * @returns The list of JSON files in the language folder (without the extension .json)
     */
    getLanguages(library: ILibraryName): Promise<string[]>;
    /**
     * Gets the information about an installed library
     * @param library the library
     * @returns the metadata and information about the locally installed library
     */
    getLibrary(library: ILibraryName): Promise<IInstalledLibrary>;
    /**
     * Checks if a library is installed.
     * @param library the library to check
     * @returns true if the library is installed
     */
    isInstalled(library: ILibraryName): Promise<boolean>;
    /**
     * Returns a list of library addons that are installed in the system.
     * Addons are libraries that have the property 'addTo' in their metadata.
     * ILibraryStorage implementation CAN but NEED NOT implement the method.
     * If it is not implemented, addons won't be available in the system.
     */
    listAddons(): Promise<ILibraryMetadata[]>;
    /**
     * Gets a list of all library files that exist for this library.
     * @param library the library name
     * @param withMetadata true if the 'library.json' file should be included in
     * the list
     * @returns all files that exist for the library
     */
    listFiles(library: ILibraryName, options?: {
        withMetadata?: boolean;
    }): Promise<string[]>;
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
    updateAdditionalMetadata(library: ILibraryName, additionalMetadata: Partial<IAdditionalLibraryMetadata>): Promise<boolean>;
    /**
     * Updates the library metadata. This is necessary when updating to a new patch version.
     * After this clearFiles(...) is called by the LibraryManager to remove all old files.
     * The next step is to add the patched files with addFile(...).
     * @param libraryMetadata the new library metadata
     * @returns The updated library object
     */
    updateLibrary(libraryMetadata: ILibraryMetadata): Promise<IInstalledLibrary>;
    /**
     * Migrates the DB schema from one version to another. You need to call
     * this, when you first deploy the new version.
     * @param from the old major version of @lumieducation/h5p-mongos3
     * @param to the new major version of @lumieducation/h5p-mongos3
     */
    migrate(from: number, to: number): Promise<void>;
    /**
     * Gets the the metadata of a library. In contrast to getLibrary this is
     * only the metadata.
     * @param library the library
     * @returns the metadata about the locally installed library
     */
    private getMetadata;
    private getS3Key;
}
