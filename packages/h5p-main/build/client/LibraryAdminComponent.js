var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "react", "./LibraryDetailsComponent.js", "./LibraryAdministrationService.js"], function (require, exports, react_1, LibraryDetailsComponent_js_1, LibraryAdministrationService_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    react_1 = __importDefault(react_1);
    LibraryDetailsComponent_js_1 = __importDefault(LibraryDetailsComponent_js_1);
    /**
     * The components displays a list with the currently installed libraries. It
     * offers basic administration functions like deleting libraries, showing more
     * details of an installed library and uploading new libraries.
     *
     * It uses Bootstrap 4 to layout the component. You can override or replace the
     * render() method to customize looks.
     */
    class LibraryAdmin extends react_1.default.Component {
        /**
         * @param endpointUrl the URL of the REST library administration endpoint.
         */
        constructor(props) {
            super(props);
            this.state = {
                isUploading: false,
                libraries: null,
                message: null
            };
            this.librariesService = new LibraryAdministrationService_js_1.LibraryAdministrationService(props.endpointUrl);
        }
        librariesService;
        async componentDidMount() {
            return this.updateList();
        }
        render() {
            return (react_1.default.createElement("div", null,
                react_1.default.createElement("h2", null,
                    react_1.default.createElement("span", { className: "fa fa-book-open" }),
                    " Installed libraries"),
                react_1.default.createElement("form", null,
                    react_1.default.createElement("div", { className: "form-group" },
                        react_1.default.createElement("label", { className: `btn btn-primary ${this.state.isUploading ? 'disabled' : ''}` },
                            this.state.isUploading ? (react_1.default.createElement("div", { className: "spinner-border spinner-border-sm m-2 align-middle", role: "status" })) : (react_1.default.createElement("span", { className: "fa fa-upload m-2" })),
                            ' ',
                            "Upload libraries",
                            react_1.default.createElement("input", { disabled: this.state.isUploading, type: "file", id: "file2", hidden: true, onChange: (e) => this.fileSelected(e.target.files) })))),
                this.state.message ? (react_1.default.createElement("div", { className: `alert alert-${this.state.message.type}` }, this.state.message.text)) : null,
                this.state.libraries === null ? (react_1.default.createElement("div", null,
                    react_1.default.createElement("div", { className: "spinner-grow spinner-grow-sm text-primary align-middle mr-2", role: "status" },
                        react_1.default.createElement("span", { className: "sr-only" })),
                    react_1.default.createElement("span", { className: "align-middle" }, "Loading installed libraries from REST endpoint ..."))) : (react_1.default.createElement("div", null,
                    react_1.default.createElement("p", null, "The following libraries are installed in the library storage:"),
                    react_1.default.createElement("table", { className: "table table-sm" },
                        react_1.default.createElement("thead", null,
                            react_1.default.createElement("tr", null,
                                react_1.default.createElement("th", null, "Title"),
                                react_1.default.createElement("th", null, "Restricted"),
                                react_1.default.createElement("th", null, "# used directly"),
                                react_1.default.createElement("th", null, "# used in other content types"),
                                react_1.default.createElement("th", null, "# dependent libraries"),
                                react_1.default.createElement("th", null),
                                react_1.default.createElement("th", null))),
                        react_1.default.createElement("tbody", null, this.state.libraries?.map((info) => (react_1.default.createElement(react_1.default.Fragment, { key: `${info.machineName}-${info.majorVersion}.${info.minorVersion}` },
                            react_1.default.createElement("tr", null,
                                react_1.default.createElement("td", null,
                                    info.title,
                                    " (",
                                    info.majorVersion,
                                    ".",
                                    info.minorVersion,
                                    ".",
                                    info.patchVersion,
                                    ")"),
                                react_1.default.createElement("td", null, info.runnable ? (react_1.default.createElement("input", { type: "checkbox", checked: info.restricted, onChange: () => this.restrict(info) })) : null),
                                react_1.default.createElement("td", null, info.instancesCount),
                                react_1.default.createElement("td", null, info.instancesAsDependencyCount),
                                react_1.default.createElement("td", null, info.dependentsCount),
                                react_1.default.createElement("td", null,
                                    react_1.default.createElement("button", { className: "btn btn-info", onClick: () => this.showDetails(info) },
                                        react_1.default.createElement("span", { className: "fa fa-info m-2", style: {
                                                display: 'inline'
                                            } }),
                                        react_1.default.createElement("span", null, "details"))),
                                react_1.default.createElement("td", null, info.canBeDeleted ? (react_1.default.createElement("button", { className: "btn btn-danger", disabled: info.isDeleting, onClick: () => this.deleteLibrary(info) },
                                    react_1.default.createElement("span", { className: "fa fa-trash-alt m-2", style: {
                                            display: 'inline'
                                        } }),
                                    react_1.default.createElement("span", null, "delete"))) : (react_1.default.createElement("div", null)))),
                            info.isShowingDetails ? (react_1.default.createElement("tr", null,
                                react_1.default.createElement("td", { colSpan: 7 },
                                    react_1.default.createElement(LibraryDetailsComponent_js_1.default, { details: info.details, onClose: () => this.closeDetails(info) })))) : null)))))))));
        }
        closeDetails(library) {
            this.updateLibraryState(library, { isShowingDetails: false });
        }
        async deleteLibrary(library) {
            const newState = this.updateLibraryState(library, {
                isDeleting: true
            });
            try {
                await this.librariesService.deleteLibrary(library);
                const libraryIndex = this.state.libraries.indexOf(newState);
                this.setState({
                    libraries: this.state.libraries
                        .slice(0, libraryIndex)
                        .concat(this.state.libraries.slice(libraryIndex + 1))
                });
                this.displayMessage(`Successfully deleted library ${library.title} (${library.majorVersion}.${library.minorVersion}).`);
                await this.updateList();
            }
            catch {
                this.displayMessage(`Error deleting library ${library.title} (${library.majorVersion}.${library.minorVersion}).`, 'danger');
                this.updateLibraryState(newState, { isDeleting: false });
                await this.updateList();
            }
        }
        async fileSelected(files) {
            if (!files[0]) {
                return;
            }
            try {
                this.setState({ isUploading: true });
                const { installed, updated } = await this.librariesService.postPackage(files[0]);
                if (installed + updated === 0) {
                    this.displayMessage('Upload successful, but no libraries were installed or updated. The content type is probably already installed on the system.');
                    return;
                }
                this.displayMessage(`Successfully installed ${installed} and updated ${updated} libraries.`, 'success');
            }
            catch {
                this.displayMessage(`Error while uploading package.`, 'danger');
                return;
            }
            finally {
                this.setState({ isUploading: false });
            }
            this.setState({ libraries: null });
            const libraries = await this.librariesService.getLibraries();
            this.setState({ libraries });
        }
        async restrict(library) {
            try {
                const newLibrary = await this.librariesService.patchLibrary(library, {
                    restricted: !library.restricted
                });
                this.updateLibraryState(library, newLibrary);
                this.displayMessage(`Successfully set restricted property of library ${library.title} (${library.majorVersion}.${library.minorVersion}) to ${newLibrary.restricted}.`, 'success');
            }
            catch {
                this.displayMessage(`Error setting restricted proeprty of library ${library.title} (${library.majorVersion}.${library.minorVersion}).`, 'danger');
            }
        }
        async showDetails(library) {
            const newState = this.updateLibraryState(library, {
                isShowingDetails: true
            });
            if (!library.details) {
                try {
                    const details = await this.librariesService.getLibrary(library);
                    this.updateLibraryState(newState, {
                        details
                    });
                }
                catch {
                    this.displayMessage(`Error getting detailed information about library ${library.title} (${library.majorVersion}.${library.minorVersion}).`, 'danger');
                }
            }
        }
        async updateList() {
            const libraries = await this.librariesService.getLibraries();
            this.setState({ libraries });
        }
        displayMessage(text, type = 'primary') {
            this.setState({
                message: {
                    text,
                    type
                }
            });
        }
        updateLibraryState(library, changes) {
            const libraryIndex = this.state.libraries.indexOf(library);
            const newState = {
                ...library,
                ...changes
            };
            this.setState({
                libraries: [
                    ...this.state.libraries.slice(0, libraryIndex),
                    newState,
                    ...this.state.libraries.slice(libraryIndex + 1)
                ]
            });
            return newState;
        }
    }
    exports.default = LibraryAdmin;
});
//# sourceMappingURL=LibraryAdminComponent.js.map