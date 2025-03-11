(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "deepmerge"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mergeH5PIntegration = mergeH5PIntegration;
    exports.removeUnusedContent = removeUnusedContent;
    const deepmerge_1 = require("deepmerge");
    /**
     * Merges the new IIntegration object with the global one.
     * @param newIntegration
     * @param contentId
     */
    function mergeH5PIntegration(newIntegration, contentId) {
        if (!window.H5PIntegration) {
            window.H5PIntegration = newIntegration;
            return;
        }
        if (contentId &&
            newIntegration.contents &&
            newIntegration.contents[`cid-${contentId}`]) {
            if (!window.H5PIntegration.contents) {
                window.H5PIntegration.contents = {};
            }
            window.H5PIntegration.contents[`cid-${contentId}`] =
                newIntegration.contents[`cid-${contentId}`];
        }
        // We don't want to mutate the newIntegration parameter, so we shallow clone
        // it.
        const newIntegrationDup = { ...newIntegration };
        // We don't merge content object information, as there might be issues with
        // this.
        delete newIntegrationDup.contents;
        window.H5PIntegration = (0, deepmerge_1.default)(window.H5PIntegration, newIntegrationDup);
    }
    /**
     * Removes the data about the content from the global H5PIntegration object.
     * @param contentId
     */
    function removeUnusedContent(contentId) {
        if (window.H5PIntegration?.contents &&
            window.H5PIntegration.contents[`cid-${contentId}`]) {
            delete window.H5PIntegration.contents[`cid-${contentId}`];
        }
    }
});
//# sourceMappingURL=h5p-utils.js.map