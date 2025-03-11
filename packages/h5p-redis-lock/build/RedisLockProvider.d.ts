import { createClient } from '@redis/client';
import { ILockProvider } from '@lumieducation/h5p-server';
export default class RedisLockProvider implements ILockProvider {
    private redis;
    private options?;
    constructor(redis: ReturnType<typeof createClient>, options?: {
        retryTime?: number;
    });
    acquire<T>(key: string, callback: () => Promise<T>, options: {
        timeout: number;
        maxOccupationTime: number;
    }): Promise<T>;
}
