define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * This service performs queries at the REST endpoint of the content type cache.
     */
    class ContentTypeCacheService {
        baseUrl;
        constructor(baseUrl) {
            this.baseUrl = baseUrl;
        }
        /**
         * Gets the last update date and time.
         */
        async getCacheUpdate() {
            const response = await fetch(`${this.baseUrl}/update`);
            if (response.ok) {
                const { lastUpdate } = await response.json();
                return lastUpdate === null ? null : new Date(lastUpdate);
            }
            throw new Error(`Could not get content type cache update date: ${response.status} - ${response.statusText}`);
        }
        /**
         * Triggers a content type cache update that will contact the H5P Hub and
         * retrieve the latest content type list.
         */
        async postUpdateCache() {
            const response = await fetch(`${this.baseUrl}/update`, {
                method: 'POST'
            });
            if (response.ok) {
                return new Date((await response.json()).lastUpdate);
            }
            throw new Error(`Could not update content type cache: ${response.status} - ${response.statusText}`);
        }
    }
    exports.default = ContentTypeCacheService;
});
//# sourceMappingURL=ContentTypeCacheService.js.map