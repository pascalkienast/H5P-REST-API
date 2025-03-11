"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const h5p_server_1 = require("@lumieducation/h5p-server");
const _2020_1 = __importDefault(require("ajv/dist/2020"));
/**
 * Keeps track of validation functions and structures and caches them in memory.
 */
class ValidatorRepository {
    getLibraryFileAsJson;
    constructor(getLibraryFileAsJson) {
        this.getLibraryFileAsJson = getLibraryFileAsJson;
    }
    validatorCache = {};
    ajv = new _2020_1.default();
    /**
     * Gets the validator function for the op schema.
     * @param libraryName
     */
    async getOpSchemaValidator(libraryName) {
        const ubername = h5p_server_1.LibraryName.toUberName(libraryName);
        if (this.validatorCache[ubername]?.op !== undefined) {
            return this.validatorCache[ubername].op;
        }
        let validator;
        try {
            const schemaJson = await this.getLibraryFileAsJson(libraryName, 'opSchema.json');
            validator = this.ajv.compile(schemaJson);
        }
        catch (error) {
            console.error('Error while getting op schema:', error);
            this.validatorCache[ubername].op = null;
            return null;
        }
        if (!this.validatorCache[ubername]) {
            this.validatorCache[ubername] = {};
        }
        this.validatorCache[ubername].op = validator;
        return validator;
    }
    /**
     * Gets the validator function for snapshots.
     * @param libraryName
     */
    async getSnapshotSchemaValidator(libraryName) {
        const ubername = h5p_server_1.LibraryName.toUberName(libraryName);
        if (this.validatorCache[ubername]?.snapshot !== undefined) {
            return this.validatorCache[ubername].snapshot;
        }
        let validator;
        try {
            const schemaJson = await this.getLibraryFileAsJson(libraryName, 'snapshotSchema.json');
            validator = this.ajv.compile(schemaJson);
        }
        catch (error) {
            console.error('Error while getting op schema:', error);
            this.validatorCache[ubername].snapshot = null;
            return null;
        }
        if (!this.validatorCache[ubername]) {
            this.validatorCache[ubername] = {};
        }
        this.validatorCache[ubername].snapshot = validator;
        return validator;
    }
    /**
     * Gets the logic check structure for ops
     * @param libraryName
     * @returns the logical structure; note that even if the structure is typed
     * at the moment, is not validated when read from storage, so it is possible
     * that a malformed file in a library does not conform to the types
     */
    async getOpLogicCheck(libraryName) {
        const ubername = h5p_server_1.LibraryName.toUberName(libraryName);
        if (this.validatorCache[ubername]?.opLogicCheck !== undefined) {
            return this.validatorCache[ubername].opLogicCheck;
        }
        let logicCheck;
        try {
            logicCheck = await this.getLibraryFileAsJson(libraryName, 'opLogicCheck.json');
        }
        catch (error) {
            console.error('Error while getting op schema:', error);
            this.validatorCache[ubername].opLogicCheck = null;
            return null;
        }
        if (!this.validatorCache[ubername]) {
            this.validatorCache[ubername] = {};
        }
        this.validatorCache[ubername].opLogicCheck = logicCheck;
        return logicCheck;
    }
    /**
     * Gets the logic checks for snapshots.
     * @param libraryName
     * @returns the logical structure; note that even if the structure is typed
     * at the moment, is not validated when read from storage, so it is possible
     * that a malformed file in a library does not conform to the types
     */
    async getSnapshotLogicCheck(libraryName) {
        const ubername = h5p_server_1.LibraryName.toUberName(libraryName);
        if (this.validatorCache[ubername]?.snapshotLogicCheck !== undefined) {
            return this.validatorCache[ubername].snapshotLogicCheck;
        }
        let logicCheck;
        try {
            logicCheck = await this.getLibraryFileAsJson(libraryName, 'snapshotLogicCheck.json');
        }
        catch (error) {
            console.error('Error while getting op schema:', error);
            this.validatorCache[ubername].snapshotLogicCheck = null;
            return null;
        }
        if (!this.validatorCache[ubername]) {
            this.validatorCache[ubername] = {};
        }
        this.validatorCache[ubername].snapshotLogicCheck = logicCheck;
        return logicCheck;
    }
}
exports.default = ValidatorRepository;
//# sourceMappingURL=ValidatorRepository.js.map