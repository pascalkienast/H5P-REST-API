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
exports.default = default_1;
const express_1 = __importDefault(require("express"));
const H5P = __importStar(require("@lumieducation/h5p-server"));
/**
 * @param h5pEditor
 * @param h5pPlayer
 * @param languageOverride the language to use. Set it to 'auto' to use the
 * language set by a language detector in the req.language property.
 * (recommended)
 */
function default_1(h5pEditor, h5pPlayer, languageOverride = 'auto') {
    const router = express_1.default.Router();
    router.get(`/:contentId/play`, async (req, res) => {
        try {
            const content = await h5pPlayer.render(req.params.contentId, req.user, languageOverride === 'auto'
                ? (req.language ?? 'en')
                : languageOverride, {
                // We pass through the contextId here to illustrate how
                // to work with it. Context ids allow you to have
                // multiple user states per content object. They are
                // purely optional. You should *NOT* pass the contextId
                // to the render method if you don't need contextIds!
                contextId: typeof req.query.contextId === 'string'
                    ? req.query.contextId
                    : undefined,
                // You can impersonate other users to view their content
                // state by setting the query parameter asUserId.
                // Example:
                // `/h5p/play/XXXX?asUserId=YYY`
                asUserId: typeof req.query.asUserId === 'string'
                    ? req.query.asUserId
                    : undefined,
                // You can disabling saving of the user state, but still
                // display it by setting the query parameter
                // `readOnlyState` to `yes`. This is useful if you want
                // to review other users' states by setting `asUserId`
                // and don't want to change their state.
                // Example:
                // `/h5p/play/XXXX?readOnlyState=yes`
                readOnlyState: typeof req.query.readOnlyState === 'string'
                    ? req.query.readOnlyState === 'yes'
                    : undefined
            });
            res.status(200).send(content);
        }
        catch (error) {
            console.error(error);
            res.status(error.httpStatusCode ? error.httpStatusCode : 500).send(error.message);
        }
    });
    router.get('/:contentId/edit', async (req, res) => {
        // This route merges the render and the /ajax/params routes to avoid a
        // second request.
        const editorModel = (await h5pEditor.render(req.params.contentId === 'undefined'
            ? undefined
            : req.params.contentId, languageOverride === 'auto'
            ? (req.language ?? 'en')
            : languageOverride, req.user));
        if (!req.params.contentId || req.params.contentId === 'undefined') {
            res.status(200).send(editorModel);
        }
        else {
            const content = await h5pEditor.getContent(req.params.contentId, req.user);
            res.status(200).send({
                ...editorModel,
                library: content.library,
                metadata: content.params.metadata,
                params: content.params.params
            });
        }
    });
    router.post('/', async (req, res) => {
        if (!req.body.params ||
            !req.body.params.params ||
            !req.body.params.metadata ||
            !req.body.library ||
            !req.user) {
            res.status(400).send('Malformed request');
            return;
        }
        const { id: contentId, metadata } = await h5pEditor.saveOrUpdateContentReturnMetaData(undefined, req.body.params.params, req.body.params.metadata, req.body.library, req.user);
        res.status(200).json({ contentId, metadata });
    });
    router.patch('/:contentId', async (req, res) => {
        if (!req.body.params ||
            !req.body.params.params ||
            !req.body.params.metadata ||
            !req.body.library ||
            !req.user) {
            res.status(400).send('Malformed request');
            return;
        }
        const { id: contentId, metadata } = await h5pEditor.saveOrUpdateContentReturnMetaData(req.params.contentId.toString(), req.body.params.params, req.body.params.metadata, req.body.library, req.user);
        res.status(200).json({ contentId, metadata });
    });
    router.delete('/:contentId', async (req, res) => {
        try {
            await h5pEditor.deleteContent(req.params.contentId, req.user);
        }
        catch (error) {
            console.error(error);
            return res
                .status(500)
                .send(`Error deleting content with id ${req.params.contentId}: ${error.message}`);
        }
        res.status(200).send(`Content ${req.params.contentId} successfully deleted.`);
    });
    router.get('/', async (req, res) => {
        let contentObjects;
        try {
            const contentIds = await h5pEditor.contentManager.listContent(req.user);
            contentObjects = await Promise.all(contentIds.map(async (id) => ({
                content: await h5pEditor.contentManager.getContentMetadata(id, req.user),
                id
            })));
        }
        catch (error) {
            if (error instanceof H5P.H5pError) {
                return res
                    .status(error.httpStatusCode)
                    .send(`${error.message}`);
            }
            else {
                return res.status(500).send(`Unknown error: ${error.message}`);
            }
        }
        res.status(200).send(contentObjects.map((o) => ({
            contentId: o.id,
            title: o.content.title,
            mainLibrary: o.content.mainLibrary
        })));
    });
    return router;
}
//# sourceMappingURL=routes.js.map