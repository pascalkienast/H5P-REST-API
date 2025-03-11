import * as React from 'react';
import { Component, createRef } from 'react';
import { defineElements } from '@lumieducation/h5p-webcomponents';
defineElements('h5p-player');
export default class H5PPlayerUI extends Component {
    constructor(props) {
        super(props);
        this.h5pPlayer = createRef();
    }
    h5pPlayer;
    componentDidMount() {
        this.registerEvents();
        this.setServiceCallbacks();
    }
    componentDidUpdate() {
        this.registerEvents();
        this.setServiceCallbacks();
    }
    componentWillUnmount() {
        this.unregisterEvents();
    }
    /**
     * The internal H5P instance object of the H5P content.
     *
     * Only available after the `initialized` event was fired. Important: This
     * object is only partially typed and there are more properties and methods
     * on it!
     */
    get h5pInstance() {
        return this.h5pPlayer.current?.h5pInstance;
    }
    /**
     * The global H5P object / namespace (normally accessible through "H5P..."
     * or "window.H5P") of the content type. Depending on the embed type this
     * can be an object from the internal iframe, so you can use it to break the
     * barrier of the iframe and execute JavaScript inside the iframe.
     *
     * Only available after the `initialized` event was fired. Important: This
     * object is only partially typed and there are more properties and methods
     * on it!
     */
    get h5pObject() {
        return this.h5pPlayer.current?.h5pObject;
    }
    /**
     * Returns the copyright notice in HTML that you can insert somewhere to
     * display it. Undefined if there is no copyright information.
     */
    getCopyrightHtml() {
        return this.h5pPlayer.current?.getCopyrightHtml() ?? '';
    }
    getSnapshotBeforeUpdate() {
        // Should the old editor instance be destroyed, we unregister from it...
        this.unregisterEvents();
        return null;
    }
    /**
     * @returns true if there is copyright information to be displayed.
     */
    hasCopyrightInformation() {
        return this.h5pPlayer.current?.hasCopyrightInformation();
    }
    render() {
        return (React.createElement("h5p-player", { ref: this.h5pPlayer, "content-id": this.props.contentId, "context-id": this.props.contextId, "as-user-id": this.props.asUserId, "read-only-state": this.props.readOnlyState }));
    }
    /**
     * Displays the copyright notice in the regular H5P way.
     */
    showCopyright() {
        this.h5pPlayer.current?.showCopyright();
    }
    /**
     * Asks the H5P content to resize itself inside the dimensions of the
     * container.
     *
     * Has no effect until the H5P object has fully initialized.
     */
    resize() {
        this.h5pPlayer.current?.resize();
    }
    loadContentCallbackWrapper = (contentId, contextId, asUserId, readOnlyState) => this.props.loadContentCallback(contentId, contextId, asUserId, readOnlyState);
    onInitialized = (event) => {
        if (this.props.onInitialized) {
            this.props.onInitialized(event.detail.contentId);
        }
    };
    onxAPIStatement = (event) => {
        if (this.props.onxAPIStatement) {
            this.props.onxAPIStatement(event.detail.statement, event.detail.context, event.detail.event);
        }
    };
    registerEvents() {
        this.h5pPlayer.current?.addEventListener('initialized', this.onInitialized);
        if (this.props.onxAPIStatement) {
            this.h5pPlayer.current?.addEventListener('xAPI', this.onxAPIStatement);
        }
    }
    setServiceCallbacks() {
        if (this.h5pPlayer.current) {
            this.h5pPlayer.current.loadContentCallback =
                this.loadContentCallbackWrapper;
        }
    }
    unregisterEvents() {
        this.h5pPlayer.current?.removeEventListener('initialized', this.onInitialized);
        if (this.props.onxAPIStatement) {
            this.h5pPlayer.current?.removeEventListener('xAPI', this.onxAPIStatement);
        }
    }
}
//# sourceMappingURL=H5PPlayerUI.js.map