define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LibraryAdministrationService = void 0;
    /**
     *
     */
    class LibraryAdministrationService {
        baseUrl;
        constructor(baseUrl) {
            this.baseUrl = baseUrl;
        }
        async deleteLibrary(library) {
            const response = await fetch(`${this.baseUrl}/${library.machineName}-${library.majorVersion}.${library.minorVersion}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                return;
            }
            throw new Error(`Could not delete library: ${response.status} - ${response.text}`);
        }
        async getLibraries() {
            const response = await fetch(this.baseUrl);
            if (response.ok) {
                return response.json();
            }
            throw new Error(`Could not get library list: ${response.status} - ${response.statusText}`);
        }
        async getLibrary(library) {
            const response = await fetch(`${this.baseUrl}/${library.machineName}-${library.majorVersion}.${library.minorVersion}`);
            if (response.ok) {
                return response.json();
            }
            throw new Error(`Could not get library details: ${response.status} - ${response.statusText}`);
        }
        async patchLibrary(library, changes) {
            const response = await fetch(`${this.baseUrl}/${library.machineName}-${library.majorVersion}.${library.minorVersion}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8'
                },
                body: JSON.stringify(changes)
            });
            if (response.ok) {
                return { ...library, ...changes };
            }
            throw new Error(`Could not patch library: ${response.status} - ${response.statusText}`);
        }
        async postPackage(file) {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                body: formData
            });
            if (response.ok) {
                const result = await response.json();
                return { installed: result.installed, updated: result.updated };
            }
            throw new Error(`Could not upload package with libraries: ${response.status} - ${response.statusText}`);
        }
    }
    exports.LibraryAdministrationService = LibraryAdministrationService;
});
//# sourceMappingURL=LibraryAdministrationService.js.map