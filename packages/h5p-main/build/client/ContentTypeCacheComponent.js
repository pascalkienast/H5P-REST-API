var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "react", "./ContentTypeCacheService.js"], function (require, exports, react_1, ContentTypeCacheService_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    react_1 = __importDefault(react_1);
    ContentTypeCacheService_js_1 = __importDefault(ContentTypeCacheService_js_1);
    /**
     * This components provides a UI for checking the last update time of the
     * content type cache und updating manually when necessary.
     *
     * It uses Bootstrap 4 to layout the component. You can override or replace the
     * render() method to customize looks.
     */
    class ContentTypeCacheComponent extends react_1.default.Component {
        /**
         * @param endpointurl the URL of the REST content type cache administration
         * endpoint
         */
        constructor(props) {
            super(props);
            this.state = {
                lastCacheUpdate: undefined,
                updatingCache: null
            };
            this.contentTypeCacheService = new ContentTypeCacheService_js_1.default(props.endpointUrl);
        }
        contentTypeCacheService;
        async componentDidMount() {
            const lastCacheUpdate = await this.contentTypeCacheService.getCacheUpdate();
            this.setState({ lastCacheUpdate });
        }
        render() {
            return (react_1.default.createElement("div", null,
                react_1.default.createElement("h2", null,
                    react_1.default.createElement("span", { className: "fa fa-globe" }),
                    " H5P Hub content type list"),
                react_1.default.createElement("p", null, "The list of content types displayed in the editor must regularly be fetched from the H5P Hub. If the list is outdated, you can manually fetch it here."),
                react_1.default.createElement("div", null,
                    "Last update:",
                    ' ',
                    this.state.lastCacheUpdate !== undefined
                        ? this.state.lastCacheUpdate === null
                            ? 'never'
                            : this.state.lastCacheUpdate.toString()
                        : 'Loading...'),
                react_1.default.createElement("button", { onClick: () => this.updateCache(), className: "btn btn-primary my-2", disabled: this.state.updatingCache },
                    this.state.updatingCache ? (react_1.default.createElement("div", { className: "spinner-border spinner-border-sm m-2 align-middle", role: "status" })) : (react_1.default.createElement("span", { className: "fa fa-sync m-2" })),
                    react_1.default.createElement("span", { className: "align-middle" }, "Update now"))));
        }
        async updateCache() {
            this.setState({ updatingCache: true });
            try {
                const lastUpdate = await this.contentTypeCacheService.postUpdateCache();
                this.setState({
                    lastCacheUpdate: lastUpdate,
                    updatingCache: false
                });
            }
            catch {
                this.setState({
                    updatingCache: false
                });
            }
        }
    }
    exports.default = ContentTypeCacheComponent;
});
//# sourceMappingURL=ContentTypeCacheComponent.js.map