"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const simple_redis_mutex_1 = require("simple-redis-mutex");
const h5p_server_1 = require("@lumieducation/h5p-server");
const log = new h5p_server_1.Logger('RedisLockProvider');
class RedisLockProvider {
    redis;
    options;
    constructor(redis, options) {
        this.redis = redis;
        this.options = options;
        log.debug('initialize');
    }
    async acquire(key, callback, options) {
        let unlock;
        try {
            log.debug(`Attempting to acquire lock for key ${key}.`);
            unlock = await (0, simple_redis_mutex_1.lock)(this.redis, key, {
                timeout: options.maxOccupationTime, // confusingly the names are reversed
                failAfter: options.timeout, // confusingly the names are reversed
                pollingInterval: this.options?.retryTime ?? 5
            });
        }
        catch (error) {
            if (error.message.startsWith('Lock could not be acquire for')) {
                // the spelling mistake was made in the library...
                log.debug(`There was a timeout when trying to acquire key for ${key}`);
                throw new Error('timeout');
            }
        }
        try {
            let timeout;
            let cancelPromise;
            const timeoutPromise = new Promise((res, rej) => {
                cancelPromise = rej;
                timeout = setTimeout(() => {
                    res('occupation-time-exceeded');
                }, options.maxOccupationTime);
            });
            log.debug(`Acquired lock for key ${key}. Calling operation.`);
            const result = await Promise.race([timeoutPromise, callback()]);
            if (typeof result === 'string' &&
                result === 'occupation-time-exceeded') {
                log.debug(`The operation holding the lock for key ${key} took longer than allowed. Lock was released by Redis.`);
                throw new Error('occupation-time-exceeded');
            }
            log.debug(`Operation for lock key ${key} has finished.`);
            clearTimeout(timeout);
            cancelPromise();
            return result;
        }
        finally {
            log.debug(`Releasing lock for key ${key}`);
            if (unlock) {
                await unlock();
            }
        }
    }
}
exports.default = RedisLockProvider;
//# sourceMappingURL=RedisLockProvider.js.map