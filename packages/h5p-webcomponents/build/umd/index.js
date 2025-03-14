(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./h5p-editor", "./h5p-player"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.H5PPlayerComponent = exports.H5PEditorComponent = void 0;
    exports.defineElements = defineElements;
    const h5p_editor_1 = require("./h5p-editor");
    Object.defineProperty(exports, "H5PEditorComponent", { enumerable: true, get: function () { return h5p_editor_1.H5PEditorComponent; } });
    const h5p_player_1 = require("./h5p-player");
    Object.defineProperty(exports, "H5PPlayerComponent", { enumerable: true, get: function () { return h5p_player_1.H5PPlayerComponent; } });
    function defineElements(element) {
        if ((!element ||
            (typeof element === 'string' && element === 'h5p-player') ||
            (Array.isArray(element) && element.includes('h5p-player'))) &&
            !window.customElements.get('h5p-player')) {
            window.customElements.define('h5p-player', h5p_player_1.H5PPlayerComponent);
        }
        if ((!element ||
            (typeof element === 'string' && element === 'h5p-editor') ||
            (Array.isArray(element) && element.includes('h5p-editor'))) &&
            !window.customElements.get('h5p-editor')) {
            window.customElements.define('h5p-editor', h5p_editor_1.H5PEditorComponent);
        }
    }
});
//# sourceMappingURL=index.js.map