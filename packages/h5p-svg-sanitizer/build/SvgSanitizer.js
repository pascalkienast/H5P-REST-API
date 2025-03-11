"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dompurify_1 = __importDefault(require("dompurify"));
const jsdom_1 = require("jsdom");
const promises_1 = require("fs/promises");
const h5p_server_1 = require("@lumieducation/h5p-server");
const window = new jsdom_1.JSDOM('').window;
const DOMPurify = (0, dompurify_1.default)(window);
class SvgSanitizer {
    name = 'SVG Sanitizer based on dompurify package';
    async sanitize(file) {
        if (!file.endsWith('.svg')) {
            return h5p_server_1.FileSanitizerResult.Ignored;
        }
        const svgString = await (0, promises_1.readFile)(file, 'utf8');
        const sanitizedSvgString = DOMPurify.sanitize(svgString, {
            USE_PROFILES: { svg: true }
        });
        await (0, promises_1.writeFile)(file, sanitizedSvgString, 'utf8');
        return h5p_server_1.FileSanitizerResult.Sanitized;
    }
}
exports.default = SvgSanitizer;
//# sourceMappingURL=SvgSanitizer.js.map