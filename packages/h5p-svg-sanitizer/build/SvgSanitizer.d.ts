import { FileSanitizerResult, IFileSanitizer } from '@lumieducation/h5p-server';
export default class SvgSanitizer implements IFileSanitizer {
    readonly name: string;
    sanitize(file: string): Promise<FileSanitizerResult>;
}
