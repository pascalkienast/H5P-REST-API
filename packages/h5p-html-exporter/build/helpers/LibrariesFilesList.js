"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const h5p_server_1 = require("@lumieducation/h5p-server");
/**
 * Collects lists of files grouped by libraries.
 */
class LibrariesFilesList {
    usedFiles = {};
    /**
     * Adds a library file to the list.
     * @param library
     * @param filename
     */
    addFile(library, filename) {
        const ubername = h5p_server_1.LibraryName.toUberName(library);
        if (!this.usedFiles[ubername]) {
            this.usedFiles[ubername] = [];
        }
        this.usedFiles[ubername].push(filename);
    }
    /**
     * Checks if a library file is in the list
     * @param library
     * @param filename
     */
    checkFile(library, filename) {
        return this.usedFiles[h5p_server_1.LibraryName.toUberName(library)]?.includes(filename);
    }
    /**
     * Clears the list of all libraries.
     */
    clear() {
        this.usedFiles = {};
    }
}
exports.default = LibrariesFilesList;
//# sourceMappingURL=LibrariesFilesList.js.map