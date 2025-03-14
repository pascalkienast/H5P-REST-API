import { mergeH5PIntegration } from './h5p-utils';
import { addScripts } from './dom-utils';
export class H5PEditorComponent extends HTMLElement {
    constructor() {
        super();
        H5PEditorComponent.initTemplate();
    }
    get contentId() {
        return this.getAttribute('content-id') ?? undefined;
    }
    set contentId(contentId) {
        if (!contentId) {
            this.removeAttribute('content-id');
        }
        else {
            this.setAttribute('content-id', contentId);
        }
    }
    /**
     * Called when the component needs to load data about content. The endpoint
     * called in here combines the results of H5PEditor.render(...) and
     * H5PEditor.getContent(...) to avoid too many requests.
     *
     * Note that the library, metadata and params property of the returned
     * object must only be defined if contentId is defined.
     *
     * Should throw an error with a message in the message property if something
     * goes wrong.
     */
    get loadContentCallback() {
        return this.privateLoadContentCallback;
    }
    set loadContentCallback(callback) {
        // We only (re-)render the component if the callback was really changed.
        const mustRender = this.privateLoadContentCallback !== callback;
        this.privateLoadContentCallback = callback;
        if (mustRender) {
            this.render(this.contentId);
        }
    }
    /**
     * Indicates changes to which attributes should trigger calls to
     * attributeChangedCallback.
     */
    static get observedAttributes() {
        return ['content-id', 'h5p-url'];
    }
    static template;
    /**
     * Called when the component needs to save data about content. The endpoint
     * called here should call H5PEditor.saveOrUpdateContentReturnMetaData(...).
     * Note that it makes sense to use PATCH requests for updates and POST
     * requests for new content, but it's up to you how you implement this. See
     * defaultSaveContentCallback for an example.
     *
     * Should throw an error with a message in the message property if something
     * goes wrong.
     * @param contentId the contentId which needs to be saved; can be undefined
     * for new content, which hasn't been saved before
     * @param requestBody the data needed by the server; usually encoded as JSON
     * string and sent to the server
     * @returns the newly assigned content id and metadata
     */
    saveContentCallback;
    editorInstance;
    /**
     * Stores the H5P instance (H5P native object of the core).
     */
    privateLoadContentCallback;
    resizeObserver;
    root;
    static initTemplate() {
        // We create the static template only once
        if (!H5PEditorComponent.template) {
            H5PEditorComponent.template = document.createElement('template');
            H5PEditorComponent.template.innerHTML = `
            <style>
            .h5peditor-semi-fullscreen {
                margin: 0;
                padding: 0;
                position: fixed;
                overflow-y: scroll;
                box-sizing: border-box;
                height: 100%;
                width: 100%;
                left: 0;
                top: 0;
            }
            </style>
            <div class="h5p-editor-component-root"></div>`;
        }
    }
    /**
     * Called when one of the attributes in observedAttributes changes.
     */
    async attributeChangedCallback(name, oldVal, newVal) {
        // We don't render if the component's content id changes from 'new'
        // to something else, as this would lead to flickering when saving
        // newly created content.
        if (name === 'content-id' && oldVal !== newVal && oldVal !== 'new') {
            await this.render(newVal);
        }
    }
    /**
     * Called when the component is added to the DOM.
     */
    async connectedCallback() {
        this.appendChild(H5PEditorComponent.template.content.cloneNode(true));
        this.root = this.querySelector('.h5p-editor-component-root');
        this.resizeObserver = new ResizeObserver(() => {
            this.resize();
        });
        this.resizeObserver.observe(this);
        await this.render(this.contentId);
    }
    /**
     * Called when the component is removed from the DOM.
     */
    disconnectedCallback() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        // Unregister our event listener from the global H5P dispatcher.
        if (window.H5P?.externalDispatcher) {
            window.H5P.externalDispatcher.off('editorloaded', this.onEditorLoaded);
        }
    }
    /**
     * Call this method when the iframe containing the editor needs to be
     * resized, e.g. because the some
     */
    resize = () => {
        const h5pEditorIframe = this.querySelector('.h5p-editor-iframe');
        if (h5pEditorIframe) {
            const newHeight = h5pEditorIframe.contentWindow?.document?.body?.scrollHeight;
            if (newHeight !== undefined) {
                h5pEditorIframe.style.height = `${h5pEditorIframe.contentWindow.document.body.scrollHeight.toString()}px`;
            }
        }
    };
    /**
     * Call save() to get data from the H5P editor and send it to the server.
     * You can use the saveContentCallback hook to customize server requests.
     * The component emits 'saved', 'save-error' and 'validation-error' events,
     * depending on success of the function. You can subscribe to those or use
     * the promise's return value and catch the errors in a try-catch block.
     * @throws an error if something went wrong
     * @returns the contentId and metadata of the saved content
     */
    save = async () => {
        if (this.editorInstance === undefined) {
            this.dispatchAndThrowError('save-error', 'editorInstance of h5p editor not defined.');
        }
        if (!this.saveContentCallback) {
            this.dispatchAndThrowError('save-error', 'saveContentCallback of H5P Editor Web Component not defined.');
        }
        // Get parameters (and also validates them as a side effect)
        const params = this.editorInstance.getParams();
        if (!params.params) {
            this.dispatchAndThrowError('validation-error', 'The parameters entered by the user are invalid.');
        }
        // Validate mandatory main title. Prevent submitting if that's not set.
        // Deliberately doing it after getParams(), so that any other validation
        // problems are also revealed.
        if (!this.editorInstance.isMainTitleSet()) {
            this.dispatchAndThrowError('validation-error', "The main title of the content hasn't been set.");
        }
        let content;
        try {
            content = await new Promise((res, rej) => {
                // By calling getContent we also upgrade the content (this
                // is an unexpected side effect)
                this.editorInstance.getContent((c) => {
                    res(c);
                }, (err) => {
                    rej(err);
                });
            });
        }
        catch (error) {
            this.dispatchAndThrowError('validation-error', error.toString());
        }
        let saveResponseObject;
        const requestBody = {
            library: content.library,
            params: JSON.parse(content.params)
        };
        try {
            saveResponseObject = await this.saveContentCallback(this.contentId === 'new' ? undefined : this.contentId, requestBody);
        }
        catch (error) {
            this.dispatchAndThrowError('save-error', error.message);
        }
        if (this.contentId !== saveResponseObject.contentId) {
            this.setAttribute('content-id', saveResponseObject.contentId);
        }
        this.dispatchEvent(new CustomEvent('saved', {
            detail: {
                contentId: saveResponseObject.contentId,
                metadata: saveResponseObject.metadata
            }
        }));
        return saveResponseObject;
    };
    /**
     * Dispatches an event of the specified name and throws an error whose error
     * message starts with the eventName.
     * @param eventName
     * @param message
     */
    dispatchAndThrowError(eventName, message) {
        this.dispatchEvent(new CustomEvent(eventName, {
            detail: {
                message
            }
        }));
        throw new Error(`${eventName}: ${message}`);
    }
    /**
     * Called by the global H5P event dispatcher when any editor was loaded.
     */
    onEditorLoaded = (event) => {
        // We must manually check if our editor instance is initialized, as the
        // event is only sent globally.
        if (this.editorInstance.selector.form) {
            this.dispatchEvent(new CustomEvent('editorloaded', {
                detail: { contentId: this.contentId, ubername: event.data }
            }));
            // After our editor has been initialized, it will never fire the
            // global event again, so we can unsubscribe from it.
            if (window.H5P?.externalDispatcher) {
                window.H5P.externalDispatcher.off('editorloaded', this.onEditorLoaded);
            }
        }
    };
    /**
     * Displays the editor inside the component by creating a new DOM tree.
     * @param contentId the content id to display or undefined if a new piece
     * of content was created
     */
    async render(contentId) {
        if (!this.loadContentCallback) {
            return;
        }
        if (!contentId) {
            return;
        }
        let editorModel;
        try {
            editorModel = await this.loadContentCallback(contentId === 'new' ? undefined : contentId);
        }
        catch (error) {
            this.root.innerHTML = `<p>Error loading H5P content from server: ${error.message}`;
            return;
        }
        // Reset DOM tree inside component.
        this.root.innerHTML = '';
        // We have to prevent H5P from initializing when the h5p.js file is
        // loaded.
        if (!window.H5P) {
            window.H5P = {};
        }
        window.H5P.preventInit = true;
        // We merge the H5P integration we received from the server with the one
        // that already exists in the window globally to allow for several H5P
        // content objects on a single page.
        mergeH5PIntegration(editorModel.integration, contentId === 'new' ? undefined : contentId);
        // As the editor adds an iframe anyway and styles don't really matter, we
        // only add the global editor scripts to the whole page, but not the styles
        // (to avoid side effects).
        await addScripts(editorModel.scripts, document.getElementsByTagName('head')[0]);
        // Create the necessary DOM tree.
        const h5pCreateDiv = document.createElement('div');
        h5pCreateDiv.className = 'h5p-create';
        h5pCreateDiv.hidden = true;
        this.root.appendChild(h5pCreateDiv);
        const h5pEditorDiv = document.createElement('div');
        h5pEditorDiv.className = 'h5p-editor';
        h5pCreateDiv.appendChild(h5pEditorDiv);
        // Set up the H5P core editor.
        H5PEditor.getAjaxUrl = (action, parameters) => {
            let url = editorModel.integration.editor.ajaxPath + action;
            if (parameters !== undefined) {
                for (const property in parameters) {
                    if (Object.prototype.hasOwnProperty.call(parameters, property)) {
                        url = `${url}&${property}=${parameters[property]}`;
                    }
                }
            }
            url += window.location.search.replace(/\\?/g, '&');
            return url;
        };
        window.H5P.preventInit = false;
        // Only initialize H5P once to avoid resetting values.
        if (!window.h5pIsInitialized) {
            window.H5P.init(this.root);
            window.h5pIsInitialized = true;
        }
        // Register our global editorloaded event handler.
        if (window.H5P.externalDispatcher) {
            window.H5P.externalDispatcher.on('editorloaded', this.onEditorLoaded, this);
        }
        // Configure the H5P core editor.
        H5PEditor.$ = window.H5P.jQuery;
        H5PEditor.basePath = editorModel.integration.editor.libraryUrl;
        H5PEditor.fileIcon = editorModel.integration.editor.fileIcon;
        H5PEditor.ajaxPath = editorModel.integration.editor.ajaxPath;
        H5PEditor.filesPath = editorModel.integration.editor.filesPath;
        H5PEditor.apiVersion = editorModel.integration.editor.apiVersion;
        H5PEditor.contentLanguage = editorModel.integration.editor.language;
        H5PEditor.copyrightSemantics =
            editorModel.integration.editor.copyrightSemantics;
        H5PEditor.metadataSemantics =
            editorModel.integration.editor.metadataSemantics;
        H5PEditor.assets = editorModel.integration.editor.assets;
        H5PEditor.baseUrl = '';
        H5PEditor.contentId = contentId === 'new' ? undefined : contentId;
        H5PEditor.enableContentHub =
            editorModel.integration.editor.enableContentHub || false;
        if (contentId === 'new') {
            // Create an empty editor for new content
            this.editorInstance = new ns.Editor(undefined, undefined, h5pEditorDiv);
        }
        else {
            // Load the editor with populated parameters for existing content
            this.editorInstance = new ns.Editor(editorModel.library, JSON.stringify({
                metadata: editorModel.metadata,
                params: editorModel.params
            }), h5pEditorDiv);
        }
        h5pCreateDiv.hidden = false;
    }
}
//# sourceMappingURL=h5p-editor.js.map