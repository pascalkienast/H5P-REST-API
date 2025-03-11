import MongoDB from 'mongodb';
import { ContentId, IContentUserDataStorage, IUser, IContentUserData, IFinishedUserData } from '@lumieducation/h5p-server';
/**
 * MongoDB storage for user data and finished data.
 *
 * It is highly recommended to call `createIndexes` on initialization.
 */
export default class MongoContentUserDataStorage implements IContentUserDataStorage {
    private userDataCollection;
    private finishedCollection;
    /**
     * @param userDataCollection a MongoDB collection (read- and writable)
     * @param finishedCollection a MongoDB collection (read- and writable)
     */
    constructor(userDataCollection: MongoDB.Collection<IContentUserData>, finishedCollection: MongoDB.Collection<IFinishedUserData>);
    /**
     * Creates indexes to speed up read access. Can be safely used even if
     * indexes already exist.
     */
    createIndexes(): Promise<void>;
    getContentUserData(contentId: ContentId, dataType: string, subContentId: string, userId: string, contextId?: string): Promise<IContentUserData>;
    getContentUserDataByUser(user: IUser): Promise<IContentUserData[]>;
    createOrUpdateContentUserData(userData: IContentUserData): Promise<void>;
    createOrUpdateFinishedData(finishedData: IFinishedUserData): Promise<void>;
    deleteInvalidatedContentUserData(contentId: string): Promise<void>;
    deleteAllContentUserDataByUser(user: IUser): Promise<void>;
    deleteAllContentUserDataByContentId(contentId: ContentId): Promise<void>;
    getContentUserDataByContentIdAndUser(contentId: ContentId, userId: string, contextId?: string): Promise<IContentUserData[]>;
    getFinishedDataByContentId(contentId: string): Promise<IFinishedUserData[]>;
    getFinishedDataByUser(user: IUser): Promise<IFinishedUserData[]>;
    deleteFinishedDataByContentId(contentId: string): Promise<void>;
    deleteFinishedDataByUser(user: IUser): Promise<void>;
    /**
     * To avoid leaking internal MongoDB data (id), this method maps the data
     * we've received from Mongo to a new object.
     * @param mongoData the original data received by MongoDB
     * @returns the same data but with all Mongo-internal fields removed
     */
    private cleanMongoUserData;
    /**
     * To avoid leaking internal MongoDB data (id), this method maps the data
     * we've received from Mongo to a new object.
     * @param mongoData the original data received by MongoDB
     * @returns the same data but with all Mongo-internal fields removed
     */
    private cleanMongoFinishedData;
}
