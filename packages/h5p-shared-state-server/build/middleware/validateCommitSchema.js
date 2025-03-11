"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
const log = (0, debug_1.default)('h5p:SharedStateServer:validateCommitSchema');
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
    if (agent.libraryMetadata.state?.snapshotSchema) {
        const snapshotSchemaValidator = await validatorRepository.getSnapshotSchemaValidator(agent.libraryMetadata);
        if (!snapshotSchemaValidator(context.snapshot.data)) {
            log("rejecting change as resulting state doesn't conform to schema");
            return next("Resulting state doesn't conform to schema");
        }
    }
    log('commit schema validation passed');
    next();
};
//# sourceMappingURL=validateCommitSchema.js.map