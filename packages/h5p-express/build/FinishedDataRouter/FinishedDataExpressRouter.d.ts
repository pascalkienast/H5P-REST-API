import { Router } from 'express';
import { ContentUserDataManager, IH5PConfig } from '@lumieducation/h5p-server';
/**
 * This router implements necessary routes for setFinished to work. If you only
 * want certain routes, you can specify this in the options parameter.
 * @param options sets if you want and how to handle errors
 * @param languageOverride the language to use when returning errors. Only has
 * an effect if you use the i18next http middleware, as it relies on
 * req.i18n.changeLanguage to be present. Defaults to auto, which means the a
 * language detector must have detected language and req.t translated to the
 * detected language.
 */
export default function (contentUserDataManager: ContentUserDataManager, config: IH5PConfig, options?: {
    handleErrors: boolean;
}, languageOverride?: string | 'auto'): Router;
