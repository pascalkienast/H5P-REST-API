import {
    IRequestWithLanguage,
    IRequestWithUser,
    IActionRequest
} from './expressTypes';
import h5pAjaxExpressRouter from './H5PAjaxRouter/H5PAjaxExpressRouter';
import libraryAdministrationExpressRouter from './LibraryAdministrationRouter/LibraryAdministrationExpressRouter';
import contentUserDataExpressRouter from './ContentUserDataRouter/ContentUserDataExpressRouter';
import contentTypeCacheExpressRouter from './ContentTypeCacheRouter/ContentTypeCacheExpressRouter';
import finishedDataExpressRouter from './FinishedDataRouter/FinishedDataExpressRouter';
import { apiKeyAuth, ApiKeyConfig } from './middleware/apiKeyAuth';
import { ApiKeyManager, ApiKeyManagerOptions } from './middleware/apiKeyManager';

export {
    IRequestWithLanguage,
    IRequestWithUser,
    IActionRequest,
    h5pAjaxExpressRouter,
    libraryAdministrationExpressRouter,
    contentTypeCacheExpressRouter,
    contentUserDataExpressRouter,
    finishedDataExpressRouter,
    // API Key Authentication
    apiKeyAuth,
    ApiKeyConfig,
    ApiKeyManager,
    ApiKeyManagerOptions
};
