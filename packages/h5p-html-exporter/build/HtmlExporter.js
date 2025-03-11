"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const postcss_1 = __importStar(require("postcss"));
const postcss_url_1 = __importDefault(require("postcss-url"));
const postcss_import_1 = __importDefault(require("postcss-import"));
const postcss_clean_1 = __importDefault(require("postcss-clean"));
const mime_types_1 = __importDefault(require("mime-types"));
const uglify_js_1 = __importDefault(require("uglify-js"));
const postcss_safe_parser_1 = __importDefault(require("postcss-safe-parser"));
const fs_1 = require("fs");
const upath_1 = __importDefault(require("upath"));
const promises_1 = require("fs/promises");
const h5p_server_1 = require("@lumieducation/h5p-server");
const postCssRemoveRedundantFontUrls_1 = __importDefault(require("./helpers/postCssRemoveRedundantFontUrls"));
const LibrariesFilesList_1 = __importDefault(require("./helpers/LibrariesFilesList"));
const framedTemplate_1 = __importDefault(require("./framedTemplate"));
const minimalTemplate_1 = __importDefault(require("./minimalTemplate"));
/**
 * This script is used to change the default behavior of H5P when it gets
 * resources dynamically from JavaScript. This works in most cases, but there
 * are some libraries (the H5P.SoundJS library used by single choice set) that
 * can't be modified that way.
 */
const getLibraryFilePathOverrideScript = uglify_js_1.default.minify((0, fs_1.readFileSync)(path_1.default.join(__dirname, 'loadFileOverrides.js'), {
    encoding: 'utf8'
})).code;
const getContentPathOverrideScript = uglify_js_1.default.minify(`H5P.getPath = function (path, contentId) {
        return path;
    };
    `).code;
/**
 * Creates standalone HTML packages that can be used to display H5P in a browser
 * without having to use the full H5P server backend.
 *
 * The bundle includes all JavaScript files, stylesheets, fonts of the H5P core
 * and all libraries used in the content. It also includes base64 encoded
 * resources used in the content itself. This can make the files seriously big,
 * if the content includes video files or lots of high-res images.
 *
 * The bundle does NOT internalize resources that are included in the content
 * via absolute URLs but only resources that are part of the H5P package.
 *
 * The HTML exports work with all content types on the official H5P Hub, but
 * there might be unexpected issues with other content types if they behave
 * weirdly and in any kind of non-standard way.
 *
 * The exported bundle contains license information for each file put into the
 * bundle in a shortened fashion (only includes author and license name and not
 * full license text).
 *
 * (important!) You need to install these NPM packages for the exporter to work:
 * postcss, postcss-clean, postcss-url, postcss-safe-parser, uglify-js
 */
class HtmlExporter {
    libraryStorage;
    contentStorage;
    config;
    coreFilePath;
    editorFilePath;
    template;
    /**
     * @param libraryStorage
     * @param contentStorage
     * @param config
     * @param coreFilePath the path on the local filesystem at which the H5P
     * core files can be found. (should contain a js and styles directory)
     * @param editorFilePath the path on the local filesystem at which the H5P
     * editor files can be found. (Should contain the scripts, styles and
     * ckeditor directories).
     */
    constructor(libraryStorage, contentStorage, config, coreFilePath, editorFilePath, template, translationFunction) {
        this.libraryStorage = libraryStorage;
        this.contentStorage = contentStorage;
        this.config = config;
        this.coreFilePath = coreFilePath;
        this.editorFilePath = editorFilePath;
        this.template = template;
        this.player = new h5p_server_1.H5PPlayer(this.libraryStorage, this.contentStorage, this.config, undefined, undefined, translationFunction);
        this.coreSuffix = `${this.config.baseUrl + this.config.coreUrl}/`;
        this.editorSuffix = `${this.config.baseUrl + this.config.editorLibraryUrl}/`;
        this.contentFileScanner = new h5p_server_1.ContentFileScanner(new h5p_server_1.LibraryManager(this.libraryStorage));
    }
    contentFileScanner;
    coreSuffix;
    defaultAdditionalScripts = [
        // The H5P core client creates paths to resource files using the
        // hostname of the current URL, so we have to make sure data: URLs
        // work.
        `const realH5PGetPath = H5P.getPath;
        H5P.getPath = function (path, contentId) {
            if(path.startsWith('data:')){
                return path;
            }
            else {
                return realH5PGetPath(path, contentId);
            }
        };`
    ];
    editorSuffix;
    player;
    /**
     * Creates a HTML file that contains **all** scripts, styles and library
     * resources (images and fonts) inline. All resources used inside the
     * content are only listed and must be retrieved from library storage by the
     * caller.
     * @param contentId a content id that can be found in the content repository
     * passed into the constructor
     * @param user the user who wants to create the bundle
     * @param contentResourcesPrefix (optional) if set, the prefix will be added
     * to all content files in the content's parameters; example:
     * contentResourcesPrefix = '123'; filename = 'images/image.jpg' => filename
     * in parameters: '123/images/image.jpg' (the directory separated is added
     * automatically)
     * @param options (optional) allows settings display options, e.g. if there
     * should be a embed button
     * @throws H5PError if there are access violations, missing files etc.
     * @returns a HTML string that can be written into a file and a list of
     * content files used by the content; you can use the filenames in
     * IContentStorage.getFileStream. Note that the returned filenames DO NOT
     * include the prefix, so that the caller doesn't have to remove it when
     * calling getFileStream.
     */
    async createBundleWithExternalContentResources(contentId, user, contentResourcesPrefix = '', options) {
        this.player.setRenderer(this.renderer({
            contentResources: 'files',
            core: 'inline',
            libraries: 'inline'
        }, {
            contentResourcesPrefix
        }));
        return this.player.render(contentId, user, options?.language ?? 'en', {
            showEmbedButton: options?.showEmbedButton,
            showFrame: options?.showEmbedButton || options?.showLicenseButton
                ? true
                : options?.showFrame,
            showLicenseButton: options?.showLicenseButton
        });
    }
    /**
     * Creates a single HTML file that contains **all** scripts, styles and
     * resources (images, videos, etc.) inline. This bundle will grow very large
     * if there are big videos in the content.
     * @param contentId a content id that can be found in the content repository
     * passed into the constructor
     * @param user the user who wants to create the bundle
     * @param options (optional) allows settings display options, e.g. if there
     * should be a embed button
     * @throws H5PError if there are access violations, missing files etc.
     * @returns a HTML string that can be written into a file
     */
    async createSingleBundle(contentId, user, options) {
        this.player.setRenderer(this.renderer({
            contentResources: 'inline',
            core: 'inline',
            libraries: 'inline'
        }));
        return (await this.player.render(contentId, user, options?.language ?? 'en', {
            showEmbedButton: options?.showEmbedButton,
            showFrame: options?.showEmbedButton || options?.showLicenseButton
                ? true
                : options?.showFrame,
            showLicenseButton: options?.showLicenseButton
        })).html;
    }
    /**
     * Finds all files in the content's parameters and returns them. Also
     * appends the prefix if necessary. Note: This method has a mutating effect
     * on model!
     * @param model
     * @param prefix this prefix will be added to all file references as
     * subdirectory
     */
    async findAndPrefixContentResources(model, prefix = '') {
        const content = model.integration.contents[`cid-${model.contentId}`];
        const params = JSON.parse(content.jsonContent);
        const mainLibraryUbername = content.library;
        const fileRefs = (await this.contentFileScanner.scanForFiles(params, h5p_server_1.LibraryName.fromUberName(mainLibraryUbername, {
            useWhitespace: true
        }))).filter((ref) => this.isLocalPath(ref.filePath));
        fileRefs.forEach((ref) => {
            ref.context.params.path = upath_1.default.join(prefix, ref.filePath);
        });
        model.integration.contents[`cid-${model.contentId}`].jsonContent =
            JSON.stringify(params);
        return fileRefs.map((ref) => ref.filePath);
    }
    /**
     * Generates JavaScript / CSS comments that includes license information
     * about a file. Includes: filename, author, license. Note that some H5P
     * libraries don't contain any license information.
     * @param filename
     * @param core
     * @param editor
     * @param library
     * @returns a multi-line comment with the license information. The comment
     * is marked as important and includes @license so that uglify-js and
     * postcss-clean leave it in.
     */
    async generateLicenseText(filename, core, editor, library) {
        if (core) {
            return `/*!@license ${filename} by Joubel and other contributors, licensed under GNU GENERAL PUBLIC LICENSE Version 3*/`;
        }
        if (editor) {
            return `/*!@license ${filename} by Joubel and other contributors, licensed under MIT license*/`;
        }
        if (library) {
            let { author, license } = await this.libraryStorage.getLibrary(library);
            if (!author || author === '') {
                author = 'unknown';
            }
            if (!license || license === '') {
                license = 'unknown license';
            }
            return `/*!@license ${h5p_server_1.LibraryName.toUberName(library)}/${filename} by ${author} licensed under ${license}*/`;
        }
        return '';
    }
    /**
     * Gets the contents of a file as a string. Only works for text files, not
     * binary files.
     * @param filename the filename as generated by H5PPlayer. This can be a
     * path to a) a core file b) an editor file c) a library file
     * @returns an object giving more detailed information about the file:
     * - core: true if the file is a core file, undefined otherwise
     * - editor: true if the file is an editor file, undefined otherwise
     * - library: the library name if the file is a library file, undefined
     *   otherwise
     * - filename: the filename if the suffix of the core/editor/library is
     *   stripped
     * - text: the text in the file
     */
    async getFileAsText(filename, usedFiles) {
        const libraryFileMatch = new RegExp(`^${this.config.baseUrl}${this.config.librariesUrl}/([\\w\\.]+)-(\\d+)\\.(\\d+)\\/(.+)$`).exec(filename);
        if (!libraryFileMatch) {
            if (filename.startsWith(this.coreSuffix)) {
                // Core files
                const filenameWithoutDir = this.removeQueryString(filename.substr(this.coreSuffix.length));
                return {
                    text: (await (0, promises_1.readFile)(path_1.default.resolve(this.coreFilePath, filenameWithoutDir))).toString(),
                    core: true,
                    filename: filenameWithoutDir
                };
            }
            if (filename.startsWith(this.editorSuffix)) {
                // Editor files
                const filenameWithoutDir = this.removeQueryString(filename.substr(this.editorSuffix.length));
                return {
                    text: (await (0, promises_1.readFile)(path_1.default.resolve(this.editorFilePath, filenameWithoutDir))).toString(),
                    editor: true,
                    filename: filenameWithoutDir
                };
            }
        }
        else {
            // Library files
            const library = {
                machineName: libraryFileMatch[1],
                majorVersion: Number.parseInt(libraryFileMatch[2], 10),
                minorVersion: Number.parseInt(libraryFileMatch[3], 10)
            };
            const filenameWithoutDir = this.removeQueryString(libraryFileMatch[4]);
            usedFiles.addFile(library, filenameWithoutDir);
            return {
                text: await (0, h5p_server_1.streamToString)(await this.libraryStorage.getFileStream(library, filenameWithoutDir)),
                library,
                filename: filenameWithoutDir
            };
        }
        throw Error(`Unknown file pattern: ${filename} is neither a library file, a core file or an editor file.`);
    }
    /**
     * Creates a big minified bundle of all script files in the model
     * @param model
     * @param additionalScripts an array of scripts (actual script code as
     * string, not filenames!) that should be appended at the end of the bundle
     * @returns all scripts in a single bundle
     */
    async getScriptBundle(model, usedFiles, additionalScripts = []) {
        const texts = {};
        await Promise.all(model.scripts.map(async (script) => {
            const { text, filename, core, editor, library } = await this.getFileAsText(script, usedFiles);
            const licenseText = await this.generateLicenseText(filename, core, editor, library);
            // We must escape </script> tags inside scripts.
            texts[script] =
                licenseText + text.replace(/<\/script>/g, '<\\/script>');
        }));
        const scripts = model.scripts
            .map((script) => texts[script])
            .concat(additionalScripts);
        return uglify_js_1.default.minify(scripts, {
            output: { comments: 'some' },
            module: false
        }).code;
    }
    /**
     * Creates a big minified bundle of all style files in the model. Also
     * internalizes all url(...) resources in the styles.
     * @param model
     * @returns all styles in a single bundle
     */
    async getStylesBundle(model, usedFiles) {
        const styleTexts = {};
        await Promise.all(model.styles.map(async (style) => {
            const { text, filename, library, editor, core } = await this.getFileAsText(style, usedFiles);
            const licenseText = await this.generateLicenseText(filename, core, editor, library);
            let processedCss = '';
            const pCss = (0, postcss_1.default)(
            // add support for @import statements in CSS
            (0, postcss_import_1.default)({
                resolve: (importedFile) => {
                    // Here, we need to return the path of the file that
                    // is passed to `load`. As we use our own
                    // `getFileAsText` in `load`, we need to add the
                    // directory of the file that is importing. That way
                    // we preserve the origin of the file (core, editor,
                    // library).
                    return upath_1.default.join(path_1.default.dirname(style), importedFile);
                },
                load: async (importedFile) => {
                    const { text: txt } = await this.getFileAsText(importedFile, usedFiles);
                    return txt;
                },
                plugins: [
                    // We need to add the plugins redundantly, as the
                    // files inside the imported css files also need to
                    // be parsed.
                    (0, postCssRemoveRedundantFontUrls_1.default)(undefined, library
                        ? (f) => {
                            usedFiles.addFile(library, upath_1.default.join(path_1.default.dirname(filename), f));
                        }
                        : undefined),
                    (0, postcss_url_1.default)({
                        url: this.urlInternalizer(
                        // Even though we don't operate on the file
                        // but on a file that is imported, we pass
                        // in the filename here, as it's only used
                        // to determine the file's parent directory.
                        filename, library, editor, core, usedFiles)
                    }),
                    (0, postcss_clean_1.default)()
                ]
            }), (0, postCssRemoveRedundantFontUrls_1.default)(undefined, library
                ? (f) => {
                    usedFiles.addFile(library, upath_1.default.join(path_1.default.dirname(filename), f));
                }
                : undefined), (0, postcss_url_1.default)({
                url: this.urlInternalizer(filename, library, editor, core, usedFiles)
            }), (0, postcss_clean_1.default)());
            let oldCwd;
            try {
                // This is a workaround for a bug in path.relative in
                // Windows. If the current working directory includes the
                // Turkish İ character, the resulting relative path is
                // broken. We work around this by temporarily changing the
                // working directory to the root. See
                // https://github.com/Lumieducation/H5P-Nodejs-library/issues/1679#issuecomment-909344236
                if (process.platform === 'win32') {
                    oldCwd = process.cwd();
                    process.chdir('c:');
                }
                try {
                    processedCss = (await pCss.process(licenseText + text, {
                        from: filename
                    }))?.css;
                }
                catch (error) {
                    // We retry with a more tolerant CSS parser if parsing has
                    // failed with the regular one.
                    if (error instanceof postcss_1.CssSyntaxError) {
                        processedCss = (await pCss.process(licenseText + text, {
                            parser: postcss_safe_parser_1.default,
                            from: filename
                        }))?.css;
                    }
                    else {
                        throw error;
                    }
                }
            }
            finally {
                // Part of the workaround explained above.
                if (process.platform === 'win32' && oldCwd) {
                    process.chdir(oldCwd);
                }
            }
            styleTexts[style] = processedCss;
        }));
        return model.styles.map((style) => styleTexts[style]).join('\n');
    }
    /**
     * Gets base64 encoded contents of library files that have not been used in
     * the bundle so far. Ignores files that are only used by the editor.
     * @param libraries the libraries for which to get files
     * @returns an object with the filenames of files as keys and base64 strings
     * as values
     */
    async getUnusedLibraryFiles(libraries, usedFiles) {
        const result = {};
        await Promise.all(libraries.map(async (library) => {
            const ubername = h5p_server_1.LibraryName.toUberName(library);
            const allLibraryFiles = await this.libraryStorage.listFiles(library);
            const unusedLibraryFiles = allLibraryFiles.filter((filename) => {
                if (!usedFiles.checkFile(library, filename) &&
                    !filename.startsWith('language/') &&
                    (filename !== 'library.json' ||
                        // We allow the library.json file for timeline
                        // as it's needed at runtime.
                        ubername.startsWith('H5P.Timeline-')) &&
                    filename !== 'semantics.json' &&
                    filename !== 'icon.svg' &&
                    filename !== 'upgrades.js' &&
                    filename !== 'presave.js') {
                    const mt = mime_types_1.default.lookup(path_1.default.basename(filename));
                    if (filename.endsWith('.js') ||
                        filename.endsWith('.css') ||
                        filename.endsWith('.json') ||
                        (mt &&
                            (mt.startsWith('audio/') ||
                                mt.startsWith('video/') ||
                                mt.startsWith('image/')) &&
                            !filename.includes('font'))) {
                        return true;
                    }
                }
                return false;
            });
            await Promise.all(unusedLibraryFiles.map(async (unusedFile) => {
                result[`${ubername}/${unusedFile}`] =
                    `data:${mime_types_1.default.lookup(path_1.default.basename(unusedFile))};base64,${await (0, h5p_server_1.streamToString)(await this.libraryStorage.getFileStream(library, unusedFile), 'base64')}`;
            }));
        }));
        return result;
    }
    /**
     * Changes the content params by internalizing all files references with
     * base64 data strings. Has a side effect on contents[cid-xxx]!
     * @param model
     */
    async internalizeContentResources(model) {
        const content = model.integration.contents[`cid-${model.contentId}`];
        const params = JSON.parse(content.jsonContent);
        const mainLibraryUbername = content.library;
        const contentFiles = await this.contentFileScanner.scanForFiles(params, h5p_server_1.LibraryName.fromUberName(mainLibraryUbername, {
            useWhitespace: true
        }));
        await Promise.all(contentFiles.map(async (fileRef) => {
            if (this.isLocalPath(fileRef.filePath)) {
                try {
                    const base64 = await (0, h5p_server_1.streamToString)(await this.contentStorage.getFileStream(model.contentId, fileRef.filePath, model.user), 'base64');
                    const mimetype = fileRef.mimeType ||
                        mime_types_1.default.lookup(path_1.default.extname(fileRef.filePath));
                    fileRef.context.params.path = `data:${mimetype};base64,${base64}`;
                }
                catch (error) {
                    // We silently ignore errors, as there might be cases in
                    // which YouTube links are not detected correctly.
                }
            }
        }));
        content.jsonContent = JSON.stringify(params);
        content.contentUrl = '.';
        content.url = '.';
    }
    /**
     * Returns true if the filename is not an absolute URL or empty.
     * @param filename
     */
    isLocalPath = (filename) => !(filename === '' ||
        filename.toLocaleLowerCase().startsWith('http://') ||
        filename.toLocaleLowerCase().startsWith('https://'));
    removeQueryString(filename) {
        const questionMarkIndex = filename.indexOf('?');
        if (questionMarkIndex >= 0) {
            return filename.substring(0, questionMarkIndex);
        }
        return filename;
    }
    /**
     * Creates HTML strings out of player models.
     * @param model the player model created by H5PPlayer
     * @returns a string with HTML markup
     */
    renderer = (mode, options) => async (model) => {
        if (mode.core === 'files') {
            throw new Error('Core mode "files" not supported yet.');
        }
        if (mode.libraries === 'files') {
            throw new Error('Library mode "files" not supported yet.');
        }
        const usedFiles = new LibrariesFilesList_1.default();
        // eslint-disable-next-line prefer-const
        let [scriptsBundle, stylesBundle] = await Promise.all([
            this.getScriptBundle(model, usedFiles, this.defaultAdditionalScripts),
            this.getStylesBundle(model, usedFiles),
            mode?.contentResources === 'inline'
                ? this.internalizeContentResources(model)
                : undefined
        ]);
        // Look for files in the libraries which haven't been included in the
        // bundle so far.
        const unusedFiles = await this.getUnusedLibraryFiles(model.dependencies, usedFiles);
        // If there are files in the directory of a library that haven't been
        // included in the bundle yet, we add those as base64 encoded variables
        // and rewire H5P.ContentType.getLibraryFilePath to return these files
        // as data urls. (needed for resource files of H5P.BranchingScenario)
        if (Object.keys(unusedFiles).length) {
            scriptsBundle = scriptsBundle.concat(` var furtherH5PInlineResources=${JSON.stringify(unusedFiles)};`, getLibraryFilePathOverrideScript);
        }
        // If the user wants to put content resources into files, we must get
        // these files and
        let contentFiles;
        if (mode.contentResources === 'files') {
            contentFiles = await this.findAndPrefixContentResources(model, options?.contentResourcesPrefix);
            scriptsBundle = scriptsBundle.concat(getContentPathOverrideScript);
        }
        let template;
        if (this.template) {
            // Caller has overriden the template
            template = this.template;
        }
        else {
            if (model.integration.contents[`cid-${model.contentId}`]
                ?.displayOptions?.frame === true) {
                // display the standard H5P frame around the content
                template = framedTemplate_1.default;
            }
            else {
                // nothing around the content
                template = minimalTemplate_1.default;
            }
        }
        const html = template({
            ...model.integration,
            baseUrl: '.',
            url: '.',
            ajax: { setFinished: '', contentUserData: '' },
            saveFreq: false,
            libraryUrl: ''
        }, scriptsBundle, stylesBundle, model.contentId);
        return { html, contentFiles };
    };
    /**
     * A factory method that returns functions that can be passed to the url
     * option of postcss-url. The function returns the base64 encoded resource.
     * @param filename the filename of the css file being internalized
     * @param library the library name if the css file is a library file
     * @param editor true if the css file is a editor file
     * @param core true if the css file is a core file
     * @param asset the object received from the postcss-url plugin call
     */
    urlInternalizer = (filename, library, editor, core, usedFiles) => async (asset) => {
        // If a url already is internalized we simply return it
        if (asset.url.startsWith('data:') && asset.url.includes('base64')) {
            return asset.url;
        }
        const mimetype = mime_types_1.default.lookup(path_1.default.extname(asset.relativePath));
        if (library) {
            const p = upath_1.default.join(path_1.default.dirname(filename), asset.relativePath);
            try {
                usedFiles.addFile(library, p);
                return `data:${mimetype};base64,${await (0, h5p_server_1.streamToString)(await this.libraryStorage.getFileStream(library, p), 'base64')}`;
            }
            catch {
                // There are edge cases in which there are non-existent files in
                // stylesheets as placeholders (H5P.BranchingScenario), so we
                // have to leave them in.
                return asset.relativePath;
            }
        }
        if (editor || core) {
            const basePath = editor
                ? path_1.default.join(this.editorFilePath, 'styles')
                : path_1.default.join(this.coreFilePath, 'styles');
            return `data:${mimetype};base64,${await (0, promises_1.readFile)(path_1.default.resolve(basePath, asset.relativePath), 'base64')}`;
        }
        return undefined;
    };
}
exports.default = HtmlExporter;
//# sourceMappingURL=HtmlExporter.js.map