"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const h5p_server_1 = require("@lumieducation/h5p-server");
const log = new h5p_server_1.Logger('MongoContentUserDataStorage');
/**
 * MongoDB storage for user data and finished data.
 *
 * It is highly recommended to call `createIndexes` on initialization.
 */
class MongoContentUserDataStorage {
    userDataCollection;
    finishedCollection;
    /**
     * @param userDataCollection a MongoDB collection (read- and writable)
     * @param finishedCollection a MongoDB collection (read- and writable)
     */
    constructor(userDataCollection, finishedCollection) {
        this.userDataCollection = userDataCollection;
        this.finishedCollection = finishedCollection;
        log.info('initialize');
    }
    /**
     * Creates indexes to speed up read access. Can be safely used even if
     * indexes already exist.
     */
    async createIndexes() {
        await this.userDataCollection.createIndexes([
            {
                key: {
                    contentId: 1
                }
            },
            {
                key: {
                    contentId: 1,
                    invalidate: 1
                }
            },
            {
                key: {
                    contentId: 1,
                    dataType: 1,
                    subContentId: 1,
                    userId: 1,
                    contextId: 1
                }
            },
            {
                key: {
                    userId: 1
                }
            },
            {
                key: {
                    contentId: 1,
                    userId: 1,
                    contextId: 1
                }
            }
        ]);
        await this.finishedCollection.createIndexes([
            {
                key: {
                    contentId: 1,
                    userId: 1
                }
            },
            {
                key: {
                    contentId: 1
                }
            },
            {
                key: {
                    userId: 1
                }
            }
        ]);
    }
    async getContentUserData(contentId, dataType, subContentId, userId, contextId) {
        log.debug(`getContentUserData: loading contentUserData for contentId ${contentId} and userId ${userId} and contextId ${contextId}`);
        return this.cleanMongoUserData(await this.userDataCollection.findOne({
            contentId,
            dataType,
            subContentId,
            userId: userId,
            contextId
        }));
    }
    async getContentUserDataByUser(user) {
        return (await this.userDataCollection
            .find({
            userId: user.id
        })
            .toArray())?.map(this.cleanMongoUserData);
    }
    async createOrUpdateContentUserData(userData) {
        await this.userDataCollection.replaceOne({
            contentId: userData.contentId,
            dataType: userData.dataType,
            subContentId: userData.subContentId,
            userId: userData.userId,
            contextId: userData.contextId
        }, {
            contentId: userData.contentId,
            dataType: userData.dataType,
            subContentId: userData.subContentId,
            userState: userData.userState,
            invalidate: userData.invalidate,
            preload: userData.preload,
            userId: userData.userId,
            contextId: userData.contextId
        }, { upsert: true });
    }
    async createOrUpdateFinishedData(finishedData) {
        await this.finishedCollection.replaceOne({
            contentId: finishedData.contentId,
            userId: finishedData.userId
        }, {
            contentId: finishedData.contentId,
            score: finishedData.score,
            maxScore: finishedData.maxScore,
            openedTimestamp: finishedData.openedTimestamp,
            finishedTimestamp: finishedData.finishedTimestamp,
            completionTime: finishedData.completionTime,
            userId: finishedData.userId
        }, { upsert: true });
    }
    async deleteInvalidatedContentUserData(contentId) {
        await this.userDataCollection.deleteMany({
            contentId,
            invalidate: true
        });
    }
    async deleteAllContentUserDataByUser(user) {
        await this.userDataCollection.deleteMany({
            userId: user.id
        });
    }
    async deleteAllContentUserDataByContentId(contentId) {
        await this.userDataCollection.deleteMany({
            contentId
        });
    }
    async getContentUserDataByContentIdAndUser(contentId, userId, contextId) {
        return (await this.userDataCollection
            .find({
            contentId,
            userId,
            contextId
        })
            .toArray())?.map(this.cleanMongoUserData);
    }
    async getFinishedDataByContentId(contentId) {
        return (await this.finishedCollection
            .find({ contentId })
            .toArray())?.map(this.cleanMongoFinishedData);
    }
    async getFinishedDataByUser(user) {
        return (await this.finishedCollection
            .find({ userId: user.id })
            .toArray())?.map(this.cleanMongoFinishedData);
    }
    async deleteFinishedDataByContentId(contentId) {
        await this.finishedCollection.deleteMany({ contentId });
    }
    async deleteFinishedDataByUser(user) {
        await this.finishedCollection.deleteMany({ userId: user.id });
    }
    /**
     * To avoid leaking internal MongoDB data (id), this method maps the data
     * we've received from Mongo to a new object.
     * @param mongoData the original data received by MongoDB
     * @returns the same data but with all Mongo-internal fields removed
     */
    cleanMongoUserData(mongoData) {
        if (!mongoData) {
            return mongoData;
        }
        return {
            dataType: mongoData.dataType,
            invalidate: mongoData.invalidate,
            preload: mongoData.preload,
            subContentId: mongoData.subContentId,
            userState: mongoData.userState,
            contentId: mongoData.contentId,
            userId: mongoData.userId,
            contextId: mongoData.contextId
        };
    }
    /**
     * To avoid leaking internal MongoDB data (id), this method maps the data
     * we've received from Mongo to a new object.
     * @param mongoData the original data received by MongoDB
     * @returns the same data but with all Mongo-internal fields removed
     */
    cleanMongoFinishedData(mongoData) {
        if (!mongoData) {
            return mongoData;
        }
        return {
            completionTime: mongoData.completionTime,
            contentId: mongoData.contentId,
            finishedTimestamp: mongoData.finishedTimestamp,
            maxScore: mongoData.maxScore,
            openedTimestamp: mongoData.openedTimestamp,
            score: mongoData.score,
            userId: mongoData.userId
        };
    }
}
exports.default = MongoContentUserDataStorage;
//# sourceMappingURL=MongoContentUserDataStorage.js.map