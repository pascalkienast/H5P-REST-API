"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const clamscan_1 = __importDefault(require("clamscan"));
const ts_deepmerge_1 = require("ts-deepmerge");
const h5p_server_1 = require("@lumieducation/h5p-server");
const helpers_1 = require("./helpers");
const log = new h5p_server_1.Logger('ClamAVScanner');
/**
 * A light wrapper calling the ClamAV scanner to scan files for malware. It
 * utilizes the `clamscan` package.
 *
 * Note: You need to have a ClamAV running somewhere to use this and you must
 * update ClamAVs virus definitions regularly yourself from outside this class.
 */
class ClamAVScanner {
    scanner;
    /**
     * We have no public constructor, as we need to initialize the ClamAV
     * scanner asynchronously.
     * @param scanner
     */
    constructor(scanner) {
        this.scanner = scanner;
        log.debug('initialize');
    }
    name = 'ClamAV virus scanner';
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
    static async create(clamavOptions) {
        const envVarOptions = ClamAVScanner.getEnvVarOptions();
        // Because of how the clamscan package checks for the presence of the
        // properties in the options object (Object.prototype.hasOwnProperty:
        // "The hasOwnProperty() method returns true if the specified property
        // is a direct property of the object — even if the value is null or
        // undefined."), we have to remove undefined properties from the
        // options.
        const options = (0, helpers_1.removeUndefinedAttributesAndEmptyObjects)((0, ts_deepmerge_1.merge)({
            removeInfected: false,
            quarantineInfected: false,
            scanRecursively: false
        }, clamavOptions ?? {}, envVarOptions ?? {}));
        log.debug('Initializing ClamAV scanner with options:', options);
        const clamScan = await new clamscan_1.default().init(options);
        log.debug('ClamAV scanner initialized. Version:', await clamScan.getVersion());
        return new ClamAVScanner(clamScan);
    }
    /**
     * Gets the ClamAV options from environment variables (CLAMSCAN_* and
     * CLAMDSCAN_*). See the docs for what the options do.
     */
    static getEnvVarOptions() {
        // general configuration
        const scanLog = process.env.CLAMSCAN_SCAN_LOG;
        const debugMode = process.env.CLAMSCAN_DEBUG_MODE
            ? process.env.CLAMSCAN_DEBUG_MODE === 'true'
            : undefined;
        const preference = process.env.CLAMSCAN_PREFERENCE;
        // configuration for clamscan (binary)
        const clamscanPath = process.env.CLAMSCAN_PATH;
        const clamscanDb = process.env.CLAMSCAN_DB;
        const clamscanScanArchives = process.env.CLAMSCAN_SCAN_ARCHIVES
            ? process.env.CLAMSCAN_SCAN_ARCHIVES === 'true'
            : undefined;
        const clamscanActive = process.env.CLAMSCAN_ACTIVE
            ? process.env.CLAMSCAN_ACTIVE === 'true'
            : undefined;
        // configuration for clamdscan (daemon with UNIX socket / TCP)
        const clamdscanSocket = process.env.CLAMDSCAN_SOCKET;
        const clamdscanHost = process.env.CLAMDSCAN_HOST;
        const clamdscanPort = process.env.CLAMDSCAN_PORT
            ? Number.parseInt(process.env.CLAMDSCAN_PORT, 10)
            : undefined;
        const clamdscanTimeout = process.env.CLAMDSCAN_TIMEOUT
            ? Number.parseInt(process.env.CLAMDSCAN_TIMEOUT, 10)
            : undefined;
        const clamdscanLocalFallback = process.env.CLAMDSCAN_LOCAL_FALLBACK
            ? process.env.CLAMDSCAN_LOCAL_FALLBACK === 'true'
            : undefined;
        const clamdscanPath = process.env.CLAMDSCAN_PATH;
        const clamdscanConfigFile = process.env.CLAMDSCAN_CONFIG_FILE;
        const clamdscanMultiscan = process.env.CLAMDSCAN_MULTISCAN
            ? process.env.CLAMDSCAN_MULTISCAN === 'true'
            : undefined;
        const clamdscanReloadDb = process.env.CLAMDSCAN_RELOAD_DB
            ? process.env.CLAMDSCAN_RELOAD_DB === 'true'
            : undefined;
        const scanLogOptions = {
            clamscan: {
                path: clamscanPath,
                db: clamscanDb,
                scanArchives: clamscanScanArchives,
                active: clamscanActive
            },
            clamdscan: {
                socket: clamdscanSocket,
                host: clamdscanHost,
                port: clamdscanPort,
                timeout: clamdscanTimeout,
                localFallback: clamdscanLocalFallback,
                path: clamdscanPath,
                configFile: clamdscanConfigFile,
                multiscan: clamdscanMultiscan,
                reloadDb: clamdscanReloadDb
            },
            preference,
            debugMode,
            scanLog
        };
        return scanLogOptions;
    }
    async scan(file) {
        try {
            log.debug('Scanning uploaded file', file, 'with malware scanner', this.name);
            const result = await this.scanner.isInfected(file);
            if (result.isInfected) {
                const viruses = result.viruses.join(',');
                log.info('Uploaded file', file, 'is infected with:', viruses);
                return { result: h5p_server_1.MalwareScanResult.MalwareFound, viruses };
            }
            log.debug('Uploaded file', file, 'is clean');
            return { result: h5p_server_1.MalwareScanResult.Clean };
        }
        catch (error) {
            log.error('Error while scanning file', file, error);
            return { result: h5p_server_1.MalwareScanResult.NotScanned };
        }
    }
}
exports.default = ClamAVScanner;
//# sourceMappingURL=ClamAVScanner.js.map