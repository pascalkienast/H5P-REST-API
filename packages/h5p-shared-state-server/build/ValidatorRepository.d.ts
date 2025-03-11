import { ILibraryName } from '@lumieducation/h5p-server';
import { ValidateFunction } from 'ajv/dist/2020';
import { GetLibraryFileAsJsonFunction, ILogicalOperator, ILogicCheck } from './types';
/**
 * Keeps track of validation functions and structures and caches them in memory.
 */
export default class ValidatorRepository {
    private getLibraryFileAsJson;
    constructor(getLibraryFileAsJson: GetLibraryFileAsJsonFunction);
    private validatorCache;
    private ajv;
    /**
     * Gets the validator function for the op schema.
     * @param libraryName
     */
    getOpSchemaValidator(libraryName: ILibraryName): Promise<ValidateFunction>;
    /**
     * Gets the validator function for snapshots.
     * @param libraryName
     */
    getSnapshotSchemaValidator(libraryName: ILibraryName): Promise<ValidateFunction>;
    /**
     * Gets the logic check structure for ops
     * @param libraryName
     * @returns the logical structure; note that even if the structure is typed
     * at the moment, is not validated when read from storage, so it is possible
     * that a malformed file in a library does not conform to the types
     */
    getOpLogicCheck(libraryName: ILibraryName): Promise<(ILogicCheck | ILogicalOperator)[]>;
    /**
     * Gets the logic checks for snapshots.
     * @param libraryName
     * @returns the logical structure; note that even if the structure is typed
     * at the moment, is not validated when read from storage, so it is possible
     * that a malformed file in a library does not conform to the types
     */
    getSnapshotLogicCheck(libraryName: ILibraryName): Promise<any>;
}
