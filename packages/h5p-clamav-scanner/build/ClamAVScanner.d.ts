import NodeClam from 'clamscan';
import { IFileMalwareScanner, MalwareScanResult } from '@lumieducation/h5p-server';
/**
 * A light wrapper calling the ClamAV scanner to scan files for malware. It
 * utilizes the `clamscan` package.
 *
 * Note: You need to have a ClamAV running somewhere to use this and you must
 * update ClamAVs virus definitions regularly yourself from outside this class.
 */
export default class ClamAVScanner implements IFileMalwareScanner {
    private scanner;
    /**
     * We have no public constructor, as we need to initialize the ClamAV
     * scanner asynchronously.
     * @param scanner
     */
    private constructor();
    readonly name: string;
    /**
     * Factory method to create a new instance of ClamAVScanner. You can't use
     * the constructor directly, as we need to initialize the ClamAV scanner
     * asynchronously.
     * @param clamavOptions the options as required by the ClamAV scanner (see
     * https://www.npmjs.com/package/clamscan). This is simply passed through to
     * ClamAV, expect for the parameters `removeInfected`, `quarantineInfected`
     * and `scanRecursively`: these are set to false to make sure the behavior
     * is as @lumieducation/h5p-server expects it.
     */
    static create(clamavOptions?: NodeClam.Options): Promise<ClamAVScanner>;
    /**
     * Gets the ClamAV options from environment variables (CLAMSCAN_* and
     * CLAMDSCAN_*). See the docs for what the options do.
     */
    private static getEnvVarOptions;
    scan(file: string): Promise<{
        result: MalwareScanResult;
        viruses?: string;
    }>;
}
