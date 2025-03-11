"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
const LogicChecker_1 = require("../LogicChecker");
const log = (0, debug_1.default)('h5p:SharedStateServer:performOpLogicChecks');
exports.default = (validatorRepository) => async (context, next) => {
    const agent = context.agent.custom;
    if (agent.fromServer) {
        log('Letting op from server pass through');
        return next();
    }
    if (context.op && agent.libraryMetadata.state?.opLogicChecks) {
        const opLogicCheck = await validatorRepository.getOpLogicCheck(agent.libraryMetadata);
        if (!(0, LogicChecker_1.checkLogic)({
            op: context.op.op,
            create: context.op.create,
            params: agent.params,
            context: {
                user: agent.user,
                permission: agent.permission
            },
            snapshot: context.snapshot?.data
        }, opLogicCheck)) {
            log("Rejecting change as op doesn't conform to logic checks");
            return next("Op doesn't conform to logic checks");
        }
    }
    log('Op logic checks passed');
    next();
};
//# sourceMappingURL=performOpLogicChecks.js.map