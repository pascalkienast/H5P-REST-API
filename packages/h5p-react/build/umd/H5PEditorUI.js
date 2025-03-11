(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "react", "react", "@lumieducation/h5p-webcomponents"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const React = require("react");
    const react_1 = require("react");
    const h5p_webcomponents_1 = require("@lumieducation/h5p-webcomponents");
    (0, h5p_webcomponents_1.defineElements)('h5p-editor');
    class H5PEditorUI extends react_1.Component {
        constructor(props) {
            super(props);
            this.h5pEditor = (0, react_1.createRef)();
        }
        h5pEditor;
        componentDidMount() {
            this.registerEvents();
            this.setServiceCallbacks();
        }
        componentDidUpdate() {
            this.registerEvents();
            this.setServiceCallbacks();
            this.h5pEditor.current?.resize();
        }
        componentWillUnmount() {
            this.unregisterEvents();
        }
        getSnapshotBeforeUpdate() {
            // Should the old editor instance be destroyed, we unregister from it...
            this.unregisterEvents();
            return null;
        }
        render() {
            return (React.createElement("h5p-editor", { ref: this.h5pEditor, "content-id": this.props.contentId }));
        }
        /**
         * Call this method to save the current state of the h5p editor. This will
         * result in a call to the `saveContentCallback` that was passed in the
         * through the props.
         * @throws an error if there was a problem (e.g. validation error of the
         * content)
         */
        async save() {
            try {
                return await this.h5pEditor.current?.save();
            }
            catch (error) {
                // We ignore the error, as we subscribe to the 'save-error' and
                // 'validation-error' events.
            }
        }
        loadContentCallbackWrapper = (contentId) => {
            return this.props.loadContentCallback(contentId);
        };
        onEditorLoaded = (event) => {
            if (this.props.onLoaded) {
                this.props.onLoaded(event.detail.contentId, event.detail.ubername);
            }
        };
        onSaved = (event) => {
            if (this.props.onSaved) {
                this.props.onSaved(event.detail.contentId, event.detail.metadata);
            }
        };
        onSaveError = async (event) => {
            if (this.props.onSaveError) {
                this.props.onSaveError(event.detail.message);
            }
        };
        registerEvents() {
            this.h5pEditor.current?.addEventListener('saved', this.onSaved);
            this.h5pEditor.current?.addEventListener('editorloaded', this.onEditorLoaded);
            this.h5pEditor.current?.addEventListener('save-error', this.onSaveError);
            this.h5pEditor.current?.addEventListener('validation-error', this.onSaveError);
        }
        saveContentCallbackWrapper = (contentId, requestBody) => {
            return this.props.saveContentCallback(contentId, requestBody);
        };
        setServiceCallbacks() {
            if (this.h5pEditor.current) {
                this.h5pEditor.current.loadContentCallback =
                    this.loadContentCallbackWrapper;
                this.h5pEditor.current.saveContentCallback =
                    this.saveContentCallbackWrapper;
            }
        }
        unregisterEvents() {
            this.h5pEditor.current?.removeEventListener('saved', this.onSaved);
            this.h5pEditor.current?.removeEventListener('editorloaded', this.onEditorLoaded);
            this.h5pEditor.current?.removeEventListener('save-error', this.onSaveError);
            this.h5pEditor.current?.removeEventListener('validation-error', this.onSaveError);
        }
    }
    exports.default = H5PEditorUI;
});
//# sourceMappingURL=H5PEditorUI.js.map