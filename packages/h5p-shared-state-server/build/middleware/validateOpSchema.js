"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
const log = (0, debug_1.default)('h5p:SharedStateServer:validateOpSchema');
exports.default = (validatorRepository) => async (context, next) => {
    const agent = context.agent.custom;
    log('submit %O', context.op);
    if (agent.fromServer) {
        log('Letting op from server pass through');
        return next();
    }
    if (context.op && agent.libraryMetadata.state?.opSchema) {
        const opSchemaValidator = await validatorRepository.getOpSchemaValidator(agent.libraryMetadata);
        if (!opSchemaValidator({
            op: context.op.op,
            create: context.op.create
        })) {
            log("Rejecting change as op doesn't conform to schema");
            log('Error log: %O', opSchemaValidator.errors);
            return next("Op doesn't conform to schema");
        }
    }
    log('Op schema validation passed');
    next();
};
//# sourceMappingURL=validateOpSchema.js.map