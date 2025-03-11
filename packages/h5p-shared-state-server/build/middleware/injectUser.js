"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
const log = (0, debug_1.default)('h5p:SharedStateServer:injectUser');
/**
 * Injects the user information from the request into the sharedb context
 */
exports.default = async (context, next) => {
    log('Connected client');
    if (context.req) {
        context.agent.custom = {
            user: context.req.user,
            fromServer: false
            // indicates if this a real user request from the client or
            // an internal request created by the server itself
        };
    }
    else {
        log('Client resides on the server');
        context.agent.custom = { fromServer: true };
    }
    next();
};
//# sourceMappingURL=injectUser.js.map