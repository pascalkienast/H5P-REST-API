"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyManager = exports.apiKeyAuth = exports.finishedDataExpressRouter = exports.contentUserDataExpressRouter = exports.contentTypeCacheExpressRouter = exports.libraryAdministrationExpressRouter = exports.h5pAjaxExpressRouter = void 0;
const H5PAjaxExpressRouter_1 = __importDefault(require("./H5PAjaxRouter/H5PAjaxExpressRouter"));
exports.h5pAjaxExpressRouter = H5PAjaxExpressRouter_1.default;
const LibraryAdministrationExpressRouter_1 = __importDefault(require("./LibraryAdministrationRouter/LibraryAdministrationExpressRouter"));
exports.libraryAdministrationExpressRouter = LibraryAdministrationExpressRouter_1.default;
const ContentUserDataExpressRouter_1 = __importDefault(require("./ContentUserDataRouter/ContentUserDataExpressRouter"));
exports.contentUserDataExpressRouter = ContentUserDataExpressRouter_1.default;
const ContentTypeCacheExpressRouter_1 = __importDefault(require("./ContentTypeCacheRouter/ContentTypeCacheExpressRouter"));
exports.contentTypeCacheExpressRouter = ContentTypeCacheExpressRouter_1.default;
const FinishedDataExpressRouter_1 = __importDefault(require("./FinishedDataRouter/FinishedDataExpressRouter"));
exports.finishedDataExpressRouter = FinishedDataExpressRouter_1.default;
const apiKeyAuth_1 = require("./middleware/apiKeyAuth");
Object.defineProperty(exports, "apiKeyAuth", { enumerable: true, get: function () { return apiKeyAuth_1.apiKeyAuth; } });
const apiKeyManager_1 = require("./middleware/apiKeyManager");
Object.defineProperty(exports, "ApiKeyManager", { enumerable: true, get: function () { return apiKeyManager_1.ApiKeyManager; } });
//# sourceMappingURL=index.js.map