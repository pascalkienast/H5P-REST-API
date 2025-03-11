"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
const LogicChecker_1 = require("../LogicChecker");
const log = (0, debug_1.default)('h5p:SharedStateServer:performCommitLogicChecks');
exports.default = (validatorRepository) => async (context, next) => {
    const agent = context.agent.custom;
    const user = agent.user;
    if (agent.fromServer) {
        log('letting op from server pass through');
        return next();
    }
    if (!user && !agent.fromServer) {
        return next(new Error('No user data in submit request'));
    }
    if (agent.libraryMetadata.state?.snapshotLogicChecks) {
        const snapshotLogicCheck = await validatorRepository.getSnapshotLogicCheck(agent.libraryMetadata);
        if (!(0, LogicChecker_1.checkLogic)({
            snapshot: context.snapshot.data,
            params: agent.params,
            context: {
                user: agent.user,
                permission: agent.permission
            }
        }, snapshotLogicCheck)) {
            log("rejecting change as snapshot doesn't conform to logic checks");
            return next("Snapshot doesn't conform to logic checks");
        }
    }
    log('commit logic checks passed');
    next();
};
//# sourceMappingURL=performCommitLogicChecks.js.map